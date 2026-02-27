import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Context } from '../../../Wrapper/Wrapper';
import HouseholdMemberSummaryCards from './HouseholdMemberSummaryCards';
import { calcAge, hasBirthMonthYear, useFormatBirthMonthYear } from '../../../../Assets/age.tsx';
import { calcMemberYearlyIncome } from '../../../../Assets/income';
import { useConfig } from '../../../Config/configHook';
import { useStepNumber } from '../../../../Assets/stepDirectory';
import { useTranslateNumber } from '../../../../Assets/languageOptions';

jest.mock('../../../../Assets/age.tsx', () => ({
  calcAge: jest.fn(),
  hasBirthMonthYear: jest.fn(),
  useFormatBirthMonthYear: jest.fn(),
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
const mockHasBirthMonthYear = hasBirthMonthYear as jest.MockedFunction<typeof hasBirthMonthYear>;
const mockUseFormatBirthMonthYear = useFormatBirthMonthYear as jest.MockedFunction<typeof useFormatBirthMonthYear>;
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

const memberWithBirth = (overrides = {}) => ({
  id: '1',
  frontendId: 'f1',
  birthYear: 1990,
  birthMonth: 6,
  relationshipToHH: 'spouse',
  hasIncome: true,
  incomeStreams: [],
  ...overrides,
});

const renderCards = (householdData: any[] = [], whiteLabel = 'default') => {
  const contextValue = {
    formData: { householdData } as any,
    whiteLabel,
  } as any;

  const messages = {
    'relationshipOptions.yourself': 'Yourself',
    'questions.age-inputLabel': 'Age: ',
    'householdDataBlock.memberCard.birthYearMonth': 'Birth Month/Year: ',
    'householdDataBlock.member-income': 'Income: ',
    'displayAnnualIncome.annual': ' annually',
    'editHHMember.ariaText': 'edit household member',
  };

  return render(
    <IntlProvider locale="en" messages={messages}>
      <Context.Provider value={contextValue}>
        <MemoryRouter initialEntries={[`/default/test-uuid/step-3/2`]}>
          <Routes>
            <Route path="/:whiteLabel/:uuid/step-:stepId/:page" element={<HouseholdMemberSummaryCards questionName="householdData" />} />
          </Routes>
        </MemoryRouter>
      </Context.Provider>
    </IntlProvider>
  );
};

describe('HouseholdMemberSummaryCards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseStepNumber.mockReturnValue(3);
    mockUseConfig.mockReturnValue({ spouse: 'Spouse', child: 'Child' } as any);
    mockCalcAge.mockReturnValue(35);
    mockHasBirthMonthYear.mockReturnValue(true);
    mockUseFormatBirthMonthYear.mockReturnValue(jest.fn().mockReturnValue('June 1990'));
    mockCalcMemberYearlyIncome.mockReturnValue(12000);
    mockUseTranslateNumber.mockReturnValue((n: any) => String(n));
  });

  describe('rendering', () => {
    it('renders nothing when household data is empty', () => {
      const { container } = renderCards([]);
      // headOfHHInfoWasEntered is false, so inner content not shown
      expect(container.querySelector('.member-added-container')).not.toBeInTheDocument();
    });

    it('renders a card for each household member with birth data', () => {
      renderCards([memberWithBirth(), memberWithBirth({ relationshipToHH: 'child', birthMonth: 3, birthYear: 2010 })]);
      const cards = screen.getAllByRole('article').filter(el => el.className.includes('member-added-container'));
      expect(cards).toHaveLength(2);
    });

    it('renders "Yourself" label for the first member (index 0)', () => {
      renderCards([memberWithBirth()]);
      // "Yourself:" is split across child nodes in the <h3> — use regex to match partial text
      expect(screen.getByText(/yourself/i)).toBeInTheDocument();
    });

    it('renders relationship label from config for non-first members', () => {
      renderCards([memberWithBirth(), memberWithBirth({ relationshipToHH: 'spouse' })]);
      expect(screen.getByText(/spouse/i)).toBeInTheDocument();
    });

    it('renders age for each member', () => {
      mockCalcAge.mockReturnValue(35);
      renderCards([memberWithBirth()]);
      expect(screen.getByText('35')).toBeInTheDocument();
    });

    it('renders income for each member', () => {
      mockCalcMemberYearlyIncome.mockReturnValue(24000);
      renderCards([memberWithBirth()]);
      // Component formats income with Intl.NumberFormat which may include cents
      expect(screen.getByText(/\$24,000/)).toBeInTheDocument();
    });

    it('renders birth month/year when hasBirthMonthYear returns true', () => {
      mockHasBirthMonthYear.mockReturnValue(true);
      mockUseFormatBirthMonthYear.mockReturnValue(jest.fn().mockReturnValue('June 1990'));
      renderCards([memberWithBirth()]);
      expect(screen.getByText('June 1990')).toBeInTheDocument();
    });

    it('does not render birth month/year when hasBirthMonthYear returns false', () => {
      mockHasBirthMonthYear.mockReturnValue(false);
      renderCards([memberWithBirth()]);
      expect(screen.queryByText('June 1990')).not.toBeInTheDocument();
    });

    it('does not render a card for member with no birth data', () => {
      const memberNoBirth = { id: '1', frontendId: 'f1', birthYear: undefined, birthMonth: undefined, relationshipToHH: 'spouse', hasIncome: false, incomeStreams: [] };
      const { container } = renderCards([memberNoBirth as any]);
      expect(container.querySelector('.member-added-container')).not.toBeInTheDocument();
    });
  });

  describe('current member highlighting', () => {
    it('marks the current page member with current-household-member class', () => {
      // page = '2' from useParams mock, so memberIndex=1 (0-based) = page 2
      renderCards([memberWithBirth(), memberWithBirth({ birthMonth: 3 })]);
      const cards = screen.getAllByRole('article').filter(el => el.className.includes('member-added-container'));
      expect(cards[1].className).toContain('current-household-member');
    });

    it('does not mark other members with current-household-member', () => {
      renderCards([memberWithBirth(), memberWithBirth({ birthMonth: 3 })]);
      const cards = screen.getAllByRole('article').filter(el => el.className.includes('member-added-container'));
      expect(cards[0].className).not.toContain('current-household-member');
    });
  });

  describe('edit button navigation', () => {
    it('renders an edit button for each member', () => {
      renderCards([memberWithBirth(), memberWithBirth({ birthMonth: 3 })]);
      const editButtons = screen.getAllByRole('button', { name: /edit household member/i });
      expect(editButtons).toHaveLength(2);
    });

    it('navigates to the correct member page when edit is clicked', () => {
      renderCards([memberWithBirth(), memberWithBirth({ birthMonth: 3 })]);
      const editButtons = screen.getAllByRole('button', { name: /edit household member/i });
      fireEvent.click(editButtons[0]);
      expect(mockNavigate).toHaveBeenCalledWith('/default/test-uuid/step-3/1');
    });

    it('navigates to the correct member page for the second member', () => {
      renderCards([memberWithBirth(), memberWithBirth({ birthMonth: 3 })]);
      const editButtons = screen.getAllByRole('button', { name: /edit household member/i });
      fireEvent.click(editButtons[1]);
      expect(mockNavigate).toHaveBeenCalledWith('/default/test-uuid/step-3/2');
    });
  });

  describe('calcAge NaN handling', () => {
    it('renders 0 instead of NaN when calcAge returns NaN', () => {
      mockCalcAge.mockReturnValue(NaN);
      renderCards([memberWithBirth()]);
      // Should show 0 (the NaN fallback)
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('each member card is an article element', () => {
      renderCards([memberWithBirth()]);
      const articles = screen.getAllByRole('article');
      // At least one should be a member card
      expect(articles.length).toBeGreaterThan(0);
    });

    it('edit button has accessible aria-label', () => {
      renderCards([memberWithBirth()]);
      expect(screen.getByRole('button', { name: /edit household member/i })).toBeInTheDocument();
    });
  });
});
