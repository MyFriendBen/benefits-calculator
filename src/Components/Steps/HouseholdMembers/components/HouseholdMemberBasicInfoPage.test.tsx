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

jest.mock('../../../../Assets/stepDirectory', () => ({
  useStepNumber: () => 5,
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

// Mock SVG icon
jest.mock('../../../../Assets/icons/General/head.svg', () => ({
  ReactComponent: () => <svg data-testid="person-icon" />,
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const messages = {
  'householdDataBlock.basicInfo.header': 'Tell us about each household member',
  'householdDataBlock.basicInfo.subheader': 'Enter each member\'s birth date.',
  'householdDataBlock.basicInfo.you': 'You',
  'householdDataBlock.basicInfo.person': 'Person {number}',
  'householdDataBlock.basicInfo.addMember': 'Add a Household Member',
  'householdDataBlock.basicInfo.deleteConfirm': 'Remove this member?',
  'householdDataBlock.basicInfo.deleteCancel': 'Cancel',
  'householdDataBlock.basicInfo.deleteConfirmButton': 'Remove',
  'previousButton': 'Back',
  'continueButton': 'Continue',
};

const makeFormData = (householdSize: number, householdData: any[] = []) => ({
  householdSize,
  householdData,
});

const renderPage = (formData: any) => {
  const contextValue = {
    formData,
    setFormData: jest.fn(),
    setStepLoading: jest.fn(),
  } as any;

  return render(
    <IntlProvider locale="en" messages={messages}>
      <Context.Provider value={contextValue}>
        <MemoryRouter initialEntries={['/co/test-uuid/step-5/0']}>
          <Routes>
            <Route path="/:whiteLabel/:uuid/step-:stepId/:page" element={<HouseholdMemberBasicInfoPage />} />
          </Routes>
        </MemoryRouter>
      </Context.Provider>
    </IntlProvider>
  );
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('HouseholdMemberBasicInfoPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

    it('closes popover when Cancel is clicked', () => {
      renderPage(makeFormData(2));
      fireEvent.click(screen.getByRole('button', { name: /delete household member/i }));
      expect(screen.getByText('Remove this member?')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(screen.queryByText('Remove this member?')).not.toBeVisible();
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
    it('navigates to previous step when Back is clicked', () => {
      renderPage(makeFormData(2));
      fireEvent.click(screen.getByRole('button', { name: /back/i }));
      expect(mockNavigate).toHaveBeenCalledWith('/co/test-uuid/step-4');
    });
  });
});
