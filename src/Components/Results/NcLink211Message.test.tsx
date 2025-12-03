import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { Context } from '../Wrapper/Wrapper';
import { FormData } from '../../Types/FormData';
import { createFormData } from './testHelpers';
import NcLink211Message from './NcLink211Message';

const renderWithProviders = (formData: FormData) => {
  return render(
    <IntlProvider locale="en" defaultLocale="en">
      <Context.Provider value={{ formData } as any}>
        <NcLink211Message />
      </Context.Provider>
    </IntlProvider>
  );
};

jest.mock('../Config/configHook', () => ({
  useConfig: () => ({
    food: { text: 'Food Resources', icon: null },
    housing: { text: 'Housing Resources', icon: null },
  }),
}));

describe('NcLink211Message', () => {
  it('renders basic NC211 message', () => {
    const formData = createFormData();
    renderWithProviders(formData);

    expect(screen.getByText(/For more local resources please visit/i)).toBeInTheDocument();
    expect(screen.getByText(/NC 211's website/i)).toBeInTheDocument();
  });

  it('renders links for household needs when present', () => {
    const formData = createFormData();
    formData.acuteHHConditions = { food: true, housing: true };
    renderWithProviders(formData);

    expect(screen.getByText(/More local resources from NC211/i)).toBeInTheDocument();
    expect(screen.getByText(/Food Resources/i)).toBeInTheDocument();
    expect(screen.getByText(/Housing Resources/i)).toBeInTheDocument();
  });
});