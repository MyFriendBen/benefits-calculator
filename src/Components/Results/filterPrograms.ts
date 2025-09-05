import {
  CalculatedCitizenLabel,
  calculatedCitizenshipFilters,
  CitizenLabels,
} from '../../Assets/citizenshipFilterFormControlLabels';
import { FormData } from '../../Types/FormData';
import { Program } from '../../Types/Results';
import { programValue } from './FormattedValue';
import { findMemberEligibilityMember } from './Results';

export default function filterProgramsGenerator(
  formData: FormData,
  filtersChecked: Record<CitizenLabels, boolean>,
  isAdminView: boolean,
  allPrograms: Program[],
) {
  function updateMemberEligibility(program: Program) {
    // Check if one of the non calculated filters is checked
    // then we don't apply any more calculations
    const filtersCheckedStrArr = Object.entries(filtersChecked)
      .filter(([key, value]) => {
        if (key in calculatedCitizenshipFilters) {
          return false;
        }

        return value;
      })
      .map(([key, _]) => key);

    const meetsLegalStatus = program.legal_status_required.some((status) => filtersCheckedStrArr.includes(status));

    if (meetsLegalStatus) {
      return program;
    }

    for (const memberEligibility of program.members) {
      const member = findMemberEligibilityMember(formData, memberEligibility);

      let meetsCondition = false;
      let hasMemberCondition = false;

      for (const [filterNameUntyped, calculator] of Object.entries(calculatedCitizenshipFilters)) {
        const filterName = filterNameUntyped as CalculatedCitizenLabel;

        // If the filter is not checked don't calculate eligibility
        if (filtersChecked[filterName] === false) {
          continue;
        }

        // If the program does not require the citizenship status don't calculate eligibility
        if (program.legal_status_required.every((status) => status !== filterName)) {
          continue;
        }

        hasMemberCondition = true;

        if (calculator.func(member)) {
          meetsCondition = true;
        }
      }

      // Make members ineligble if they don't meet any of the conditions
      // and at least one of the condtions is being used
      if (hasMemberCondition && !meetsCondition) {
        memberEligibility.value = 0;
        memberEligibility.eligible = false;
      }
    }

    return program;
  }

  return (programs: Program[]) => {
    // Update member eligibility first
    const updatedPrograms = structuredClone(programs).map(updateMemberEligibility);

    // Build a reverse exclusion map: programId -> list of program ids that exclude it
    const reverseExcludes = new Map<number, number[]>();
    for (const program of updatedPrograms) {
      if (program.excludes_programs) {
        for (const excludedId of program.excludes_programs) {
          const excluders = reverseExcludes.get(excludedId) || [];
          excluders.push(program.program_id);
          reverseExcludes.set(excludedId, excluders);
        }
      }
    }

    // Build a map from program id to program for quick lookups
    const programById = new Map<number, Program>();
    for (const program of updatedPrograms) {
      programById.set(program.program_id, program);
    }

    // Cached visibility results
    const programVisibility = new Map<number, boolean>();
    // Track in-progress calculations to detect cycles
    const inProgress = new Set<number>();

    const filtersCheckedStrArr = Object.entries(filtersChecked)
      .filter((filterKeyValPair) => filterKeyValPair[1])
      .map((filteredKeyValPair) => filteredKeyValPair[0]);

    function isProgramVisibleById(programId: number): boolean {
      // Check cache first
      if (programVisibility.has(programId)) {
        return programVisibility.get(programId)!;
      }

      // Detect cycles - if we're already computing this program's visibility, 
      // break the cycle by returning false
      if (inProgress.has(programId)) {
        return false;
      }

      const program = programById.get(programId);
      if (!program) {
        return false;
      }

      // Mark as in progress to detect cycles
      inProgress.add(programId);

      // Admin view shows everything
      if (isAdminView) {
        programVisibility.set(programId, true);
        inProgress.delete(programId);
        return true;
      }

      // Basic visibility checks
      const meetsLegalStatus = program.legal_status_required.some((status) =>
        filtersCheckedStrArr.includes(status)
      );
      const isEligible = program.eligible;
      const hasValue = programValue(program) > 0;
      const doesNotHave = !program.already_has;

      const basicVisible = meetsLegalStatus && isEligible && hasValue && doesNotHave;

      if (!basicVisible) {
        programVisibility.set(programId, false);
        inProgress.delete(programId);
        return false;
      }

      // Check if excluded by another visible program
      const excluders = reverseExcludes.get(programId) || [];
      for (const excluderId of excluders) {
        if (isProgramVisibleById(excluderId)) {
          programVisibility.set(programId, false);
          inProgress.delete(programId);
          return false;
        }
      }

      programVisibility.set(programId, true);
      inProgress.delete(programId);
      return true;
    }

    // Filter using the id-based visibility check
    return updatedPrograms.filter(program => isProgramVisibleById(program.program_id));
  };
}
