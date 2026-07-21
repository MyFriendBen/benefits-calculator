import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver, FieldValues } from 'react-hook-form';
import type { ZodType } from 'zod';

// Drop-in wrapper around zodResolver that preserves a stable per-rule code for
// custom validators. The stock resolver maps each RHF field error to
// { message, type: issue.code } and DROPS issue.params — so every .refine() /
// .superRefine() lands as type 'custom' with no way to tell which rule failed.
//
// This wrapper re-runs the schema with safeParse, reads each issue's
// params.code (set on the custom validators), and stamps it onto the matching
// field error as `errorCode`, keyed by the issue path. collectErrors
// (stepForm.tsx) reads `errorCode` for a specific, PII-safe reason — falling
// back to the zod `type` for standard rules. Transparent for schemas with no
// params.code, so it is safe to use everywhere zodResolver was used.
//
// PRIVACY: only the code token travels (e.g. 'select_one'), never the localized
// message or the entered value.

const setByPath = (obj: Record<string, any>, path: (string | number)[], code: string) => {
  let node = obj;
  for (let i = 0; i < path.length; i++) {
    const key = path[i];
    if (node == null || typeof node !== 'object') return;
    if (i === path.length - 1) {
      if (node[key] && typeof node[key] === 'object') node[key].errorCode = code;
    } else {
      node = node[key];
    }
  }
};

export function mfbZodResolver<T extends FieldValues>(schema: ZodType<any, any, any>): Resolver<T> {
  const base = zodResolver(schema) as Resolver<T>;
  return async (values, context, options) => {
    const result = await base(values, context, options);
    // Only enrich when there are errors to enrich.
    if (result.errors && Object.keys(result.errors).length > 0) {
      const parsed = schema.safeParse(values);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          // `params` exists only on custom issues; read it defensively since the
          // base ZodIssue type doesn't declare it.
          const code = (issue as { params?: { code?: string } }).params?.code;
          if (code) setByPath(result.errors as Record<string, any>, issue.path, code);
        }
      }
    }
    return result;
  };
}
