import {
  CalculatedCitizenLabel,
  calculatedCitizenshipFilters,
  CitizenLabels,
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
 * Gets the names of filters that are currently checked
 */
function getCheckedFilterNames(filtersChecked: Record<CitizenLabels, boolean>): string[] {
  return Object.entries(filtersChecked)
    .filter(([_, isChecked]) => isChecked)
    .map(([filterName]) => filterName);
}

/**
 * Gets the names of non-calculated filters that are currently checked
 */
function getCheckedNonCalculatedFilterNames(filtersChecked: Record<CitizenLabels, boolean>): string[] {
  return Object.entries(filtersChecked)
    .filter(([filterName, isChecked]) => isChecked && !(filterName in calculatedCitizenshipFilters))
    .map(([filterName]) => filterName);
}

/**
 * Updates member eligibility based on calculated citizenship filters.
 * This modifies members who don't meet calculated filter conditions.
 */
function updateMemberEligibilities(
  programs: Program[], 
  formData: FormData, 
  filtersChecked: Record<CitizenLabels, boolean>
): Program[] {
  const checkedNonCalculatedFilters = getCheckedNonCalculatedFilterNames(filtersChecked);
  
  return clone(programs).map(program => {
    // If program meets legal status with non-calculated filters, no need to check members
    const meetsBasicLegalStatus = program.legal_status_required.some(status => 
      checkedNonCalculatedFilters.includes(status)
    );
    
    if (meetsBasicLegalStatus) {
      return program;
    }

    // Check each member against calculated filters
    for (const memberEligibility of program.members) {
      const member = findMemberEligibilityMember(formData, memberEligibility);

      let memberMeetsAnyCondition = false;
      let hasApplicableConditions = false;

      // Check all calculated citizenship filters
      for (const [filterName, calculator] of Object.entries(calculatedCitizenshipFilters)) {
        const typedFilterName = filterName as CalculatedCitizenLabel;

        // Skip if this filter is not checked
        if (!filtersChecked[typedFilterName]) {
          continue;
        }

        // Skip if program doesn't require this citizenship status
        if (!program.legal_status_required.includes(typedFilterName)) {
          continue;
        }

        hasApplicableConditions = true;

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
  filtersChecked: Record<CitizenLabels, boolean>, 
  isAdminView: boolean
): Program[] {
  // Admin view shows all programs regardless of filters
  if (isAdminView) {
    return programs;
  }

  const checkedFilterNames = getCheckedFilterNames(filtersChecked);
  
  return programs.filter(program => 
    isProgramBasicallyVisible(program, checkedFilterNames)
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
  filtersChecked: Record<CitizenLabels, boolean>,
  isAdminView: boolean,
  allPrograms: Program[],
) {
  return (programs: Program[]) => {
    // Step 1: Update member eligibility based on calculated filters
    const updatedPrograms = updateMemberEligibilities(programs, formData, filtersChecked);
    // Step 2: Apply basic visibility filters
    const visiblePrograms = applyBasicFilters(updatedPrograms, filtersChecked, isAdminView);
    // Step 3: Apply program exclusions
    return applyProgramExclusions(visiblePrograms, isAdminView);
  };
}
