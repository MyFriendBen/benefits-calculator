import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Context } from '../../../Wrapper/Wrapper';
import HouseholdMemberBasicInfoPage from './HouseholdMemberBasicInfoPage';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockNavigate = jest.fn();
const mockUpdateScreen = jest.fn().mockResolvedValue(undefined);

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ uuid: 'test-uuid', whiteLabel: 'co' }),
}));

jest.mock('../../../../Assets/updateScreen', () => ({
  __esModule: true,
  default: () => ({ updateScreen: mockUpdateScreen }),
}));

// Mock the navigation hook so we can assert navigateBack/navigateNext calls
const mockNavigateBack = jest.fn();
const mockNavigateNext = jest.fn();
jest.mock('../hooks/useHouseholdMembersNavigation', () => ({
  useHouseholdMembersNavigation: () => ({ navigateBack: mockNavigateBack, navigateNext: mockNavigateNext }),
}));

jest.mock('../../../../Assets/stepDirectory', () => ({
  useStepNumber: () => 5,
  useStepName: (_stepNumber: number) => undefined,
}));

jest.mock('../../../Config/configHook', () => ({
  useConfig: jest.fn().mockReturnValue({ spouse: 'Spouse', child: 'Child' }),
}));

// Mock useStepForm by substituting useForm directly (avoids hook-in-mock-function issues)
jest.mock('../../stepForm', () => {
  const { useForm } = jest.requireActual('react-hook-form');
  return {
    __esModule: true,
    default: useForm,
  };
});

// Mock BasicInfoFields to keep tests simple
jest.mock('../sections/BasicInfoFields', () => ({
  __esModule: true,
  default: ({ namePrefix, isFirstMember }: { namePrefix: string; isFirstMember: boolean }) => (
    <div data-testid={`basic-info-fields-${namePrefix}`} data-is-first={String(isFirstMember)} />
  ),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const messages = {
  'householdDataBlock.basicInfo.header': 'Tell us about each household member',
  'householdDataBlock.basicInfo.subheader': "Enter each member's birth date.",
  'householdDataBlock.basicInfo.you': 'You',
  'householdDataBlock.basicInfo.person': 'Person {number}',
  'householdDataBlock.basicInfo.addMember': 'Add a Household Member',
  'householdDataBlock.basicInfo.deleteConfirm': 'Remove this member?',
  'householdDataBlock.basicInfo.deleteCancel': 'Cancel',
  'householdDataBlock.basicInfo.deleteConfirmButton': 'Remove',
  previousButton: 'Back',
  continueButton: 'Continue',
};

const makeFormData = (householdSize: number, householdData: any[] = []) => ({
  householdSize,
  householdData,
});

const renderPage = (formData: any, locationState: Record<string, unknown> = {}) => {
  const contextValue = {
    formData,
    setFormData: jest.fn(),
    setStepLoading: jest.fn(),
  } as any;

  return render(
    <IntlProvider locale="en" messages={messages}>
      <Context.Provider value={contextValue}>
        <MemoryRouter initialEntries={[{ pathname: '/co/test-uuid/step-5/0', state: locationState }]}>
          <Routes>
            <Route path="/:whiteLabel/:uuid/step-:stepId/:page" element={<HouseholdMemberBasicInfoPage />} />
          </Routes>
        </MemoryRouter>
      </Context.Provider>
    </IntlProvider>,
  );
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('HouseholdMemberBasicInfoPage', () => {
  beforeAll(() => {
    // Polyfill crypto.randomUUID for jsdom (used in submit handler)
    if (!globalThis.crypto?.randomUUID) {
      const crypto = globalThis.crypto ?? {};
      Object.defineProperty(crypto, 'randomUUID', {
        value: () => 'test-uuid-' + Math.random().toString(36).slice(2),
        writable: true,
      });
      if (!globalThis.crypto) {
        Object.defineProperty(globalThis, 'crypto', { value: crypto, writable: true });
      }
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateScreen.mockResolvedValue(undefined);
  });

  describe('header and subheader', () => {
    it('renders the page header', () => {
      renderPage(makeFormData(2));
      expect(screen.getByText('Tell us about each household member')).toBeInTheDocument();
    });

    it('renders the page subheader', () => {
      renderPage(makeFormData(2));
      expect(screen.getByText("Enter each member's birth date.")).toBeInTheDocument();
    });
  });

  describe('member cards', () => {
    it('renders one card per household member', () => {
      renderPage(makeFormData(3));
      expect(screen.getByText('You')).toBeInTheDocument();
      expect(screen.getByText('Person 2')).toBeInTheDocument();
      expect(screen.getByText('Person 3')).toBeInTheDocument();
    });

    it('labels first member as "You"', () => {
      renderPage(makeFormData(2));
      expect(screen.getByText('You')).toBeInTheDocument();
    });

    it('labels subsequent members as "Person N"', () => {
      renderPage(makeFormData(3));
      expect(screen.getByText('Person 2')).toBeInTheDocument();
      expect(screen.getByText('Person 3')).toBeInTheDocument();
    });

    it('does not show delete button for first member', () => {
      renderPage(makeFormData(2));
      // Only 1 delete button for member 2
      const deleteButtons = screen.getAllByRole('button', { name: /delete household member/i });
      expect(deleteButtons).toHaveLength(1);
    });

    it('shows delete button for non-first members', () => {
      renderPage(makeFormData(3));
      const deleteButtons = screen.getAllByRole('button', { name: /delete household member/i });
      expect(deleteButtons).toHaveLength(2);
    });

    it('passes isFirstMember=true to BasicInfoFields for first member', () => {
      renderPage(makeFormData(2));
      const firstFields = screen.getByTestId('basic-info-fields-members.0');
      expect(firstFields).toHaveAttribute('data-is-first', 'true');
    });

    it('passes isFirstMember=false to BasicInfoFields for subsequent members', () => {
      renderPage(makeFormData(2));
      const secondFields = screen.getByTestId('basic-info-fields-members.1');
      expect(secondFields).toHaveAttribute('data-is-first', 'false');
    });
  });

  describe('add member button', () => {
    it('renders the add member button when below max size', () => {
      renderPage(makeFormData(2));
      expect(screen.getByText('Add a Household Member')).toBeInTheDocument();
    });

    it('hides the add member button when at max size (8)', () => {
      renderPage(makeFormData(8));
      expect(screen.queryByText('Add a Household Member')).not.toBeInTheDocument();
    });

    it('adds a new member card when clicked', () => {
      renderPage(makeFormData(2));
      expect(screen.queryByText('Person 3')).not.toBeInTheDocument();
      fireEvent.click(screen.getByText('Add a Household Member'));
      expect(screen.getByText('Person 3')).toBeInTheDocument();
    });
  });

  describe('delete confirmation popover', () => {
    it('shows confirmation popover when delete is clicked', () => {
      renderPage(makeFormData(2));
      fireEvent.click(screen.getByRole('button', { name: /delete household member/i }));
      expect(screen.getByText('Remove this member?')).toBeInTheDocument();
    });

    it('closes popover when Cancel is clicked', async () => {
      renderPage(makeFormData(2));
      fireEvent.click(screen.getByRole('button', { name: /delete household member/i }));
      expect(screen.getByText('Remove this member?')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      await waitFor(() => expect(screen.queryByText('Remove this member?')).not.toBeInTheDocument());
    });

    it('removes the member card after confirming delete', async () => {
      renderPage(makeFormData(3));
      expect(screen.getByText('Person 3')).toBeInTheDocument();
      const deleteButtons = screen.getAllByRole('button', { name: /delete household member/i });
      fireEvent.click(deleteButtons[1]); // delete Person 3
      fireEvent.click(screen.getByRole('button', { name: /^remove$/i }));
      // After updateScreen resolves and remove() runs, Person 3 card should be gone
      await waitFor(() => expect(screen.queryByText('Person 3')).not.toBeInTheDocument());
    });
  });

  describe('back navigation', () => {
    it('calls navigateBack when Back is clicked', () => {
      renderPage(makeFormData(2));
      fireEvent.click(screen.getByRole('button', { name: /back/i }));
      expect(mockNavigateBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('forward navigation (submit)', () => {
    it('calls navigate with basicInfoCollected state and updateScreen after successful submit', async () => {
      const validHouseholdData = [
        { id: 'id-0', frontendId: 'fid-0', birthMonth: 3, birthYear: 1990, relationshipToHH: 'headOfHousehold' },
        { id: 'id-1', frontendId: 'fid-1', birthMonth: 5, birthYear: 1992, relationshipToHH: 'spouse' },
      ];
      renderPage(makeFormData(2, validHouseholdData));
      fireEvent.click(screen.getByRole('button', { name: /continue/i }));
      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith('/co/test-uuid/step-5/1', { state: { basicInfoCollected: true } }),
      );
      expect(mockUpdateScreen).toHaveBeenCalledTimes(1);
    });

    it('returns to the page the user came from when returnToPage is set', async () => {
      // Reached via the "manage members" pencil from member 3 → Continue returns to page 3.
      const householdData = [
        { id: 'id-0', frontendId: 'fid-0', birthMonth: 3, birthYear: 1990, relationshipToHH: 'headOfHousehold' },
        { id: 'id-1', frontendId: 'fid-1', birthMonth: 5, birthYear: 1992, relationshipToHH: 'spouse' },
        { id: 'id-2', frontendId: 'fid-2', birthMonth: 7, birthYear: 2015, relationshipToHH: 'child' },
      ];
      renderPage(makeFormData(3, householdData), { returnToPage: 3 });
      fireEvent.click(screen.getByRole('button', { name: /continue/i }));
      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith('/co/test-uuid/step-5/3', { state: { basicInfoCollected: true } }),
      );
    });

    it('keeps each surviving member’s own data when a middle member is deleted', async () => {
      // Deleting Person 2 shifts Person 3 into index 1. Saved member data must follow the member
      // (by frontendId), not the array slot, or Person 3 inherits Person 2's id/insurance/income
      // and loses their own.
      const householdData = [
        {
          id: 'id-0',
          frontendId: 'fid-0',
          birthMonth: 3,
          birthYear: 1990,
          relationshipToHH: 'headOfHousehold',
          healthInsurance: { none: true },
        },
        {
          id: 'id-1',
          frontendId: 'fid-1',
          birthMonth: 5,
          birthYear: 1992,
          relationshipToHH: 'spouse',
          healthInsurance: { employer: true },
          incomeStreams: [{ incomeStreamName: 'wages', incomeAmount: '1000' }],
        },
        {
          id: 'id-2',
          frontendId: 'fid-2',
          birthMonth: 7,
          birthYear: 2015,
          relationshipToHH: 'child',
          healthInsurance: { medicaid: true },
        },
      ];
      renderPage(makeFormData(3, householdData));

      // Delete Person 2 (the middle member); delete buttons exist only for non-first members.
      const deleteButtons = screen.getAllByRole('button', { name: /delete household member/i });
      fireEvent.click(deleteButtons[0]);
      fireEvent.click(screen.getByRole('button', { name: /^remove$/i }));
      await waitFor(() => expect(screen.queryByText('Person 3')).not.toBeInTheDocument());

      fireEvent.click(screen.getByRole('button', { name: /continue/i }));
      await waitFor(() => expect(mockUpdateScreen).toHaveBeenCalledTimes(1));

      const saved = mockUpdateScreen.mock.calls[0][0].householdData;
      expect(saved).toHaveLength(2);
      expect(saved[0]).toMatchObject({ id: 'id-0', frontendId: 'fid-0', relationshipToHH: 'headOfHousehold' });
      // The surviving child keeps their own identity and data rather than the deleted spouse's.
      expect(saved[1]).toMatchObject({
        id: 'id-2',
        frontendId: 'fid-2',
        relationshipToHH: 'child',
        healthInsurance: { medicaid: true },
      });
      expect(saved[1].incomeStreams).toEqual([]);
    });

    it('restores edit mode when the user came here mid-edit', async () => {
      // Pencil → roster → Continue. Without isEditing the member page hides the basic-info
      // fields the user came to edit and Continue loses its return path.
      const householdData = [
        { id: 'id-0', frontendId: 'fid-0', birthMonth: 3, birthYear: 1990, relationshipToHH: 'headOfHousehold' },
        { id: 'id-1', frontendId: 'fid-1', birthMonth: 5, birthYear: 1992, relationshipToHH: 'spouse' },
      ];
      renderPage(makeFormData(2, householdData), { returnToPage: 2, returnToEditing: true });
      fireEvent.click(screen.getByRole('button', { name: /continue/i }));
      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith('/co/test-uuid/step-5/2', {
          state: { basicInfoCollected: true, isEditing: true },
        }),
      );
    });

    it('does not set isEditing when the user was not editing', async () => {
      const householdData = [
        { id: 'id-0', frontendId: 'fid-0', birthMonth: 3, birthYear: 1990, relationshipToHH: 'headOfHousehold' },
        { id: 'id-1', frontendId: 'fid-1', birthMonth: 5, birthYear: 1992, relationshipToHH: 'spouse' },
      ];
      renderPage(makeFormData(2, householdData), { returnToPage: 2 });
      fireEvent.click(screen.getByRole('button', { name: /continue/i }));
      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith('/co/test-uuid/step-5/2', {
          state: { basicInfoCollected: true },
        }),
      );
    });

    it('restores the Confirmation origin so Continue returns there', async () => {
      // Edit a member from Confirmation, tap the pencil, come back: without the flag,
      // useShouldRedirectToConfirmation goes false and Continue walks to the next member.
      const householdData = [
        { id: 'id-0', frontendId: 'fid-0', birthMonth: 3, birthYear: 1990, relationshipToHH: 'headOfHousehold' },
        { id: 'id-1', frontendId: 'fid-1', birthMonth: 5, birthYear: 1992, relationshipToHH: 'spouse' },
      ];
      renderPage(makeFormData(2, householdData), {
        returnToPage: 2,
        returnToEditing: true,
        returnToConfirmation: true,
      });
      fireEvent.click(screen.getByRole('button', { name: /continue/i }));
      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith('/co/test-uuid/step-5/2', {
          state: { basicInfoCollected: true, isEditing: true, routedFromConfirmationPg: true },
        }),
      );
    });

    it("hands back the edit's original destination so Continue resumes that path", async () => {
      // Arrived from member 2 (returnToPage 2) during an edit that was opened from member 4
      // (editReturnToPage 4). Continue goes to page 2 and restores returnToPage 4 for later.
      const householdData = [
        { id: 'id-0', frontendId: 'fid-0', birthMonth: 3, birthYear: 1990, relationshipToHH: 'headOfHousehold' },
        { id: 'id-1', frontendId: 'fid-1', birthMonth: 5, birthYear: 1992, relationshipToHH: 'spouse' },
        { id: 'id-2', frontendId: 'fid-2', birthMonth: 7, birthYear: 2015, relationshipToHH: 'child' },
        { id: 'id-3', frontendId: 'fid-3', birthMonth: 9, birthYear: 1960, relationshipToHH: 'parent' },
      ];
      renderPage(makeFormData(4, householdData), { returnToPage: 2, returnToEditing: true, editReturnToPage: 4 });
      fireEvent.click(screen.getByRole('button', { name: /continue/i }));
      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith('/co/test-uuid/step-5/2', {
          state: { basicInfoCollected: true, isEditing: true, returnToPage: 4 },
        }),
      );
    });

    it("shifts the edit's destination when an earlier member is deleted", async () => {
      // Same round trip, but member 2 is deleted here — the opener (member 4) moves to page 3.
      const householdData = [
        { id: 'id-0', frontendId: 'fid-0', birthMonth: 3, birthYear: 1990, relationshipToHH: 'headOfHousehold' },
        { id: 'id-1', frontendId: 'fid-1', birthMonth: 5, birthYear: 1992, relationshipToHH: 'spouse' },
        { id: 'id-2', frontendId: 'fid-2', birthMonth: 7, birthYear: 2015, relationshipToHH: 'child' },
        { id: 'id-3', frontendId: 'fid-3', birthMonth: 9, birthYear: 1960, relationshipToHH: 'parent' },
      ];
      renderPage(makeFormData(4, householdData), { returnToPage: 3, returnToEditing: true, editReturnToPage: 4 });

      const deleteButtons = screen.getAllByRole('button', { name: /delete household member/i });
      fireEvent.click(deleteButtons[0]); // delete member index 1
      fireEvent.click(screen.getByRole('button', { name: /^remove$/i }));
      await waitFor(() => expect(screen.queryByText('Person 4')).not.toBeInTheDocument());

      fireEvent.click(screen.getByRole('button', { name: /continue/i }));
      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith('/co/test-uuid/step-5/2', {
          state: { basicInfoCollected: true, isEditing: true, returnToPage: 3 },
        }),
      );
    });

    it('follows the return-target member when an earlier member is deleted', async () => {
      // Opened the roster from member 3 of 4, then deleted member 2. The original member 3 is
      // now on page 2, so Continue must land there — not on page 3, which is a different person.
      const householdData = [
        { id: 'id-0', frontendId: 'fid-0', birthMonth: 3, birthYear: 1990, relationshipToHH: 'headOfHousehold' },
        { id: 'id-1', frontendId: 'fid-1', birthMonth: 5, birthYear: 1992, relationshipToHH: 'spouse' },
        { id: 'id-2', frontendId: 'fid-2', birthMonth: 7, birthYear: 2015, relationshipToHH: 'child' },
        { id: 'id-3', frontendId: 'fid-3', birthMonth: 9, birthYear: 1960, relationshipToHH: 'parent' },
      ];
      renderPage(makeFormData(4, householdData), { returnToPage: 3 });

      // Delete member 2 (first trash button belongs to member index 1).
      const deleteButtons = screen.getAllByRole('button', { name: /delete household member/i });
      fireEvent.click(deleteButtons[0]);
      fireEvent.click(screen.getByRole('button', { name: /^remove$/i }));
      await waitFor(() => expect(screen.queryByText('Person 4')).not.toBeInTheDocument());

      fireEvent.click(screen.getByRole('button', { name: /continue/i }));
      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith('/co/test-uuid/step-5/2', { state: { basicInfoCollected: true } }),
      );
    });

    it('clamps returnToPage to the new member count when members were removed', async () => {
      // returnToPage was 3, but the household is now only 2 members — clamp to page 2 so we
      // don't navigate to a member page that no longer exists.
      const householdData = [
        { id: 'id-0', frontendId: 'fid-0', birthMonth: 3, birthYear: 1990, relationshipToHH: 'headOfHousehold' },
        { id: 'id-1', frontendId: 'fid-1', birthMonth: 5, birthYear: 1992, relationshipToHH: 'spouse' },
      ];
      renderPage(makeFormData(2, householdData), { returnToPage: 3 });
      fireEvent.click(screen.getByRole('button', { name: /continue/i }));
      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith('/co/test-uuid/step-5/2', { state: { basicInfoCollected: true } }),
      );
    });
  });

  describe('delete — local-only on page 0', () => {
    it('removes the card without calling updateScreen when adding then deleting a member', async () => {
      // Page 0 delete is local-only — members may have incomplete data not yet validated.
      // updateScreen is deferred until form submit.
      const householdData = [
        { id: 'id-0', frontendId: 'fid-0', birthMonth: 1, birthYear: 1980, relationshipToHH: 'headOfHousehold' },
        { id: 'id-1', frontendId: 'fid-1', birthMonth: 2, birthYear: 1985, relationshipToHH: 'spouse' },
      ];
      renderPage(makeFormData(2, householdData));

      // Add a third member on page 0 — this member is NOT in formData.householdData
      fireEvent.click(screen.getByText('Add a Household Member'));
      expect(screen.getByText('Person 3')).toBeInTheDocument();

      // Delete Person 3
      const deleteButtons = screen.getAllByRole('button', { name: /delete household member/i });
      fireEvent.click(deleteButtons[1]);
      fireEvent.click(screen.getByRole('button', { name: /^remove$/i }));

      await waitFor(() => expect(screen.queryByText('Person 3')).not.toBeInTheDocument());
      expect(mockUpdateScreen).not.toHaveBeenCalled();
    });

    it('removes the card without calling updateScreen when deleting an existing member', async () => {
      const householdData = [
        { id: 'id-0', frontendId: 'fid-0', birthMonth: 1, birthYear: 1980, relationshipToHH: 'headOfHousehold' },
        { id: 'id-1', frontendId: 'fid-1', birthMonth: 2, birthYear: 1985, relationshipToHH: 'spouse' },
        { id: 'id-2', frontendId: 'fid-2', birthMonth: 3, birthYear: 1990, relationshipToHH: 'child' },
      ];
      renderPage(makeFormData(3, householdData));

      expect(screen.getByText('Person 3')).toBeInTheDocument();
      const deleteButtons = screen.getAllByRole('button', { name: /delete household member/i });
      fireEvent.click(deleteButtons[1]);
      fireEvent.click(screen.getByRole('button', { name: /^remove$/i }));

      await waitFor(() => expect(screen.queryByText('Person 3')).not.toBeInTheDocument());
      expect(mockUpdateScreen).not.toHaveBeenCalled();
    });
  });
});
