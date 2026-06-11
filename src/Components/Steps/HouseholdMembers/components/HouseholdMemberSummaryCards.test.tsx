import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Context } from '../../../Wrapper/Wrapper';
import HouseholdMemberSummaryCards from './HouseholdMemberSummaryCards';
import { calcAge } from '../../../../Assets/age.tsx';
import { calcMemberYearlyIncome } from '../../../../Assets/income';
import { useConfig } from '../../../Config/configHook';
import { useStepNumber } from '../../../../Assets/stepDirectory';
import { useTranslateNumber } from '../../../../Assets/languageOptions';

jest.mock('../../../../Assets/age.tsx', () => ({
  calcAge: jest.fn(),
}));

jest.mock('../../../../Assets/income', () => ({
  calcMemberYearlyIncome: jest.fn(),
}));

jest.mock('../../../Config/configHook', () => ({
  useConfig: jest.fn(),
}));

jest.mock('../../../../Assets/stepDirectory', () => ({
  useStepNumber: jest.fn(),
}));

jest.mock('../../../../Assets/languageOptions', () => ({
  useTranslateNumber: jest.fn(),
}));

const mockCalcAge = calcAge as jest.MockedFunction<typeof calcAge>;
const mockCalcMemberYearlyIncome = calcMemberYearlyIncome as jest.MockedFunction<typeof calcMemberYearlyIncome>;
const mockUseConfig = useConfig as jest.MockedFunction<typeof useConfig>;
const mockUseStepNumber = useStepNumber as jest.MockedFunction<typeof useStepNumber>;
const mockUseTranslateNumber = useTranslateNumber as jest.MockedFunction<typeof useTranslateNumber>;

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ uuid: 'test-uuid', page: '2' }),
}));

// A "completed" member needs basic info AND an answered health insurance question.
const completedMember = (overrides = {}) => ({
  id: '1',
  frontendId: 'f1',
  birthYear: 1990,
  birthMonth: 6,
  relationshipToHH: 'spouse',
  hasIncome: true,
  incomeStreams: [],
  healthInsurance: { none: true },
  ...overrides,
});

const renderCards = (householdData: any[] = [], householdSize?: number) => {
  const contextValue = {
    formData: {
      householdData,
      householdSize: householdSize ?? householdData.length,
    } as any,
    whiteLabel: 'default',
  } as any;

  const messages = {
    'relationshipOptions.yourself': 'Yourself',
    'householdDataBlock.householdMember': 'Household Member',
    'householdDataBlock.member-income': 'Annual Income: ',
    'householdDataBlock.edit': 'Edit',
    'editHHMember.ariaText': 'edit household member',
  };

  return render(
    <IntlProvider locale="en" messages={messages}>
      <Context.Provider value={contextValue}>
        <MemoryRouter initialEntries={[`/default/test-uuid/step-3/2`]}>
          <Routes>
            <Route
              path="/:whiteLabel/:uuid/step-:stepId/:page"
              element={<HouseholdMemberSummaryCards questionName="householdData" />}
            />
          </Routes>
        </MemoryRouter>
      </Context.Provider>
    </IntlProvider>
  );
};

// Completed non-current cards get role="button", so query by class rather than
// by the "article" role (which would exclude the clickable cards).
const cardContainers = () =>
  Array.from(document.querySelectorAll('.member-added-container')) as HTMLElement[];

describe('HouseholdMemberSummaryCards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseStepNumber.mockReturnValue(3);
    mockUseConfig.mockReturnValue({ spouse: 'Spouse', child: 'Child' } as any);
    mockCalcAge.mockReturnValue(35);
    mockCalcMemberYearlyIncome.mockReturnValue(12000);
    mockUseTranslateNumber.mockReturnValue((n: any) => String(n));
  });

  describe('rendering', () => {
    it('renders nothing when household data is empty', () => {
      const { container } = renderCards([], 0);
      // headOfHHInfoWasEntered is false, so inner content not shown
      expect(container.querySelector('.member-added-container')).not.toBeInTheDocument();
    });

    it('renders a card for each household member with birth data', () => {
      renderCards(
        [completedMember(), completedMember({ relationshipToHH: 'child', birthMonth: 3, birthYear: 2010 })],
        2,
      );
      expect(cardContainers()).toHaveLength(2);
    });

    it('renders placeholder cards for household slots not yet entered', () => {
      // householdSize 3 but only 1 member entered → 1 real card + 2 placeholders
      renderCards([completedMember()], 3);
      expect(cardContainers()).toHaveLength(3);
      // Placeholder members use the generic "Household Member" label
      expect(screen.getAllByText(/household member/i).length).toBeGreaterThanOrEqual(2);
    });

    it('renders "Yourself" label for the first member (index 0)', () => {
      renderCards([completedMember()], 1);
      // "Yourself (35)" is split across child nodes in the <h3> — use regex to match partial text
      expect(screen.getByText(/yourself/i)).toBeInTheDocument();
    });

    it('renders relationship label from config for non-first members', () => {
      renderCards([completedMember(), completedMember({ relationshipToHH: 'spouse' })], 2);
      expect(screen.getByText(/spouse/i)).toBeInTheDocument();
    });

    it('renders age inline with the relationship', () => {
      mockCalcAge.mockReturnValue(35);
      renderCards([completedMember()], 1);
      // Age appears in parentheses next to the relationship: "Yourself (35)"
      expect(screen.getByText(/\(35\)/)).toBeInTheDocument();
    });

    it('renders annual income for completed members', () => {
      mockCalcMemberYearlyIncome.mockReturnValue(24000);
      renderCards([completedMember()], 1);
      expect(screen.getByText(/\$24,000/)).toBeInTheDocument();
    });

    it('does not render income for placeholder members', () => {
      renderCards([], 2);
      expect(screen.queryByText(/Annual Income/i)).not.toBeInTheDocument();
    });

    it('treats a member with birth data but no insurance answer as not completed', () => {
      // Has birth data + relationship but the health insurance question is unanswered,
      // so the single isMemberCompleted predicate must not treat it as completed:
      // no income, not the completed class, and not clickable.
      const inProgress = completedMember({ healthInsurance: {} });
      renderCards([inProgress], 1);
      const cards = cardContainers();
      expect(cards).toHaveLength(1);
      expect(cards[0].className).not.toContain('completed-household-member');
      expect(cards[0]).not.toHaveAttribute('role', 'button');
      expect(screen.queryByText(/Annual Income/i)).not.toBeInTheDocument();
    });
  });

  describe('completion status icons', () => {
    it('marks the current page member with current-household-member class', () => {
      // page is '2' (mocked useParams), so member at index 1 is current
      renderCards([completedMember(), completedMember()], 2);
      const cards = cardContainers();
      expect(cards[1].className).toContain('current-household-member');
    });

    it('marks completed non-current members with completed-household-member class', () => {
      renderCards([completedMember(), completedMember()], 2);
      const cards = cardContainers();
      expect(cards[0].className).toContain('completed-household-member');
      expect(cards[0].className).not.toContain('current-household-member');
    });

    it('does not mark placeholder members as completed', () => {
      renderCards([completedMember()], 2);
      const cards = cardContainers();
      // index 1 is the current member slot, rendered as a placeholder (no data)
      expect(cards[1].className).not.toContain('completed-household-member');
    });
  });

  describe('edit navigation', () => {
    it('makes completed non-current cards clickable with an edit aria-label', () => {
      renderCards([completedMember(), completedMember()], 2);
      const cards = cardContainers();
      expect(cards[0]).toHaveAttribute('role', 'button');
      expect(cards[0]).toHaveAttribute('aria-label', 'edit household member');
    });

    it('navigates to the correct member page when a completed card is clicked', () => {
      renderCards([completedMember(), completedMember()], 2);
      const cards = cardContainers();
      fireEvent.click(cards[0]);
      expect(mockNavigate).toHaveBeenCalledWith(
        '/default/test-uuid/step-3/1',
        { state: { isEditing: true, returnToPage: 2 } },
      );
    });

    it('navigates when a completed card is activated with the Enter key', () => {
      renderCards([completedMember(), completedMember()], 2);
      const cards = cardContainers();
      fireEvent.keyDown(cards[0], { key: 'Enter' });
      expect(mockNavigate).toHaveBeenCalledWith(
        '/default/test-uuid/step-3/1',
        { state: { isEditing: true, returnToPage: 2 } },
      );
    });

    it('navigates when a completed card is activated with the Space key', () => {
      renderCards([completedMember(), completedMember()], 2);
      const cards = cardContainers();
      fireEvent.keyDown(cards[0], { key: ' ' });
      expect(mockNavigate).toHaveBeenCalledWith(
        '/default/test-uuid/step-3/1',
        { state: { isEditing: true, returnToPage: 2 } },
      );
    });

    it('does not make the current member card clickable', () => {
      renderCards([completedMember(), completedMember()], 2);
      const cards = cardContainers();
      expect(cards[1]).not.toHaveAttribute('role', 'button');
    });
  });

  describe('calcAge NaN handling', () => {
    it('renders 0 instead of NaN when calcAge returns NaN', () => {
      mockCalcAge.mockReturnValue(NaN);
      renderCards([completedMember()], 1);
      expect(screen.getByText(/\(0\)/)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('renders a member card for each household slot', () => {
      renderCards([completedMember(), completedMember()], 2);
      expect(cardContainers().length).toBeGreaterThan(0);
    });

    it('exposes completed editable cards as keyboard-focusable buttons', () => {
      renderCards([completedMember(), completedMember()], 2);
      const cards = cardContainers();
      // Completed, non-current card: focusable + announced as a button
      expect(cards[0]).toHaveAttribute('role', 'button');
      expect(cards[0]).toHaveAttribute('tabindex', '0');
      // Current member card: not in the tab order
      expect(cards[1]).not.toHaveAttribute('tabindex');
    });
  });
});
