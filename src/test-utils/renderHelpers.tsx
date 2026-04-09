import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Context } from '../Components/Wrapper/Wrapper';
import { WrapperContext } from '../Types/WrapperContext';

export const createMockContextValue = (overrides: Partial<WrapperContext> = {}): WrapperContext => ({
  locale: 'en-us',
  selectLanguage: jest.fn(),
  formData: {
    immutableReferrer: undefined,
    referralSource: '',
    isTest: false,
    externalID: undefined,
    path: 'default',
    urlSearchParams: '',
    householdData: [],
  } as any,
  config: undefined,
  configLoading: false,
  setFormData: jest.fn(),
  theme: {} as any,
  setTheme: jest.fn(),
  styleOverride: {},
  stepLoading: false,
  setStepLoading: jest.fn(),
  pageIsLoading: false,
  setScreenLoading: jest.fn(),
  getReferrer: jest.fn(),
  staffToken: undefined,
  setStaffToken: jest.fn(),
  whiteLabel: '_default',
  setWhiteLabel: jest.fn(),
  ...overrides,
});

interface RenderWithRouterOptions {
  initialRoute?: string;
  contextValue?: WrapperContext;
}

export function renderWithRouter(
  ui: React.ReactElement,
  { initialRoute = '/', contextValue }: RenderWithRouterOptions = {}
) {
  const mockContext = contextValue || createMockContextValue();

  return render(
    <Context.Provider value={mockContext}>
      <MemoryRouter initialEntries={[initialRoute]}>{ui}</MemoryRouter>
    </Context.Provider>
  );
}
