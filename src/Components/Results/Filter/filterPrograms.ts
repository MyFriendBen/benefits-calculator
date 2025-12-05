import {
  calculatedCitizenshipFilters,
  FilterState,
} from './citizenshipFilterConfig';
import { FormData } from '../../../Types/FormData';
import { Program } from '../../../Types/Results';
import { programValue } from '../FormattedValue';
import { findMemberEligibilityMember } from '../Results';

/**
 * Safe clone helper that falls back to JSON clone when structuredClone is not available
 */
const clone = <T>(obj: T): T =>
  typeof structuredClone === 'function' ? structuredClone(obj) : JSON.parse(JSON.stringify(obj));

/**
 * Gets the names of filters that are currently active
 * Optimized for single-select: returns main citizenship + calculated filters
 */
function getActiveFilterNames(filterState: FilterState): string[] {
  const filters: string[] = [filterState.selectedCitizenship];
  filterState.calculatedFilters.forEach(filter => filters.push(filter));
  return filters;
}

/**
 * Updates member eligibility based on calculated citizenship filters.
 * This modifies members who don't meet calculated filter conditions.
 */
function updateMemberEligibilities(
  programs: Program[],
  formData: FormData,
  filterState: FilterState
): Program[] {
  const selectedCitizenship = filterState.selectedCitizenship;

  return clone(programs).map(program => {
    // If program meets legal status with the selected citizenship, no need to check members
    const meetsBasicLegalStatus = program.legal_status_required.includes(selectedCitizenship);

    if (meetsBasicLegalStatus) {
      return program;
    }

    // Check each member against calculated filters
    for (const memberEligibility of program.members) {
      const member = findMemberEligibilityMember(formData, memberEligibility);

      let memberMeetsAnyCondition = false;
      let hasApplicableConditions = false;

      // Check all active calculated citizenship filters
      for (const calculatedFilter of filterState.calculatedFilters) {
        // Skip if program doesn't require this citizenship status
        if (!program.legal_status_required.includes(calculatedFilter)) {
          continue;
        }

        hasApplicableConditions = true;

        const calculator = calculatedCitizenshipFilters[calculatedFilter];
        if (calculator.func(member)) {
          memberMeetsAnyCondition = true;
          break; // Found one condition that passes, no need to check others
        }
      }

      // If member has applicable conditions but meets none, mark ineligible
      if (hasApplicableConditions && !memberMeetsAnyCondition) {
        memberEligibility.value = 0;
        memberEligibility.eligible = false;
      }
    }

    return program;
  });
}

/**
 * Checks if a program meets basic visibility requirements (ignoring exclusions)
 */
function isProgramBasicallyVisible(
  program: Program,
  checkedFilterNames: string[]
): boolean {
  return (
    program.legal_status_required.some((status) => checkedFilterNames.includes(status)) &&
    program.eligible &&
    programValue(program) > 0 &&
    !program.already_has
  );
}

/**
 * Applies basic filtering to programs (legal status, eligibility, value, already_has)
 */
function applyBasicFilters(
  programs: Program[],
  filterState: FilterState,
  isAdminView: boolean
): Program[] {
  // Admin view shows all programs regardless of filters
  if (isAdminView) {
    return programs;
  }

  const activeFilterNames = getActiveFilterNames(filterState);

  return programs.filter(program =>
    isProgramBasicallyVisible(program, activeFilterNames)
  );
}

/**
 * Applies program exclusion rules to filter out mutually exclusive programs.
 * Handles mutual exclusions by keeping the first program encountered in the array.
 */
function applyProgramExclusions(programs: Program[], isAdminView: boolean): Program[] {
  // Admin view shows all programs, including those that would be excluded
  if (isAdminView) {
    return programs;
  }

  // Build set of program IDs that should be excluded
  const excludedProgramIds = new Set<number>();
  
  for (const program of programs) {
    // Skip if this program is already excluded
    if (excludedProgramIds.has(program.program_id)) {
      continue;
    }
    
    // Mark programs excluded by this program for removal
    if (program.excludes_programs) {
      for (const excludedId of program.excludes_programs) {
        excludedProgramIds.add(excludedId);
      }
    }
  }
  
  return programs.filter(program => 
    !excludedProgramIds.has(program.program_id)
  );
}

export default function filterProgramsGenerator(
  formData: FormData,
  filterState: FilterState,
  isAdminView: boolean
) {
  return (programs: Program[]) => {
    // Step 1: Update member eligibility based on calculated filters
    const updatedPrograms = updateMemberEligibilities(programs, formData, filterState);
    // Step 2: Apply basic visibility filters
    const visiblePrograms = applyBasicFilters(updatedPrograms, filterState, isAdminView);
    // Step 3: Apply program exclusions
    return applyProgramExclusions(visiblePrograms, isAdminView);
  };
}
