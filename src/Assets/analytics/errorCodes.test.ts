import { z } from 'zod';
import { mfbZodResolver } from './mfbZodResolver';
import { buildFormErrorEvents, collectFieldErrors, labelForCode } from './errorLabels';

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
    expect(collectFieldErrors(tree)).toEqual([{ field: 'tcpa', reason: 'Consent required' }]);
  });

  it('falls back to the zod type when there is no errorCode', () => {
    const tree = { zip: { type: 'too_small', message: 'x' } };
    expect(collectFieldErrors(tree)).toEqual([{ field: 'zip', reason: 'Required' }]);
  });

  it('recurses into nested/array errors to the real leaf, normalizing the array index', () => {
    const tree = { members: { 0: { birthYear: { type: 'too_big', message: 'x' } } } };
    // The `0` index segment is dropped so the field path is canonical.
    expect(collectFieldErrors(tree)).toEqual([{ field: 'members.birthYear', reason: 'Too long' }]);
  });

  it('collapses indexed and array-level paths to the same canonical field', () => {
    // The same field can surface two ways: an indexed element error and an
    // array-level error. Both must report the identical `field`.
    const indexed = { members: { 2: { birthYear: { type: 'too_small', message: 'x' } } } };
    const arrayLevel = { members: { birthYear: { type: 'too_small', message: 'x' } } };
    expect(collectFieldErrors(indexed)[0].field).toBe('members.birthYear');
    expect(collectFieldErrors(arrayLevel)[0].field).toBe('members.birthYear');
  });

  it('emits one entry per failed field (no joined string) so no param is truncated', () => {
    const tree = {
      birthYear: { type: 'too_small', message: 'x' },
      healthInsurance: { errorCode: 'select_one', message: 'y' },
    };
    const result = collectFieldErrors(tree);
    expect(result).toHaveLength(2);
    expect(result).toContainEqual({ field: 'birthYear', reason: 'Required' });
    expect(result).toContainEqual({ field: 'healthInsurance', reason: 'Must select an option' });
  });

  it('maps an unknown code to Invalid', () => {
    expect(labelForCode('something_new')).toBe('Invalid');
    expect(collectFieldErrors({ f: { errorCode: 'something_new' } })).toEqual([{ field: 'f', reason: 'Invalid' }]);
  });
});

describe('buildFormErrorEvents', () => {
  it('emits one event per failed field, each with field/reason and the field count', () => {
    const tree = {
      birthYear: { type: 'too_small', message: 'x' },
      healthInsurance: { errorCode: 'select_one', message: 'y' },
    };
    const events = buildFormErrorEvents(tree, 2);
    expect(events).toEqual([
      { form_field_name: 'birthYear', form_error_reason: 'Required', form_error_count: 2 },
      { form_field_name: 'healthInsurance', form_error_reason: 'Must select an option', form_error_count: 2 },
    ]);
  });

  it('counts failed field instances, not RHF top-level keys', () => {
    // Three members failing birthYear: RHF has ONE top-level `members` key, but
    // there are three failed field instances. Paths normalize to the same
    // canonical field, and the count reflects the three instances — NOT RHF's
    // top-level key count.
    const tree = {
      members: {
        0: { birthYear: { type: 'too_small', message: 'x' } },
        1: { birthYear: { type: 'too_small', message: 'x' } },
        2: { birthYear: { type: 'too_small', message: 'x' } },
      },
    };
    const events = buildFormErrorEvents(tree, 1);
    expect(events).toHaveLength(3);
    expect(events.every((e) => e.form_field_name === 'members.birthYear')).toBe(true);
    expect(events.every((e) => e.form_error_count === 3)).toBe(true);
  });

  it('emits one fallback event when errors exist but no leaf resolves', () => {
    // An error node with no type/errorCode anywhere: collectFieldErrors returns
    // []. Since the caller says there ARE errors, a single fallback carries the
    // top-level count so the submit still registers rather than emitting nothing.
    const unresolvable = { weird: { message: 'no type or code here' } };
    expect(collectFieldErrors(unresolvable)).toEqual([]);
    expect(buildFormErrorEvents(unresolvable, 3)).toEqual([{ form_error_count: 3 }]);
  });

  it('emits nothing when there are no errors at all', () => {
    expect(buildFormErrorEvents({}, 0)).toEqual([]);
  });
});
