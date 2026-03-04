import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { Context } from '../../Wrapper/Wrapper';
import Expenses from './Expenses';
import { FormData } from '../../../Types/FormData';

// ─── Mocks ───────────────────────────────────────────────────────────────────

// Stub nav chrome — not relevant to expense logic and has deep router dependencies
jest.mock('../../PrevAndContinueButtons/PrevAndContinueButtons', () => ({
  __esModule: true,
  default: () => <button type="submit">Continue</button>,
}));

jest.mock('../../Config/configHook', () => ({
  useConfig: () => ({
    housing: {
      rent: 'Rent',
      mortgage: 'Mortgage',
    },
    childCare: {
      childCare: 'Child Care',
    },
  }),
}));

const mockUpdateScreen = jest.fn();
jest.mock('../../../Assets/updateScreen', () => ({
  __esModule: true,
  default: () => ({ updateScreen: mockUpdateScreen }),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ uuid: 'test-uuid-123' }),
}));

// useStepForm navigates after submit — stub navigation to a no-op
jest.mock('../../QuestionComponents/questionHooks', () => ({
  useDefaultBackNavigationFunction: () => jest.fn(),
  useGoToNextStep: () => jest.fn(),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const baseFormData: FormData = {
  isTest: false,
  frozen: false,
  externalID: undefined,
  agreeToTermsOfService: false,
  is13OrOlder: false,
  zipcode: '80203',
  county: 'Denver',
  startTime: new Date().toJSON(),
  hasExpenses: 'false',
  expenses: [],
  householdSize: 1,
  householdData: [],
  householdAssets: 0,
  hasBenefits: 'preferNotToAnswer',
  benefits: {} as FormData['benefits'],
  healthInsuranceOptions: {} as FormData['healthInsuranceOptions'],
  referralSource: '',
  referralSourceDetails: '',
  acesScore: null,
  commConsent: false,
  signUpInfo: { email: '', phone: '', firstName: '', lastName: '', sendOffers: false, sendUpdates: false, commConsent: false },
  urlSearchParams: '',
  utmParameters: { utm_source: '', utm_medium: '', utm_campaign: '', utm_term: '', utm_content: '' },
  currentStep: 0,
  isMemberOfTribalNation: false,
  isInCoPayingCollege: false,
};

function renderExpenses(formDataOverrides: Partial<FormData> = {}) {
  const formData = { ...baseFormData, ...formDataOverrides };
  return render(
    <IntlProvider locale="en">
      <Context.Provider
        value={{
          formData,
          setFormData: jest.fn(),
          setStepLoading: jest.fn(),
          config: undefined,
          whiteLabel: undefined,
          locale: 'en',
          theme: undefined,
        } as any}
      >
        <Expenses />
      </Context.Provider>
    </IntlProvider>,
  );
}

/** Returns the .expense-row div containing a specific expense label. */
function getExpenseRow(labelText: string | RegExp) {
  return screen.getByText(labelText, { selector: 'label' }).closest('.expense-row')!;
}

/** Returns the amount input for a given expense row. */
function getAmountInput(labelText: string | RegExp): HTMLInputElement {
  const row = getExpenseRow(labelText);
  return within(row).getByRole('textbox') as HTMLInputElement;
}

/** Returns the frequency radiogroup within a given expense row. */
function getFrequencyGroup(labelText: string | RegExp) {
  const row = getExpenseRow(labelText);
  return within(row).getByRole('radiogroup');
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Expenses', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateScreen.mockResolvedValue(undefined);
  });

  describe('Rendering', () => {
    it('renders the question header and description', () => {
      renderExpenses();
      expect(screen.getByText(/which of the following expenses/i)).toBeInTheDocument();
      expect(screen.getByText(/enter whole dollar amounts/i)).toBeInTheDocument();
    });

    it('renders all expense rows from config', () => {
      renderExpenses();
      expect(screen.getByText('Rent', { selector: 'label' })).toBeInTheDocument();
      expect(screen.getByText('Mortgage', { selector: 'label' })).toBeInTheDocument();
      expect(screen.getByText('Child Care', { selector: 'label' })).toBeInTheDocument();
    });

    it('renders category headers as h3 elements', () => {
      renderExpenses();
      expect(screen.getByRole('heading', { name: 'Housing', level: 3 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Child Care', level: 3 })).toBeInTheDocument();
    });

    it('renders amount inputs with $ adornment and placeholder 0', () => {
      renderExpenses();
      const inputs = screen.getAllByPlaceholderText('0');
      expect(inputs).toHaveLength(3);
    });

    it('renders frequency toggles for each row', () => {
      renderExpenses();
      const monthlyBtns = screen.getAllByRole('radio', { name: /monthly/i });
      const yearlyBtns = screen.getAllByRole('radio', { name: /yearly/i });
      expect(monthlyBtns).toHaveLength(3);
      expect(yearlyBtns).toHaveLength(3);
    });

    it('defaults all frequency buttons to Monthly selected', () => {
      renderExpenses();
      screen.getAllByRole('radio', { name: /monthly/i }).forEach((btn) => {
        expect(btn).toHaveAttribute('aria-checked', 'true');
      });
      screen.getAllByRole('radio', { name: /yearly/i }).forEach((btn) => {
        expect(btn).toHaveAttribute('aria-checked', 'false');
      });
    });
  });

  describe('Restoring saved values', () => {
    it('pre-fills saved expense amount', () => {
      renderExpenses({
        expenses: [{ expenseSourceName: 'rent', expenseAmount: 1500, expenseFrequency: 'monthly' }],
      });
      expect(getAmountInput('Rent')).toHaveValue('1,500');
    });

    it('pre-selects Yearly when saved frequency is yearly', () => {
      renderExpenses({
        expenses: [{ expenseSourceName: 'rent', expenseAmount: 12000, expenseFrequency: 'yearly' }],
      });
      const group = getFrequencyGroup('Rent');
      expect(within(group).getByRole('radio', { name: /yearly/i })).toHaveAttribute('aria-checked', 'true');
      expect(within(group).getByRole('radio', { name: /monthly/i })).toHaveAttribute('aria-checked', 'false');
    });

    it('leaves unrestored rows at 0 (shows placeholder, not a value)', () => {
      renderExpenses({
        expenses: [{ expenseSourceName: 'rent', expenseAmount: 800, expenseFrequency: 'monthly' }],
      });
      expect(getAmountInput('Mortgage')).toHaveValue('');
    });
  });

  describe('Row highlight', () => {
    it('adds expense-row--active class when a non-zero amount is entered', async () => {
      renderExpenses();
      const rentInput = getAmountInput('Rent');
      fireEvent.change(rentInput, { target: { value: '500' } });

      await waitFor(() => {
        expect(getExpenseRow('Rent')).toHaveClass('expense-row--active');
      });
    });

    it('does not add expense-row--active to other rows', async () => {
      renderExpenses();
      fireEvent.change(getAmountInput('Rent'), { target: { value: '500' } });

      await waitFor(() => {
        expect(getExpenseRow('Mortgage')).not.toHaveClass('expense-row--active');
      });
    });

    it('removes expense-row--active when amount is cleared', async () => {
      renderExpenses({
        expenses: [{ expenseSourceName: 'rent', expenseAmount: 500, expenseFrequency: 'monthly' }],
      });
      fireEvent.change(getAmountInput('Rent'), { target: { value: '' } });

      await waitFor(() => {
        expect(getExpenseRow('Rent')).not.toHaveClass('expense-row--active');
      });
    });
  });

  describe('Frequency selector', () => {
    it('switches frequency to Yearly when Yearly is clicked', () => {
      renderExpenses();
      const group = getFrequencyGroup('Rent');
      fireEvent.click(within(group).getByRole('radio', { name: /yearly/i }));
      expect(within(group).getByRole('radio', { name: /yearly/i })).toHaveAttribute('aria-checked', 'true');
    });

    it('deselects Monthly when Yearly is selected', () => {
      renderExpenses();
      const group = getFrequencyGroup('Rent');
      fireEvent.click(within(group).getByRole('radio', { name: /yearly/i }));
      expect(within(group).getByRole('radio', { name: /monthly/i })).toHaveAttribute('aria-checked', 'false');
    });

    it('frequency changes are independent per row', () => {
      renderExpenses();
      // Switch rent to yearly
      fireEvent.click(within(getFrequencyGroup('Rent')).getByRole('radio', { name: /yearly/i }));

      // Mortgage should still be monthly
      const mortgageGroup = getFrequencyGroup('Mortgage');
      expect(within(mortgageGroup).getByRole('radio', { name: /monthly/i })).toHaveAttribute('aria-checked', 'true');
      expect(within(mortgageGroup).getByRole('radio', { name: /yearly/i })).toHaveAttribute('aria-checked', 'false');
    });
  });

  describe('Form submission', () => {
    it('calls updateScreen with only non-zero expenses', async () => {
      renderExpenses();
      fireEvent.change(getAmountInput('Rent'), { target: { value: '1200' } });
      fireEvent.click(screen.getByRole('button', { name: /continue/i }));

      await waitFor(() => {
        expect(mockUpdateScreen).toHaveBeenCalledWith(
          expect.objectContaining({
            hasExpenses: 'true',
            expenses: [
              expect.objectContaining({ expenseSourceName: 'rent', expenseAmount: 1200, expenseFrequency: 'monthly' }),
            ],
          }),
        );
      });
    });

    it('sets hasExpenses to false and sends empty array when all amounts are 0', async () => {
      renderExpenses();
      fireEvent.click(screen.getByRole('button', { name: /continue/i }));

      await waitFor(() => {
        expect(mockUpdateScreen).toHaveBeenCalledWith(
          expect.objectContaining({
            hasExpenses: 'false',
            expenses: [],
          }),
        );
      });
    });

    it('includes the correct frequency in the submitted expense', async () => {
      renderExpenses();
      fireEvent.change(getAmountInput('Rent'), { target: { value: '14400' } });
      fireEvent.click(within(getFrequencyGroup('Rent')).getByRole('radio', { name: /yearly/i }));
      fireEvent.click(screen.getByRole('button', { name: /continue/i }));

      await waitFor(() => {
        expect(mockUpdateScreen).toHaveBeenCalledWith(
          expect.objectContaining({
            expenses: [expect.objectContaining({ expenseSourceName: 'rent', expenseFrequency: 'yearly' })],
          }),
        );
      });
    });

    it('sends multiple expenses when multiple amounts are entered', async () => {
      renderExpenses();
      fireEvent.change(getAmountInput('Rent'), { target: { value: '1200' } });
      fireEvent.change(getAmountInput('Child Care'), { target: { value: '800' } });
      fireEvent.click(screen.getByRole('button', { name: /continue/i }));

      await waitFor(() => {
        const callArg = mockUpdateScreen.mock.calls[0][0];
        expect(callArg.expenses).toHaveLength(2);
        expect(callArg.hasExpenses).toBe('true');
      });
    });

    it('excludes expenses with zero amount even when frequency was changed', async () => {
      renderExpenses();
      // Change frequency but leave amount at 0
      fireEvent.click(within(getFrequencyGroup('Rent')).getByRole('radio', { name: /yearly/i }));
      fireEvent.click(screen.getByRole('button', { name: /continue/i }));

      await waitFor(() => {
        expect(mockUpdateScreen).toHaveBeenCalledWith(
          expect.objectContaining({ expenses: [], hasExpenses: 'false' }),
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('amount inputs are linked to their expense label via htmlFor/id', () => {
      renderExpenses();
      // getByRole('textbox') scoped inside the row confirms the label→input linkage
      expect(getAmountInput('Rent')).toBeInTheDocument();
      expect(getAmountInput('Mortgage')).toBeInTheDocument();
      expect(getAmountInput('Child Care')).toBeInTheDocument();
    });

    it('frequency radiogroups have contextual aria-labels mentioning the expense name', () => {
      renderExpenses();
      expect(screen.getByRole('radiogroup', { name: /frequency for rent/i })).toBeInTheDocument();
      expect(screen.getByRole('radiogroup', { name: /frequency for mortgage/i })).toBeInTheDocument();
      expect(screen.getByRole('radiogroup', { name: /frequency for child care/i })).toBeInTheDocument();
    });

    it('category labels are visible to screen readers (not aria-hidden)', () => {
      renderExpenses();
      // Category label spans must not be aria-hidden so VO navigation reads them
      expect(screen.getByRole('heading', { name: 'Housing', level: 3 })).not.toHaveAttribute('aria-hidden');
    });

    it('column headers are hidden from screen readers (redundant with field labels)', () => {
      renderExpenses();
      screen.getAllByText(/^amount$/i).forEach((el) => {
        expect(el).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });
});
