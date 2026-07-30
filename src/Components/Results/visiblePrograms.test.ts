/**
 * The `visible_programs` derivation (MFB-1427).
 *
 * BenBot may only recommend from the list this produces, so it has to equal what the
 * page renders. The page renders `programCategories`; an earlier revision derived this
 * from the flat `programs` array instead, and the two provably diverge because
 * `applyProgramExclusions` is order-dependent and runs separately over each.
 *
 * The logic under test lives in a `useMemo` in Results.tsx. It's reproduced here rather
 * than exported because extracting it would mean touching the component's render path
 * for test-only reasons; the duplication is three lines and this file exists to pin the
 * *properties* that matter.
 */
import { Program, ProgramCategory } from '../../Types/Results';
import { programValue } from './FormattedValue';
import { createProgram } from './testHelpers';
import { AssistantVisibleProgram } from '../../apiCalls';

/** Mirror of the derivation in Results.tsx. */
function deriveVisiblePrograms(programCategories: Pick<ProgramCategory, 'programs'>[]): AssistantVisibleProgram[] {
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

const category = (...programs: Program[]) => ({ programs });

const program = (id: number, name: string, householdValue: number) =>
  createProgram({ program_id: id, name_abbreviated: name, household_value: householdValue, members: [] });

describe('visible_programs derivation', () => {
  it('reports every rendered program', () => {
    const result = deriveVisiblePrograms([
      category(program(1, 'co_snap', 6636), program(2, 'co_wic', 1224)),
      category(program(3, 'co_lifeline', 111)),
    ]);

    expect(result.map((p) => p.name_abbreviated)).toEqual(['co_snap', 'co_wic', 'co_lifeline']);
  });

  it('carries the annual programValue for each', () => {
    const result = deriveVisiblePrograms([category(program(1, 'co_snap', 6636))]);

    expect(result).toEqual([{ name_abbreviated: 'co_snap', value: 6636 }]);
  });

  it('dedupes a program appearing in more than one category', () => {
    // Legitimate — the same program can be listed under two categories. Sending it
    // twice would let the later entry override the first program's value server-side.
    const snap = program(1, 'co_snap', 6636);
    const result = deriveVisiblePrograms([category(snap, program(2, 'co_wic', 1224)), category(snap)]);

    expect(result.map((p) => p.name_abbreviated)).toEqual(['co_snap', 'co_wic']);
  });

  it('nets out members who already hold the coverage', () => {
    // This is why the value is taken from programValue rather than the snapshot: the
    // card shows the reduced figure, so BenBot must quote the reduced figure.
    const partiallyCovered = createProgram({
      program_id: 1,
      name_abbreviated: 'co_medicaid',
      household_value: 0,
      members: [
        { frontend_id: 'a', eligible: true, value: 1760, already_has: false },
        { frontend_id: 'b', eligible: true, value: 1760, already_has: true },
        { frontend_id: 'c', eligible: true, value: 1760, already_has: false },
      ],
    });

    const result = deriveVisiblePrograms([category(partiallyCovered)]);

    expect(result[0].value).toBe(3520);
  });

  it('is empty when nothing is rendered', () => {
    // Distinct from "no list available" — an empty array tells the backend the results
    // page is genuinely showing nothing.
    expect(deriveVisiblePrograms([])).toEqual([]);
    expect(deriveVisiblePrograms([category()])).toEqual([]);
  });

  it('does not include a program that no category renders', () => {
    // A program present in the flat `programs` array but in no category is never drawn
    // (Programs.tsx iterates categories), so reporting it would over-claim.
    const rendered = program(1, 'co_snap', 6636);
    const orphan = program(2, 'co_orphan', 500);

    const result = deriveVisiblePrograms([category(rendered)]);

    expect(result.map((p) => p.name_abbreviated)).not.toContain(orphan.name_abbreviated);
  });
});
