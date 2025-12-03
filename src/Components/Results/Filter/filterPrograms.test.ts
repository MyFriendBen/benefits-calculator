import filterProgramsGenerator from './filterPrograms';
import {
  createProgram,
  createFormData,
  createFilterState,
  createProgramWithExclusions,
  createProgramWithMembers,
  createMemberEligibility,
} from '../testHelpers';
import { Program } from '../../../Types/Results';

// Polyfill for structuredClone in test environment
if (!global.structuredClone) {
  global.structuredClone = (obj: any) => JSON.parse(JSON.stringify(obj));
}

// Mock dependencies
jest.mock('../FormattedValue', () => ({
  programValue: (program: Program) => {
    let total = program.household_value;
    for (const member of program.members) {
      if (!member.already_has) {
        total += member.value;
      }
    }
    return total;
  },
}));

jest.mock('../Results', () => ({
  findMemberEligibilityMember: jest.fn(() => ({
    age: 30,
    relationship: 'yourself',
    student: false,
    pregnant: false,
    blind: false,
    disabled: false,
    veteran: false,
  })),
}));

describe('filterProgramsGenerator', () => {
  const defaultFormData = createFormData();
  const defaultFilterState = createFilterState();

  describe('Basic filtering without exclusions', () => {
    it('should show eligible programs with value', () => {
      const programs = [
        createProgram({ program_id: 1, eligible: true, household_value: 100 }),
        createProgram({ program_id: 2, eligible: false, household_value: 100 }),
        createProgram({ program_id: 3, eligible: true, household_value: 0 }),
      ];

      const filterPrograms = filterProgramsGenerator(defaultFormData, defaultFilterState, false, programs);
      const filtered = filterPrograms(programs);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].program_id).toBe(1);
    });

    it('should hide programs that user already has', () => {
      const programs = [
        createProgram({ program_id: 1, eligible: true, household_value: 100, already_has: false }),
        createProgram({ program_id: 2, eligible: true, household_value: 100, already_has: true }),
      ];

      const filterPrograms = filterProgramsGenerator(defaultFormData, defaultFilterState, false, programs);
      const filtered = filterPrograms(programs);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].program_id).toBe(1);
    });

    it('should filter by legal status', () => {
      const programs = [
        createProgram({ program_id: 1, legal_status_required: ['citizen'], household_value: 100 }),
        createProgram({ program_id: 2, legal_status_required: ['non_citizen'], household_value: 100 }),
        createProgram({ program_id: 3, legal_status_required: ['citizen', 'non_citizen'], household_value: 100 }),
      ];

      const filterPrograms = filterProgramsGenerator(defaultFormData, defaultFilterState, false, programs);
      const filtered = filterPrograms(programs);

      expect(filtered).toHaveLength(2);
      expect(filtered.map(p => p.program_id)).toEqual([1, 3]);
    });

    it('should show all programs in admin view', () => {
      const programs = [
        createProgram({ program_id: 1, eligible: false }),
        createProgram({ program_id: 2, household_value: 0 }),
        createProgram({ program_id: 3, already_has: true }),
      ];

      const filterPrograms = filterProgramsGenerator(defaultFormData, defaultFilterState, true, programs);
      const filtered = filterPrograms(programs);

      expect(filtered).toHaveLength(3);
    });
  });

  describe('Program exclusion logic', () => {
    it('should exclude programs when excluder is visible', () => {
      const programs = [
        createProgramWithExclusions(1, 'Program A', [2], true, 100),
        createProgramWithExclusions(2, 'Program B', [], true, 100),
      ];

      const filterPrograms = filterProgramsGenerator(defaultFormData, defaultFilterState, false, programs);
      const filtered = filterPrograms(programs);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].program_id).toBe(1);
    });

    it('should show excluded program when excluder is not visible', () => {
      const programs = [
        createProgramWithExclusions(1, 'Program A', [2], false, 100), // Not eligible
        createProgramWithExclusions(2, 'Program B', [], true, 100),
      ];

      const filterPrograms = filterProgramsGenerator(defaultFormData, defaultFilterState, false, programs);
      const filtered = filterPrograms(programs);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].program_id).toBe(2);
    });

    it('should handle mutual exclusions (first wins)', () => {
      const programs = [
        createProgramWithExclusions(1, 'Program A', [2], true, 100),
        createProgramWithExclusions(2, 'Program B', [1], true, 100),
      ];

      const filterPrograms = filterProgramsGenerator(defaultFormData, defaultFilterState, false, programs);
      const filtered = filterPrograms(programs);

      // With mutual exclusions, the first program in the array wins
      expect(filtered).toHaveLength(1);
      expect(filtered[0].program_id).toBe(1);
    });

    it('should handle transitive exclusions', () => {
      const programs = [
        createProgramWithExclusions(1, 'Program A', [2], true, 100),
        createProgramWithExclusions(2, 'Program B', [3], true, 100),
        createProgramWithExclusions(3, 'Program C', [], true, 100),
      ];

      const filterPrograms = filterProgramsGenerator(defaultFormData, defaultFilterState, false, programs);
      const filtered = filterPrograms(programs);

      // Program A excludes B, but B's exclusion of C doesn't matter since B is not visible
      // So we should see programs A and C
      expect(filtered).toHaveLength(2);
      expect(filtered.map(p => p.program_id).sort()).toEqual([1, 3]);
    });

    it('should handle complex exclusion chains', () => {
      const programs = [
        createProgramWithExclusions(1, 'Program A', [3, 4], true, 100),
        createProgramWithExclusions(2, 'Program B', [4], true, 100),
        createProgramWithExclusions(3, 'Program C', [], true, 100),
        createProgramWithExclusions(4, 'Program D', [], true, 100),
      ];

      const filterPrograms = filterProgramsGenerator(defaultFormData, defaultFilterState, false, programs);
      const filtered = filterPrograms(programs);

      // Programs 1 and 2 should be visible, 3 and 4 should be excluded
      expect(filtered).toHaveLength(2);
      expect(filtered.map(p => p.program_id).sort()).toEqual([1, 2]);
    });

    it('should handle circular exclusion dependencies', () => {
      const programs = [
        createProgramWithExclusions(1, 'Program A', [2], true, 100),
        createProgramWithExclusions(2, 'Program B', [3], true, 100),
        createProgramWithExclusions(3, 'Program C', [1], true, 100),
      ];

      const filterPrograms = filterProgramsGenerator(defaultFormData, defaultFilterState, false, programs);
      const filtered = filterPrograms(programs);

      // In circular dependencies: A excludes B, B excludes C, C excludes A
      // First program (A) excludes B, then C excludes A, leaving only C
      expect(filtered).toHaveLength(1);
      expect(filtered[0].program_id).toBe(3);
    });

    it('should not apply exclusions in admin view', () => {
      const programs = [
        createProgramWithExclusions(1, 'Program A', [2], true, 100),
        createProgramWithExclusions(2, 'Program B', [], true, 100),
      ];

      const filterPrograms = filterProgramsGenerator(defaultFormData, defaultFilterState, true, programs);
      const filtered = filterPrograms(programs);

      expect(filtered).toHaveLength(2);
    });
  });

  describe('Immigration status filtering with exclusions', () => {
    it('should apply exclusions based on immigration status filters', () => {
      const programs = [
        createProgram({
          program_id: 1,
          name_abbreviated: 'MOMS_CITIZEN',
          legal_status_required: ['citizen'],
          eligible: true,
          household_value: 100,
          excludes_programs: [2],
        }),
        createProgram({
          program_id: 2,
          name_abbreviated: 'MOMS_NONCITIZEN',
          legal_status_required: ['non_citizen'],
          eligible: true,
          household_value: 100,
          excludes_programs: [1],
        }),
      ];

      // Test with 'citizen' filter only
      const citizenFilters = createFilterState('citizen');
      const filterPrograms1 = filterProgramsGenerator(defaultFormData, citizenFilters, false, programs);
      const filtered1 = filterPrograms1(programs);

      expect(filtered1).toHaveLength(1);
      expect(filtered1[0].program_id).toBe(1);

      // Test with 'non_citizen' filter only
      const nonCitizenFilters = createFilterState('non_citizen');
      const filterPrograms2 = filterProgramsGenerator(defaultFormData, nonCitizenFilters, false, programs);
      const filtered2 = filterPrograms2(programs);

      expect(filtered2).toHaveLength(1);
      expect(filtered2[0].program_id).toBe(2);
    });

    it('should handle member-level eligibility with exclusions', () => {
      const programs = [
        createProgramWithMembers(1, 'Family Program', { 'member1': 50, 'member2': 50 }, ['citizen']),
        createProgramWithMembers(2, 'Individual Program', { 'member1': 100 }, ['citizen']),
      ];

      programs[0].excludes_programs = [2];

      const filterPrograms = filterProgramsGenerator(defaultFormData, defaultFilterState, false, programs);
      const filtered = filterPrograms(programs);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].program_id).toBe(1);
    });
  });

  describe('Performance and caching', () => {
    it('should cache visibility results for performance', () => {
      // Create a complex exclusion graph
      const programs = Array.from({ length: 10 }, (_, i) => 
        createProgramWithExclusions(
          i + 1,
          `Program ${i + 1}`,
          i < 9 ? [i + 2] : [], // Each excludes the next
          true,
          100
        )
      );

      const filterPrograms = filterProgramsGenerator(defaultFormData, defaultFilterState, false, programs);
      
      // Run filter twice to test caching
      const filtered1 = filterPrograms(programs);
      const filtered2 = filterPrograms(programs);

      // Results should be consistent
      expect(filtered1).toEqual(filtered2);
      // With chain exclusions, programs that don't exclude others should be visible
      expect(filtered1.length).toBeGreaterThan(0);
    });

    it('should handle missing program references gracefully', () => {
      const programs = [
        createProgramWithExclusions(1, 'Program A', [999], true, 100), // Excludes non-existent program
        createProgramWithExclusions(2, 'Program B', [], true, 100),
      ];

      const filterPrograms = filterProgramsGenerator(defaultFormData, defaultFilterState, false, programs);
      const filtered = filterPrograms(programs);

      expect(filtered).toHaveLength(2);
    });

    it('should handle empty exclusions array', () => {
      const programs = [
        createProgram({ program_id: 1, excludes_programs: [], eligible: true, household_value: 100 }),
        createProgram({ program_id: 2, excludes_programs: null, eligible: true, household_value: 100 }),
      ];

      const filterPrograms = filterProgramsGenerator(defaultFormData, defaultFilterState, false, programs);
      const filtered = filterPrograms(programs);

      expect(filtered).toHaveLength(2);
    });
  });

  describe('Edge cases', () => {
    it('should handle programs with same eligibility criteria but different exclusions', () => {
      const programs = [
        createProgram({
          program_id: 1,
          legal_status_required: ['citizen'],
          eligible: true,
          household_value: 100,
          excludes_programs: [3],
        }),
        createProgram({
          program_id: 2,
          legal_status_required: ['citizen'],
          eligible: true,
          household_value: 100,
          excludes_programs: [4],
        }),
        createProgram({
          program_id: 3,
          legal_status_required: ['citizen'],
          eligible: true,
          household_value: 100,
        }),
        createProgram({
          program_id: 4,
          legal_status_required: ['citizen'],
          eligible: true,
          household_value: 100,
        }),
      ];

      const filterPrograms = filterProgramsGenerator(defaultFormData, defaultFilterState, false, programs);
      const filtered = filterPrograms(programs);

      // Programs 1 and 2 should be visible
      // Program 3 is excluded by 1, Program 4 is excluded by 2
      expect(filtered).toHaveLength(2);
      expect(filtered.map(p => p.program_id).sort()).toEqual([1, 2]);
    });

    it('should maintain member eligibility modifications through filtering', () => {
      const member1 = createMemberEligibility('member1', true, 100);
      const program = createProgram({
        program_id: 1,
        members: [member1],
        legal_status_required: ['citizen'],
        eligible: true,
      });

      const filterPrograms = filterProgramsGenerator(defaultFormData, defaultFilterState, false, [program]);
      const filtered = filterPrograms([program]);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].members[0]).toMatchObject({
        frontend_id: 'member1',
        eligible: true,
        value: 100,
      });
    });
  });
});
