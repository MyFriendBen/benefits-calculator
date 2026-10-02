import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { Context } from '../Wrapper/Wrapper';
import { FormData } from '../../Types/FormData';
import { createFormData } from './testHelpers';
import Chicago211LinkMessage from './Chicago211LinkMessage';

const renderWithProviders = (formData: FormData) => {
  return render(
    <IntlProvider locale="en" defaultLocale="en">
      <Context.Provider value={{ formData } as any}>
        <Chicago211LinkMessage />
      </Context.Provider>
    </IntlProvider>,
  );
};

jest.mock('../Config/configHook', () => ({
  useConfig: () => ({
    food: { text: 'Food Resources', icon: null },
    housing: { text: 'Housing Resources', icon: null },
    agingResources: { text: 'Aging Resources', icon: null },
  }),
}));

describe('Chicago211LinkMessage', () => {
  it('falls back to the 211 Metro Chicago homepage when no needs are selected', () => {
    renderWithProviders(createFormData());

    expect(screen.getByText(/For more local resources please visit/i)).toBeInTheDocument();
    const link = screen.getByText(/211 Metro Chicago's website/i).closest('a');
    expect(link).toHaveAttribute('href', 'https://211metrochicago.org/');
  });

  it('deep links housing to the HOU category', () => {
    const formData = createFormData();
    formData.acuteHHConditions = { housing: true };
    renderWithProviders(formData);

    expect(screen.getByText(/More local resources from 211 Metro Chicago/i)).toBeInTheDocument();
    const link = screen.getByText(/Housing Resources/i).closest('a');
    expect(link).toHaveAttribute('href', 'https://211metrochicago.org/search-for-resources/?external_category=HOU');
  });

  // Housing is the only confirmed external_category code, so every other need
  // must stay unmapped until 211 Metro Chicago supplies their full list. A
  // household selecting only unmapped needs sees the fallback, never a guess.
  it('renders the fallback when the selected needs are all unmapped', () => {
    const formData = createFormData();
    formData.acuteHHConditions = { food: true, agingResources: true };
    renderWithProviders(formData);

    expect(screen.getByText(/For more local resources please visit/i)).toBeInTheDocument();
    expect(screen.queryByText(/Food Resources/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Aging Resources/i)).not.toBeInTheDocument();
  });

  it('shows only the mapped need when mapped and unmapped needs are mixed', () => {
    const formData = createFormData();
    formData.acuteHHConditions = { food: true, housing: true };
    renderWithProviders(formData);

    expect(screen.getByText(/Housing Resources/i)).toBeInTheDocument();
    expect(screen.queryByText(/Food Resources/i)).not.toBeInTheDocument();
  });
});
