import { z } from 'zod';
import { mfbZodResolver } from './mfbZodResolver';
import { collectFieldErrors, labelForCode } from './errorLabels';

// The two pieces that make specific error reasons flow to screener_form_error:
// mfbZodResolver stamps each custom rule's params.code onto the RHF error as
// `errorCode`, and collectFieldErrors turns the error tree into "field: label"
// pairs. These assert the analytics contract that silently regresses otherwise.

describe('mfbZodResolver', () => {
  // Return errors as `any` — these tests assert dynamic per-field shapes the
  // resolver's union return type ({} | FieldErrors) doesn't narrow to.
  const call = async (schema: z.ZodType<any>, values: any): Promise<any> => {
    const { errors } = await mfbZodResolver(schema)(values, undefined, {
      fields: {},
      shouldUseNativeValidation: false,
    } as any);
    return errors;
  };

  it('stamps a custom rule code onto a top-level field error', async () => {
    const schema = z.object({
      insurance: z.boolean().refine((v) => v === true, { message: 'pick one', params: { code: 'select_one' } }),
    });
    const errors = await call(schema, { insurance: false });
    expect(errors.insurance?.errorCode).toBe('select_one');
  });

  it('stamps the code at the correct nested/array leaf', async () => {
    const schema = z.object({
      members: z.array(
        z.object({
          income: z.string().refine((v) => v.length > 0, { message: 'bad', params: { code: 'invalid_amount' } }),
        }),
      ),
    });
    const errors = await call(schema, { members: [{ income: 'ok' }, { income: '' }] });
    // Only the second member's income should carry the code.
    expect(errors.members?.[1]?.income?.errorCode).toBe('invalid_amount');
    expect(errors.members?.[0]).toBeUndefined();
  });

  it('is first-wins when a path has two coded refines (matches zodResolver)', async () => {
    // Two custom refines on the same field. zodResolver keeps the first issue;
    // the stamped errorCode should align with it, not the last one in the loop.
    const schema = z.object({
      v: z
        .string()
        .refine(() => false, { message: 'a', params: { code: 'first_code' } })
        .refine(() => false, { message: 'b', params: { code: 'second_code' } }),
    });
    const errors = await call(schema, { v: 'x' });
    expect(errors.v?.errorCode).toBe('first_code');
  });

  it('leaves standard (non-custom) errors untouched — no errorCode', async () => {
    const schema = z.object({ name: z.string().min(1) });
    const errors = await call(schema, { name: '' });
    expect(errors.name?.errorCode).toBeUndefined();
    expect(errors.name?.type).toBe('too_small');
  });
});

describe('collectFieldErrors', () => {
  it('prefers errorCode over a bare custom type', () => {
    const tree = { tcpa: { type: 'custom', message: 'x', errorCode: 'consent_required' } };
    expect(collectFieldErrors(tree)).toEqual(['tcpa: Consent required']);
  });

  it('falls back to the zod type when there is no errorCode', () => {
    const tree = { zip: { type: 'too_small', message: 'x' } };
    expect(collectFieldErrors(tree)).toEqual(['zip: Required']);
  });

  it('recurses into nested/array errors to the real leaf', () => {
    const tree = { members: { 0: { birthYear: { type: 'too_big', message: 'x' } } } };
    expect(collectFieldErrors(tree)).toEqual(['members.0.birthYear: Too long']);
  });

  it('maps an unknown code to Invalid', () => {
    expect(labelForCode('something_new')).toBe('Invalid');
    expect(collectFieldErrors({ f: { errorCode: 'something_new' } })).toEqual(['f: Invalid']);
  });
});
