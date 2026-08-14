import { ProgramCategory } from '../../Types/Results';
import { AssistantVisibleProgram } from '../../apiCalls';
import { programValue } from './FormattedValue';

/**
 * The programs BenBot is allowed to recommend from, derived from what the results page
 * is actually rendering (MFB-1427).
 *
 * Takes `programCategories`, NOT the flat `programs` array, because that's what the page
 * draws (`Programs.tsx` iterates categories). The two provably diverge:
 * `applyProgramExclusions` is order-dependent — "keeping the first program encountered in
 * the array" — and runs once over the flat list and again per category, where the ordering
 * differs (category order is a separate ID list from the API, and each category is then
 * re-sorted by value). A mutually-exclusive pair can therefore survive as A globally and B
 * per-category, so the page would render B while BenBot was told A. Cross-category
 * exclusions and programs belonging to no category diverge too.
 *
 * `value` is `programValue()` — the ANNUAL figure, which nets out members who already hold
 * the program's insurance. The card shows this divided by 12 with "/month" for the default
 * `value_format`; annual is what the backend contract carries.
 *
 * Deduped by `program_id` because the same program can legitimately appear in more than
 * one category, and sending it twice would let the later entry decide its value
 * server-side.
 *
 * Lives in its own module so it can be unit-tested directly rather than reproduced in the
 * test file — this is the load-bearing claim of the ticket, and a copy in the test would
 * pass while the component drifted.
 */
export function deriveVisiblePrograms(
  programCategories: Pick<ProgramCategory, 'programs'>[],
): AssistantVisibleProgram[] {
  const seen = new Map<number, AssistantVisibleProgram>();

  for (const category of programCategories) {
    for (const program of category.programs) {
      if (!seen.has(program.program_id)) {
        seen.set(program.program_id, {
          name_abbreviated: program.name_abbreviated,
          value: programValue(program),
        });
      }
    }
  }

  return [...seen.values()];
}
