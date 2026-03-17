import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

const mockSummaryUpdateScreen = jest.fn().mockResolvedValue(undefined);
jest.mock('../../../../Assets/updateScreen', () => ({
  __esModule: true,
  default: () => ({ updateScreen: mockSummaryUpdateScreen }),
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
  // page='3' so slice(0, 2) shows 2 completed members when householdData has 3
  useParams: () => ({ uuid: 'test-uuid', page: '3' }),
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

const messages = {
  'relationshipOptions.yourself': 'Yourself',
  'questions.age-inputLabel': 'Age: ',
  'householdDataBlock.memberCard.birthYearMonth': 'Birth Month/Year: ',
  'householdDataBlock.member-income': 'Income: ',
  'displayAnnualIncome.annual': ' annually',
  'editHHMember.ariaText': 'edit household member',
  'deleteHHMember.ariaText': 'delete household member',
  'householdDataBlock.basicInfo.deleteConfirm': 'Remove this member?',
  'householdDataBlock.basicInfo.deleteCancel': 'Cancel',
  'householdDataBlock.basicInfo.deleteConfirmButton': 'Remove',
};

const renderCards = (householdData: any[] = [], whiteLabel = 'default') => {
  const contextValue = {
    formData: { householdData } as any,
    whiteLabel,
  } as any;

  return render(
    <IntlProvider locale="en" messages={messages}>
      <Context.Provider value={contextValue}>
        <MemoryRouter initialEntries={[`/default/test-uuid/step-3/3`]}>
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
    mockSummaryUpdateScreen.mockResolvedValue(undefined);
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
      expect(container.querySelector('.member-added-container')).not.toBeInTheDocument();
    });

    it('renders a card for each completed member (slice to pageNumber - 1)', () => {
      // page=3, slice(0,2) → 2 cards shown out of 3 members
      renderCards([
        memberWithBirth(),
        memberWithBirth({ relationshipToHH: 'child', birthMonth: 3, birthYear: 2010 }),
        memberWithBirth({ relationshipToHH: 'spouse', birthMonth: 5, birthYear: 1985 }),
      ]);
      const cards = screen.getAllByRole('article').filter(el => el.className.includes('member-added-container'));
      expect(cards).toHaveLength(2);
    });

    it('renders "Yourself" label for the first member (index 0)', () => {
      renderCards([memberWithBirth(), memberWithBirth({ birthMonth: 3 }), memberWithBirth({ birthMonth: 4 })]);
      expect(screen.getByText(/yourself/i)).toBeInTheDocument();
    });

    it('renders relationship label from config for non-first members', () => {
      renderCards([
        memberWithBirth(),
        memberWithBirth({ relationshipToHH: 'spouse' }),
        memberWithBirth({ relationshipToHH: 'child' }),
      ]);
      expect(screen.getByText(/spouse/i)).toBeInTheDocument();
    });

    it('renders age for each member', () => {
      mockCalcAge.mockReturnValue(35);
      renderCards([memberWithBirth(), memberWithBirth({ birthMonth: 3 }), memberWithBirth({ birthMonth: 4 })]);
      // 2 cards shown, each shows age 35
      expect(screen.getAllByText('35')).toHaveLength(2);
    });

    it('renders income for each member', () => {
      mockCalcMemberYearlyIncome.mockReturnValue(24000);
      renderCards([memberWithBirth(), memberWithBirth({ birthMonth: 3 }), memberWithBirth({ birthMonth: 4 })]);
      expect(screen.getAllByText(/\$24,000/).length).toBeGreaterThan(0);
    });

    it('renders birth month/year when hasBirthMonthYear returns true', () => {
      mockHasBirthMonthYear.mockReturnValue(true);
      mockUseFormatBirthMonthYear.mockReturnValue(jest.fn().mockReturnValue('June 1990'));
      renderCards([memberWithBirth(), memberWithBirth({ birthMonth: 3 }), memberWithBirth({ birthMonth: 4 })]);
      expect(screen.getAllByText('June 1990').length).toBeGreaterThan(0);
    });

    it('does not render birth month/year when hasBirthMonthYear returns false', () => {
      mockHasBirthMonthYear.mockReturnValue(false);
      renderCards([memberWithBirth(), memberWithBirth({ birthMonth: 3 }), memberWithBirth({ birthMonth: 4 })]);
      expect(screen.queryByText('June 1990')).not.toBeInTheDocument();
    });

    it('does not render a card for member with no birth data', () => {
      const memberNoBirth = { id: '1', frontendId: 'f1', birthYear: undefined, birthMonth: undefined, relationshipToHH: 'spouse', hasIncome: false, incomeStreams: [] };
      // page=3, 3 members, but member 0 has no birth data → no card
      const { container } = renderCards([memberNoBirth as any, memberNoBirth as any, memberNoBirth as any]);
      expect(container.querySelector('.member-added-container')).not.toBeInTheDocument();
    });
  });

  describe('current member highlighting', () => {
    it('never marks any shown card as current — the current member is always excluded from the slice', () => {
      // slice(0, pageNumber-1) only renders indices 0..pageNumber-2.
      // current-household-member requires memberIndex+1 === pageNumber (i.e. memberIndex === pageNumber-1),
      // which is always outside the rendered slice, so no card should ever carry this class.
      renderCards([
        memberWithBirth(),
        memberWithBirth({ birthMonth: 3 }),
        memberWithBirth({ birthMonth: 4 }),
      ]);
      const cards = screen.getAllByRole('article').filter((el) => el.className.includes('member-added-container'));
      expect(cards).toHaveLength(2);
      cards.forEach((card) => {
        expect(card.className).not.toContain('current-household-member');
      });
    });
  });

  describe('edit button navigation', () => {
    it('renders an edit button for each rendered member card', () => {
      renderCards([
        memberWithBirth(),
        memberWithBirth({ birthMonth: 3 }),
        memberWithBirth({ birthMonth: 4 }),
      ]);
      const editButtons = screen.getAllByRole('button', { name: /edit household member/i });
      expect(editButtons).toHaveLength(2);
    });

    it('navigates to the correct member page when edit is clicked for first member', () => {
      renderCards([
        memberWithBirth(),
        memberWithBirth({ birthMonth: 3 }),
        memberWithBirth({ birthMonth: 4 }),
      ]);
      const editButtons = screen.getAllByRole('button', { name: /edit household member/i });
      fireEvent.click(editButtons[0]);
      expect(mockNavigate).toHaveBeenCalledWith('/default/test-uuid/step-3/1', { state: { isEditing: true } });
    });

    it('navigates to the correct member page for the second member', () => {
      renderCards([
        memberWithBirth(),
        memberWithBirth({ birthMonth: 3 }),
        memberWithBirth({ birthMonth: 4 }),
      ]);
      const editButtons = screen.getAllByRole('button', { name: /edit household member/i });
      fireEvent.click(editButtons[1]);
      expect(mockNavigate).toHaveBeenCalledWith('/default/test-uuid/step-3/2', { state: { isEditing: true } });
    });
  });

  describe('delete button', () => {
    it('renders a delete button for non-first members only', () => {
      renderCards([
        memberWithBirth(),
        memberWithBirth({ birthMonth: 3 }),
        memberWithBirth({ birthMonth: 4 }),
      ]);
      const deleteButtons = screen.getAllByRole('button', { name: /delete household member/i });
      // Only member at index 1 is shown (index 0 is "Yourself" — no delete)
      expect(deleteButtons).toHaveLength(1);
    });

    it('shows delete confirmation popover when delete is clicked', () => {
      renderCards([
        memberWithBirth(),
        memberWithBirth({ birthMonth: 3 }),
        memberWithBirth({ birthMonth: 4 }),
      ]);
      const deleteButton = screen.getByRole('button', { name: /delete household member/i });
      fireEvent.click(deleteButton);
      expect(screen.getByText('Remove this member?')).toBeInTheDocument();
    });

    it('closes popover when Cancel is clicked', () => {
      renderCards([
        memberWithBirth(),
        memberWithBirth({ birthMonth: 3 }),
        memberWithBirth({ birthMonth: 4 }),
      ]);
      fireEvent.click(screen.getByRole('button', { name: /delete household member/i }));
      expect(screen.getByText('Remove this member?')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(screen.queryByText('Remove this member?')).not.toBeVisible();
    });

    it('navigates back one page when the deleted member is before the current page', async () => {
      // page=3, deleting index=1 (< 3) should navigate to page 2
      renderCards([
        memberWithBirth(),
        memberWithBirth({ birthMonth: 3 }),
        memberWithBirth({ birthMonth: 4 }),
      ]);
      fireEvent.click(screen.getByRole('button', { name: /delete household member/i }));
      fireEvent.click(screen.getByRole('button', { name: /^remove$/i }));
      await waitFor(() => expect(mockNavigate).toHaveBeenCalled());
      expect(mockNavigate).toHaveBeenCalledWith('/default/test-uuid/step-3/2', { state: { basicInfoCollected: true } });
    });


    it('calls updateScreen with the member removed', async () => {
      const members = [
        memberWithBirth({ id: 'mem-0' }),
        memberWithBirth({ id: 'mem-1', birthMonth: 3 }),
        memberWithBirth({ id: 'mem-2', birthMonth: 4 }),
      ];
      renderCards(members);
      fireEvent.click(screen.getByRole('button', { name: /delete household member/i }));
      fireEvent.click(screen.getByRole('button', { name: /^remove$/i }));
      await waitFor(() => expect(mockSummaryUpdateScreen).toHaveBeenCalled());
      const calledWith = mockSummaryUpdateScreen.mock.calls[0][0];
      expect(calledWith.householdData).toHaveLength(2);
      expect(calledWith.householdData.map((m: any) => m.id)).not.toContain('mem-1');
    });
  });

  describe('calcAge NaN handling', () => {
    it('renders 0 instead of NaN when calcAge returns NaN', () => {
      mockCalcAge.mockReturnValue(NaN);
      renderCards([memberWithBirth(), memberWithBirth({ birthMonth: 3 }), memberWithBirth({ birthMonth: 4 })]);
      expect(screen.getAllByText('0').length).toBeGreaterThan(0);
    });
  });

  describe('accessibility', () => {
    it('each member card is an article element', () => {
      renderCards([memberWithBirth(), memberWithBirth({ birthMonth: 3 }), memberWithBirth({ birthMonth: 4 })]);
      const articles = screen.getAllByRole('article');
      expect(articles.length).toBeGreaterThan(0);
    });

    it('edit button has accessible aria-label', () => {
      renderCards([memberWithBirth(), memberWithBirth({ birthMonth: 3 }), memberWithBirth({ birthMonth: 4 })]);
      expect(screen.getAllByRole('button', { name: /edit household member/i }).length).toBeGreaterThan(0);
    });
  });
});
