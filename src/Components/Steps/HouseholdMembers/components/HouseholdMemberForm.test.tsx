import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Context } from '../../../Wrapper/Wrapper';
import HouseholdMemberForm from './HouseholdMemberForm';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockNavigate = jest.fn();
const mockUpdateScreen = jest.fn().mockResolvedValue(undefined);

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../../Assets/updateScreen', () => ({
  __esModule: true,
  default: () => ({ updateScreen: mockUpdateScreen }),
}));

jest.mock('../../../../Assets/stepDirectory', () => ({
  useStepNumber: () => 5,
}));

jest.mock('../../../QuestionComponents/questionHooks', () => ({
  useShouldRedirectToConfirmation: () => false,
}));

jest.mock('../../stepForm', () => {
  const { useForm } = jest.requireActual('react-hook-form');
  return {
    __esModule: true,
    default: (opts: any) => useForm(opts),
  };
});

jest.mock('../../../EnergyCalculator/hooks', () => ({
  useIsEnergyCalculator: () => false,
}));

jest.mock('../hooks/useHouseholdMemberConfig', () => ({
  useHouseholdMemberConfig: () => ({
    healthInsuranceOptions: {},
    conditionOptions: {},
    incomeOptions: {},
    frequencyMenuItems: [],
    relationshipOptions: {},
  }),
}));

jest.mock('../hooks/useHouseholdMemberFormEffects', () => ({
  useHouseholdMemberFormEffects: () => {},
}));

jest.mock('../../../AgeCalculation/useAgeCalculation', () => ({
  useAgeCalculation: () => ({
    calculateCurrentAgeStatus: () => ({ isUnder16: false }),
  }),
}));

// Mock heavy section components — we only care about whether BasicInfoSection renders
jest.mock('../sections/BasicInfoSection', () => ({
  __esModule: true,
  default: () => <div data-testid="basic-info-section" />,
}));
jest.mock('../sections/HealthInsuranceSection', () => ({
  __esModule: true,
  default: () => <div data-testid="health-insurance-section" />,
}));
jest.mock('../sections/SpecialConditionsSection', () => ({
  __esModule: true,
  default: () => <div data-testid="special-conditions-section" />,
}));
jest.mock('../sections/StudentEligibilitySection', () => ({
  __esModule: true,
  default: () => <div data-testid="student-eligibility-section" />,
}));
jest.mock('../sections/IncomeSection', () => ({
  __esModule: true,
  default: () => <div data-testid="income-section" />,
}));
jest.mock('./HouseholdMemberSummaryCards', () => ({
  __esModule: true,
  default: () => <div data-testid="summary-cards" />,
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeFormData = (householdSize: number, householdData: any[] = []) => ({
  householdSize,
  householdData: Array.from({ length: householdSize }, (_, i) => ({
    id: `id-${i}`,
    frontendId: `fid-${i}`,
    birthMonth: 1,
    birthYear: 1990,
    relationshipToHH: i === 0 ? 'headOfHousehold' : 'child',
    conditions: {
      student: false,
      pregnant: false,
      blindOrVisuallyImpaired: false,
      disabled: false,
      longTermDisability: false,
      none: true,
    },
    hasIncome: false,
    incomeStreams: [],
    healthInsurance: {
      none: true,
      employer: false,
      private: false,
      medicaid: false,
      medicare: false,
      chp: false,
      emergency_medicaid: false,
      family_planning: false,
      va: false,
      mass_health: false,
    },
    ...householdData[i],
  })),
});

/**
 * Renders HouseholdMemberForm at a given page with optional location state.
 * `locationState` simulates React Router navigation state (basicInfoCollected, isEditing, etc.)
 */
const renderForm = (householdSize: number, page: number, locationState: Record<string, unknown> = {}) => {
  const contextValue = {
    formData: makeFormData(householdSize),
    setFormData: jest.fn(),
    setStepLoading: jest.fn(),
  } as any;

  return render(
    <IntlProvider locale="en" messages={{}}>
      <Context.Provider value={contextValue}>
        <MemoryRouter
          initialEntries={[{ pathname: `/co/test-uuid/step-5/${page}`, state: locationState }]}
        >
          <Routes>
            <Route path="/:whiteLabel/:uuid/step-:stepId/:page" element={<HouseholdMemberForm />} />
          </Routes>
        </MemoryRouter>
      </Context.Provider>
    </IntlProvider>
  );
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('HouseholdMemberForm - showBasicInfoSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('household size === 1 (came directly from step 4, skipped page 0)', () => {
    it('shows BasicInfoSection when householdSize is 1 and no basicInfoCollected state', () => {
      renderForm(1, 1, {});
      expect(screen.getByTestId('basic-info-section')).toBeInTheDocument();
    });

    it('shows BasicInfoSection when householdSize is 1 and basicInfoCollected is false', () => {
      renderForm(1, 1, { basicInfoCollected: false });
      expect(screen.getByTestId('basic-info-section')).toBeInTheDocument();
    });
  });

  describe('household size > 1 (came through page 0 basic info page)', () => {
    it('hides BasicInfoSection when householdSize > 1 and basicInfoCollected is true', () => {
      renderForm(2, 1, { basicInfoCollected: true });
      expect(screen.queryByTestId('basic-info-section')).not.toBeInTheDocument();
    });

    it('hides BasicInfoSection when householdSize is 3 and basicInfoCollected is true', () => {
      renderForm(3, 1, { basicInfoCollected: true });
      expect(screen.queryByTestId('basic-info-section')).not.toBeInTheDocument();
    });

    it('hides BasicInfoSection when user deleted down to 1 on page 0 (basicInfoCollected is true)', () => {
      // User started with 2, deleted to 1 on page 0, then continued — basicInfoCollected=true
      renderForm(1, 1, { basicInfoCollected: true });
      expect(screen.queryByTestId('basic-info-section')).not.toBeInTheDocument();
    });
  });

  describe('editing flow (isEditing)', () => {
    it('shows BasicInfoSection when isEditing is true, regardless of householdSize', () => {
      renderForm(2, 1, { isEditing: true, basicInfoCollected: true });
      expect(screen.getByTestId('basic-info-section')).toBeInTheDocument();
    });

    it('shows BasicInfoSection when routedFromConfirmationPg is true', () => {
      renderForm(2, 1, { routedFromConfirmationPg: true, basicInfoCollected: true });
      expect(screen.getByTestId('basic-info-section')).toBeInTheDocument();
    });
  });

  describe('summary cards visibility', () => {
    it('does not show summary cards on page 1', () => {
      renderForm(3, 1, {});
      expect(screen.queryByTestId('summary-cards')).not.toBeInTheDocument();
    });

    it('shows summary cards on page 2', () => {
      renderForm(3, 2, { basicInfoCollected: true });
      expect(screen.getByTestId('summary-cards')).toBeInTheDocument();
    });

    it('shows summary cards on page 3', () => {
      renderForm(3, 3, { basicInfoCollected: true });
      expect(screen.getByTestId('summary-cards')).toBeInTheDocument();
    });
  });
});
