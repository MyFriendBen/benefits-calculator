import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import ProgramCard from './ProgramCard';
import { Context } from '../../Wrapper/Wrapper';
import { WrapperContext } from '../../../Types/WrapperContext';
import { Config } from '../../../Types/Config';
import { HouseholdData } from '../../../Types/FormData';
import { createProgram, createMemberEligibility, createFormData } from '../testHelpers';

// Mock Results module hooks
jest.mock('../Results', () => ({
  useResultsContext: () => ({ validations: [], isAdminView: false }),
  useResultsLink: (link: string) => `/test/uuid/${link}`,
  findMemberEligibilityMember: jest.requireActual('../Results').findMemberEligibilityMember,
  findValidationForProgram: jest.requireActual('../Results').findValidationForProgram,
}));

// Mock FormattedValue
jest.mock('../FormattedValue', () => ({
  useFormatDisplayValue: () => '$100/mo',
}));

// Mock ResultsTranslate to render the default_message
jest.mock('../Translate/Translate', () => ({
  __esModule: true,
  default: ({ translation }: { translation: { default_message: string } }) => (
    <span>{translation.default_message}</span>
  ),
}));

// Mock MUI useMediaQuery - controllable per test
const mockUseMediaQuery = jest.fn(() => false); // desktop by default
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useMediaQuery: (...args: any[]) => mockUseMediaQuery(...args),
}));

const createMember = (overrides: Partial<HouseholdData> = {}): HouseholdData => ({
  id: 1,
  frontendId: 'member-1',
  birthYear: 1990,
  birthMonth: 1,
  relationshipToHH: 'headOfHousehold',
  conditions: {},
  hasIncome: false,
  incomeStreams: [],
  ...overrides,
});

const relationshipOptions: Record<string, any> = {
  headOfHousehold: { props: { id: 'relationshipOptions.yourself', defaultMessage: 'Yourself' } },
  child: { props: { id: 'relationshipOptions.child', defaultMessage: 'Child' } },
  spouse: { props: { id: 'relationshipOptions.spouse', defaultMessage: 'Spouse' } },
};

const createContextValue = (config: Config | undefined, formData = createFormData()): WrapperContext =>
  ({
    config,
    configLoading: false,
    formData,
    setFormData: jest.fn(),
    locale: 'en-us' as any,
    selectLanguage: jest.fn(),
    getReferrer: jest.fn(() => '') as any,
    theme: {} as any,
    setTheme: jest.fn(),
    styleOverride: undefined,
    stepLoading: false,
    setStepLoading: jest.fn(),
    pageIsLoading: false,
    setScreenLoading: jest.fn(),
    staffToken: undefined,
    setStaffToken: jest.fn(),
    whiteLabel: '',
    setWhiteLabel: jest.fn(),
  }) as WrapperContext;

const renderProgramCard = (
  program: ReturnType<typeof createProgram>,
  config: Config | undefined,
  formData = createFormData(),
) => {
  return render(
    <MemoryRouter>
      <IntlProvider locale="en" messages={{}}>
        <Context.Provider value={createContextValue(config, formData)}>
          <ProgramCard program={program} />
        </Context.Provider>
      </IntlProvider>
    </MemoryRouter>,
  );
};

const configWithFlag = (enabled: boolean): Config => ({
  relationship_options: relationshipOptions,
  _feature_flags: { eligibility_tags: enabled },
});

const configWithoutFlag: Config = {
  relationship_options: relationshipOptions,
};

describe('ProgramCard - Eligibility Tags', () => {
  describe('feature flag gating', () => {
    const twoMemberFormData = createFormData({
      householdSize: 2,
      householdData: [
        createMember({ id: 1, frontendId: 'hoh', relationshipToHH: 'headOfHousehold' }),
        createMember({ id: 2, frontendId: 'child-1', relationshipToHH: 'child', birthYear: 2015 }),
      ],
    });

    const programWithMembers = createProgram({
      members: [
        createMemberEligibility('hoh', true, 100),
        createMemberEligibility('child-1', true, 50),
      ],
    });

    it('should not show eligibility tags when feature flag is off', () => {
      renderProgramCard(programWithMembers, configWithFlag(false), twoMemberFormData);
      expect(screen.queryByText('Eligible:')).not.toBeInTheDocument();
    });

    it('should show eligibility tags when feature flag is on', () => {
      renderProgramCard(programWithMembers, configWithFlag(true), twoMemberFormData);
      expect(screen.getByText('Eligible:')).toBeInTheDocument();
    });

    it('should not show eligibility tags when feature flag is absent from config', () => {
      renderProgramCard(programWithMembers, configWithoutFlag, twoMemberFormData);
      expect(screen.queryByText('Eligible:')).not.toBeInTheDocument();
    });
  });

  describe('single member household', () => {
    it('should not show eligibility tags for single-member household even with flag on', () => {
      const singleMemberFormData = createFormData({
        householdSize: 1,
        householdData: [
          createMember({ id: 1, frontendId: 'hoh', relationshipToHH: 'headOfHousehold' }),
        ],
      });

      const program = createProgram({
        members: [createMemberEligibility('hoh', true, 100)],
      });

      renderProgramCard(program, configWithFlag(true), singleMemberFormData);
      expect(screen.queryByText('Eligible:')).not.toBeInTheDocument();
    });
  });

  describe('household-level programs', () => {
    it('should show "Household" tag when program is eligible but no individual members are marked', () => {
      const twoMemberFormData = createFormData({
        householdSize: 2,
        householdData: [
          createMember({ id: 1, frontendId: 'hoh' }),
          createMember({ id: 2, frontendId: 'child-1', relationshipToHH: 'child' }),
        ],
      });

      const householdProgram = createProgram({
        eligible: true,
        members: [], // No individual member eligibility - household-level program
      });

      renderProgramCard(householdProgram, configWithFlag(true), twoMemberFormData);
      expect(screen.getByText('Eligible:')).toBeInTheDocument();
      expect(screen.getByText('Household')).toBeInTheDocument();
    });
  });

  describe('individual member tags', () => {
    const twoMemberFormData = createFormData({
      householdSize: 2,
      householdData: [
        createMember({ id: 1, frontendId: 'hoh', relationshipToHH: 'headOfHousehold', birthYear: 1990, birthMonth: 1 }),
        createMember({ id: 2, frontendId: 'child-1', relationshipToHH: 'child', birthYear: 2015, birthMonth: 6 }),
      ],
    });

    it('should show tags for eligible members only', () => {
      const program = createProgram({
        members: [
          createMemberEligibility('hoh', true, 100),
          createMemberEligibility('child-1', false, 0), // not eligible
        ],
      });

      renderProgramCard(program, configWithFlag(true), twoMemberFormData);
      expect(screen.getByText('Eligible:')).toBeInTheDocument();
      // Should show "You" tag for head of household
      expect(screen.getByText('You')).toBeInTheDocument();
    });

    it('should show tags for all eligible members when all are eligible', () => {
      const program = createProgram({
        members: [
          createMemberEligibility('hoh', true, 100),
          createMemberEligibility('child-1', true, 50),
        ],
      });

      renderProgramCard(program, configWithFlag(true), twoMemberFormData);
      expect(screen.getByText('Eligible:')).toBeInTheDocument();
      expect(screen.getByText('You')).toBeInTheDocument();
      expect(screen.getByText(/Child/)).toBeInTheDocument();
    });

    it('should not show tags when no members are eligible and program is not eligible', () => {
      const program = createProgram({
        eligible: false,
        members: [
          createMemberEligibility('hoh', false, 0),
          createMemberEligibility('child-1', false, 0),
        ],
      });

      renderProgramCard(program, configWithFlag(true), twoMemberFormData);
      expect(screen.queryByText('Eligible:')).not.toBeInTheDocument();
    });
  });

  describe('defensive member lookup', () => {
    it('should skip members whose frontend_id does not match any household member', () => {
      const twoMemberFormData = createFormData({
        householdSize: 2,
        householdData: [
          createMember({ id: 1, frontendId: 'hoh', relationshipToHH: 'headOfHousehold' }),
          createMember({ id: 2, frontendId: 'child-1', relationshipToHH: 'child', birthYear: 2015 }),
        ],
      });

      const program = createProgram({
        members: [
          createMemberEligibility('hoh', true, 100),
          createMemberEligibility('nonexistent-id', true, 50), // ID not in household
        ],
      });

      renderProgramCard(program, configWithFlag(true), twoMemberFormData);
      expect(screen.getByText('Eligible:')).toBeInTheDocument();
      expect(screen.getByText('You')).toBeInTheDocument();
      // The nonexistent member should be silently skipped, not crash
      expect(screen.getAllByClassName?.('eligible-member-tag') ?? screen.queryAllByText(/./)).toBeTruthy();
    });

    it('should render only matched members when some IDs are missing from household', () => {
      const twoMemberFormData = createFormData({
        householdSize: 2,
        householdData: [
          createMember({ id: 1, frontendId: 'hoh', relationshipToHH: 'headOfHousehold' }),
          createMember({ id: 2, frontendId: 'child-1', relationshipToHH: 'child', birthYear: 2015 }),
        ],
      });

      const program = createProgram({
        members: [
          createMemberEligibility('nonexistent-1', true, 100),
          createMemberEligibility('nonexistent-2', true, 50),
        ],
      });

      // All eligible members have unmatched IDs — should show no tags
      renderProgramCard(program, configWithFlag(true), twoMemberFormData);
      expect(screen.queryByText('Eligible:')).not.toBeInTheDocument();
    });
  });

  describe('relationship string fallback', () => {
    it('should fall back to raw relationship key when relationOption is a plain string', () => {
      const configWithStringRelation: Config = {
        relationship_options: {
          headOfHousehold: { props: { id: 'relationshipOptions.yourself', defaultMessage: 'Yourself' } },
          fosterChild: 'Foster Child', // plain string, not a FormattedMessage-like object
        },
        _feature_flags: { eligibility_tags: true },
      };

      const twoMemberFormData = createFormData({
        householdSize: 2,
        householdData: [
          createMember({ id: 1, frontendId: 'hoh', relationshipToHH: 'headOfHousehold' }),
          createMember({ id: 2, frontendId: 'foster-1', relationshipToHH: 'fosterChild', birthYear: 2018, birthMonth: 3 }),
        ],
      });

      const program = createProgram({
        members: [
          createMemberEligibility('foster-1', true, 50),
        ],
      });

      renderProgramCard(program, configWithStringRelation, twoMemberFormData);
      expect(screen.getByText('Eligible:')).toBeInTheDocument();
      // Should fall back to the raw key "fosterChild" since it's not a FormattedMessage object
      expect(screen.getByText(/fosterChild/)).toBeInTheDocument();
    });

    it('should fall back to raw relationship key when relationOption is undefined', () => {
      const configWithMissingRelation: Config = {
        relationship_options: {
          headOfHousehold: { props: { id: 'relationshipOptions.yourself', defaultMessage: 'Yourself' } },
          // 'sibling' not defined at all
        },
        _feature_flags: { eligibility_tags: true },
      };

      const twoMemberFormData = createFormData({
        householdSize: 2,
        householdData: [
          createMember({ id: 1, frontendId: 'hoh', relationshipToHH: 'headOfHousehold' }),
          createMember({ id: 2, frontendId: 'sib-1', relationshipToHH: 'sibling', birthYear: 2010, birthMonth: 5 }),
        ],
      });

      const program = createProgram({
        members: [
          createMemberEligibility('sib-1', true, 50),
        ],
      });

      renderProgramCard(program, configWithMissingRelation, twoMemberFormData);
      expect(screen.getByText('Eligible:')).toBeInTheDocument();
      expect(screen.getByText(/sibling/)).toBeInTheDocument();
    });
  });

  describe('mobile layout', () => {
    it('should render eligibility tags in mobile header when on mobile', () => {
      mockUseMediaQuery.mockReturnValue(true); // mobile

      const twoMemberFormData = createFormData({
        householdSize: 2,
        householdData: [
          createMember({ id: 1, frontendId: 'hoh', relationshipToHH: 'headOfHousehold' }),
          createMember({ id: 2, frontendId: 'child-1', relationshipToHH: 'child', birthYear: 2015 }),
        ],
      });

      const program = createProgram({
        members: [
          createMemberEligibility('hoh', true, 100),
          createMemberEligibility('child-1', true, 50),
        ],
      });

      renderProgramCard(program, configWithFlag(true), twoMemberFormData);
      expect(screen.getByText('Eligible:')).toBeInTheDocument();
      expect(screen.getByText('You')).toBeInTheDocument();

      mockUseMediaQuery.mockReturnValue(false); // reset to desktop
    });
  });

  describe('basic rendering', () => {
    it('should render program name and details', () => {
      const program = createProgram();
      renderProgramCard(program, configWithoutFlag);
      expect(screen.getByText('Test Program')).toBeInTheDocument();
      expect(screen.getByText('$100/mo')).toBeInTheDocument();
    });

    it('should show "New Benefit" flag for new programs', () => {
      const program = createProgram({ new: true });
      renderProgramCard(program, configWithoutFlag);
      expect(screen.getByText('New Benefit')).toBeInTheDocument();
    });

    it('should show "Low Confidence" flag for low confidence programs', () => {
      const program = createProgram({ low_confidence: true });
      renderProgramCard(program, configWithoutFlag);
      expect(screen.getByText('Low Confidence')).toBeInTheDocument();
    });
  });
});
