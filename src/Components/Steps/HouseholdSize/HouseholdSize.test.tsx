import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Context } from '../../Wrapper/Wrapper';
import HouseholdSize from './HouseholdSize';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockNavigate = jest.fn();
const mockUpdateScreen = jest.fn().mockResolvedValue(undefined);

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ uuid: 'test-uuid', whiteLabel: 'co' }),
}));

jest.mock('../../../Assets/updateScreen', () => ({
  __esModule: true,
  default: () => ({ updateScreen: mockUpdateScreen }),
}));

// householdData step is step 5 in tests
jest.mock('../../../Assets/stepDirectory', () => ({
  useStepNumber: (_name: string, _required?: boolean) => 5,
}));

jest.mock('../../QuestionComponents/questionHooks', () => ({
  useDefaultBackNavigationFunction: () => jest.fn(),
}));

jest.mock('../stepForm', () => {
  const { useForm } = jest.requireActual('react-hook-form');
  return {
    __esModule: true,
    default: (opts: any) => useForm(opts),
  };
});

jest.mock('../../../Assets/languageOptions', () => ({
  OverrideableTranslation: ({ defaultMessage }: { defaultMessage: string }) => <span>{defaultMessage}</span>,
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeFormData = (householdSize = 1) => ({
  householdSize,
  householdData: [],
});

const renderHouseholdSize = (householdSize = 1) => {
  const contextValue = {
    formData: makeFormData(householdSize),
    setFormData: jest.fn(),
    setStepLoading: jest.fn(),
  } as any;

  return render(
    <IntlProvider locale="en" messages={{}}>
      <Context.Provider value={contextValue}>
        <MemoryRouter initialEntries={['/co/test-uuid/step-4']}>
          <Routes>
            <Route path="/:whiteLabel/:uuid/step-:id" element={<HouseholdSize />} />
          </Routes>
        </MemoryRouter>
      </Context.Provider>
    </IntlProvider>
  );
};

const submitWithSize = async (size: number) => {
  const input = screen.getByRole('textbox');
  fireEvent.change(input, { target: { value: String(size) } });
  fireEvent.blur(input);
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));
  await waitFor(() => expect(mockUpdateScreen).toHaveBeenCalled());
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('HouseholdSize', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('routing after submit', () => {
    it('navigates to step-5/1 (skips basic info page) when household size is 1', async () => {
      renderHouseholdSize(1);
      await submitWithSize(1);
      expect(mockNavigate).toHaveBeenCalledWith('/co/test-uuid/step-5/1');
    });

    it('navigates to step-5/0 (basic info page) when household size is 2', async () => {
      renderHouseholdSize(1);
      await submitWithSize(2);
      expect(mockNavigate).toHaveBeenCalledWith('/co/test-uuid/step-5/0');
    });

    it('navigates to step-5/0 when household size is 3', async () => {
      renderHouseholdSize(1);
      await submitWithSize(3);
      expect(mockNavigate).toHaveBeenCalledWith('/co/test-uuid/step-5/0');
    });

    it('navigates to step-5/0 when household size is 8 (max)', async () => {
      renderHouseholdSize(1);
      await submitWithSize(8);
      expect(mockNavigate).toHaveBeenCalledWith('/co/test-uuid/step-5/0');
    });

    it('calls updateScreen before navigating', async () => {
      renderHouseholdSize(1);
      await submitWithSize(2);
      const navigateCallOrder = mockNavigate.mock.invocationCallOrder[0];
      const updateScreenCallOrder = mockUpdateScreen.mock.invocationCallOrder[0];
      expect(updateScreenCallOrder).toBeLessThan(navigateCallOrder);
    });
  });
});
