import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Context } from '../../../Wrapper/Wrapper';
import HouseholdMemberSummaryCards from './HouseholdMemberSummaryCards';
import { calcAge } from '../../../../Assets/age.tsx';
import { calcMemberYearlyIncome } from '../../../../Assets/income';
import { useConfig } from '../../../Config/configHook';
import { useStepNumber } from '../../../../Assets/stepDirectory';
import { useTranslateNumber } from '../../../../Assets/languageOptions';
import useScreenApi from '../../../../Assets/updateScreen';

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

jest.mock('../../../../Assets/updateScreen', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockCalcAge = calcAge as jest.MockedFunction<typeof calcAge>;
const mockCalcMemberYearlyIncome = calcMemberYearlyIncome as jest.MockedFunction<typeof calcMemberYearlyIncome>;
const mockUseConfig = useConfig as jest.MockedFunction<typeof useConfig>;
const mockUseStepNumber = useStepNumber as jest.MockedFunction<typeof useStepNumber>;
const mockUseTranslateNumber = useTranslateNumber as jest.MockedFunction<typeof useTranslateNumber>;
const mockUseScreenApi = useScreenApi as jest.MockedFunction<typeof useScreenApi>;
const mockUpdateScreen = jest.fn();

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
    'deleteHHMember.ariaText': 'delete household member',
    'householdDataBlock.basicInfo.deleteConfirm': 'Remove this member?',
    'householdDataBlock.basicInfo.deleteCancel': 'Cancel',
    'householdDataBlock.basicInfo.deleteConfirmButton': 'Remove',
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
    </IntlProvider>,
  );
};

// Completed non-current cards get role="button", so query by class rather than
// by the "article" role (which would exclude the clickable cards).
const cardContainers = () => Array.from(document.querySelectorAll('.member-added-container')) as HTMLElement[];

describe('HouseholdMemberSummaryCards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseStepNumber.mockReturnValue(3);
    mockUseConfig.mockReturnValue({ spouse: 'Spouse', child: 'Child' } as any);
    mockCalcAge.mockReturnValue(35);
    mockCalcMemberYearlyIncome.mockReturnValue(12000);
    mockUseTranslateNumber.mockReturnValue((n: any) => String(n));
    mockUpdateScreen.mockResolvedValue(undefined);
    mockUseScreenApi.mockReturnValue({ updateScreen: mockUpdateScreen } as any);
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

    it('renders income for the current member when editing (data already submitted)', () => {
      // page is '2' → index 1 is the current member. When that member is already completed
      // (i.e. the user navigated back to edit them), their submitted income should still show.
      renderCards([completedMember(), completedMember()], 2);
      // Both completed members surface income, including the current one being edited.
      expect(screen.getAllByText(/Annual Income/i)).toHaveLength(2);
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

    it('treats a member with no healthInsurance object at all as not completed', () => {
      // Distinct from the `{}` case: healthInsurance is entirely absent, exercising the
      // `member.healthInsurance && ...` short-circuit in isMemberCompleted.
      const inProgress = completedMember({ healthInsurance: undefined });
      renderCards([inProgress], 1);
      const cards = cardContainers();
      expect(cards[0].className).not.toContain('completed-household-member');
      expect(cards[0]).not.toHaveAttribute('role', 'button');
      expect(screen.queryByText(/Annual Income/i)).not.toBeInTheDocument();
    });

    it('treats "none" (no insurance) as a completed insurance answer', () => {
      // `{ none: true }` is a real, intentional answer — someone with no coverage is done.
      // Guards against a future refactor silently requiring a "positive" coverage type.
      renderCards([completedMember({ healthInsurance: { none: true } })], 1);
      const cards = cardContainers();
      expect(cards[0].className).toContain('completed-household-member');
      expect(screen.getByText(/Annual Income/i)).toBeInTheDocument();
    });

    it('treats an energy-calculator (CESN) member as completed without health insurance', () => {
      // CESN never collects health insurance; a submitted member instead has an energyCalculator
      // object. Completion must key off "form was submitted", not the insurance answer.
      const cesnMember = completedMember({ healthInsurance: undefined, energyCalculator: { receivesSsi: false } });
      renderCards([cesnMember], 1);
      const cards = cardContainers();
      expect(cards[0].className).toContain('completed-household-member');
    });
  });

  describe('household slot count', () => {
    it('renders nothing extra when householdSize is 0 but members exist', () => {
      // A stale/malformed householdSize must never hide already-entered members:
      // the slot count is clamped up to householdData.length.
      renderCards([completedMember()], 0);
      expect(cardContainers()).toHaveLength(1);
    });

    it('clamps a householdSize smaller than the member count up to the member count', () => {
      renderCards([completedMember(), completedMember({ relationshipToHH: 'child' })], 1);
      expect(cardContainers()).toHaveLength(2);
    });

    it('falls back to the member count when householdSize is not a finite number', () => {
      renderCards([completedMember()], NaN);
      expect(cardContainers()).toHaveLength(1);
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
      expect(mockNavigate).toHaveBeenCalledWith('/default/test-uuid/step-3/1', {
        state: { isEditing: true, returnToPage: 2 },
      });
    });

    it('navigates when a completed card is activated with the Enter key', () => {
      renderCards([completedMember(), completedMember()], 2);
      const cards = cardContainers();
      fireEvent.keyDown(cards[0], { key: 'Enter' });
      expect(mockNavigate).toHaveBeenCalledWith('/default/test-uuid/step-3/1', {
        state: { isEditing: true, returnToPage: 2 },
      });
    });

    it('navigates when a completed card is activated with the Space key', () => {
      renderCards([completedMember(), completedMember()], 2);
      const cards = cardContainers();
      fireEvent.keyDown(cards[0], { key: ' ' });
      expect(mockNavigate).toHaveBeenCalledWith('/default/test-uuid/step-3/1', {
        state: { isEditing: true, returnToPage: 2 },
      });
    });

    it('does not make the current member card clickable', () => {
      renderCards([completedMember(), completedMember()], 2);
      const cards = cardContainers();
      expect(cards[1]).not.toHaveAttribute('role', 'button');
    });
  });

  describe('age display', () => {
    it('omits the age parenthetical entirely when calcAge returns NaN', () => {
      // A malformed birthdate must not render a misleading "(0)" or "(NaN)" — we show the
      // relationship label alone until a valid age can be computed.
      mockCalcAge.mockReturnValue(NaN);
      renderCards([completedMember()], 1);
      expect(screen.queryByText(/\(0\)/)).not.toBeInTheDocument();
      expect(screen.queryByText(/\(NaN\)/)).not.toBeInTheDocument();
    });

    it('omits the age and income for an in-progress member with no birthdate yet', () => {
      // A member slot with no birth data shows just its label (no "(0)" age, no "$0" income),
      // so the roster can render on the member's own page while they're still filling it in.
      renderCards([{ relationshipToHH: 'spouse' } as any], 2);
      expect(screen.queryByText(/\(0\)/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Annual Income/i)).not.toBeInTheDocument();
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

  describe('delete actions', () => {
    // page is '2' → index 1 is the current member. The trash button only renders on entered,
    // non-head members, so getAllByLabelText returns them in DOM (member-index) order.
    const trashButtons = () => screen.getAllByLabelText('delete household member');

    it('does not render a delete button on the head-of-household card', () => {
      // Index 0 ("Yourself") can never be deleted here, so it has no trash button. With one
      // other (deletable) member, exactly one trash button renders.
      renderCards([completedMember(), completedMember({ relationshipToHH: 'child' })], 2);
      expect(trashButtons()).toHaveLength(1);
    });

    it('renders a delete button for an incomplete non-head member', () => {
      // An entered-but-incomplete member can still be removed (it just isn't editable).
      const incomplete = { relationshipToHH: 'child', healthInsurance: {} } as any;
      renderCards([completedMember(), incomplete], 3);
      // Only the incomplete member (index 1) is deletable; the head (0) and placeholder (2) aren't.
      expect(trashButtons()).toHaveLength(1);
    });

    it('removes the member and decrements household size on confirm', async () => {
      const members = [
        completedMember(),
        completedMember({ relationshipToHH: 'child' }),
        completedMember({ relationshipToHH: 'parent' }),
      ];
      renderCards(members, 3);
      // Trash buttons: [0] = member index 1, [1] = member index 2. Delete the last (index 2).
      fireEvent.click(trashButtons()[1]);
      fireEvent.click(screen.getByText('Remove'));

      await waitFor(() => expect(mockUpdateScreen).toHaveBeenCalledTimes(1));
      const payload = mockUpdateScreen.mock.calls[0][0];
      expect(payload.householdSize).toBe(2);
      expect(payload.householdData).toHaveLength(2);
      expect(payload.householdData.map((m: any) => m.relationshipToHH)).toEqual(['spouse', 'child']);
    });

    it('navigates to the basic-info page when deleting the current member', async () => {
      // page is '2' → index 1 is current. Deleting it invalidates the current page.
      renderCards([completedMember(), completedMember({ relationshipToHH: 'child' })], 2);
      // The only trash button belongs to the current member (index 1).
      fireEvent.click(trashButtons()[0]);
      fireEvent.click(screen.getByText('Remove'));

      await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/default/test-uuid/step-3/0'));
    });

    it('stays on the current page when deleting a member after it', async () => {
      // Deleting a member whose page is after the current one doesn't change the current page
      // number, so no navigation happens — the updated context re-renders the roster in place.
      const members = [
        completedMember(),
        completedMember({ relationshipToHH: 'child' }),
        completedMember({ relationshipToHH: 'parent' }),
      ];
      renderCards(members, 3);
      // [1] = member index 2 (page 3), which is after the current page (2).
      fireEvent.click(trashButtons()[1]);
      fireEvent.click(screen.getByText('Remove'));

      await waitFor(() => expect(mockUpdateScreen).toHaveBeenCalled());
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('does not trigger edit navigation when the trash button is clicked', () => {
      // The trash button lives inside an editable (clickable) card; its click must not bubble
      // up and navigate to the edit page.
      renderCards(
        [
          completedMember(),
          completedMember({ relationshipToHH: 'child' }),
          completedMember({ relationshipToHH: 'parent' }),
        ],
        2,
      );
      // [1] = member index 2, an editable (completed, non-current) card.
      fireEvent.click(trashButtons()[1]);
      // Confirmation opened, but no edit navigation happened.
      expect(screen.getByText('Remove this member?')).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('can cancel the delete confirmation without removing the member', () => {
      renderCards(
        [
          completedMember(),
          completedMember({ relationshipToHH: 'child' }),
          completedMember({ relationshipToHH: 'parent' }),
        ],
        3,
      );
      fireEvent.click(trashButtons()[1]);
      fireEvent.click(screen.getByText('Cancel'));

      expect(mockUpdateScreen).not.toHaveBeenCalled();
    });
  });
});
