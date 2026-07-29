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
    homelessServices: { text: 'Shelter Resources', icon: null },
    freeLowCostMedicalCare: { text: 'Health Care Resources', icon: null },
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

  it('links "Help finding shelter" to NC211 Basic Needs > Housing/Shelter', () => {
    const formData = createFormData();
    formData.acuteHHConditions = { homelessServices: true };
    renderWithProviders(formData);

    const link = screen.getByText(/Shelter Resources/i).closest('a');
    expect(link).toHaveAttribute('href', expect.stringContaining('topic=Basic%20Needs'));
    expect(link).toHaveAttribute('href', expect.stringContaining('subtopic=Housing%2FShelter'));
  });

  it('links "Help finding health care" to NC211 Health Care > Health Screening/Diagnostic Services and Specialized Treatment and Prevention', () => {
    const formData = createFormData();
    formData.acuteHHConditions = { freeLowCostMedicalCare: true };
    renderWithProviders(formData);

    const link = screen.getByText(/Health Care Resources/i).closest('a');
    expect(link).toHaveAttribute('href', expect.stringContaining('topic=Health%20Care'));
    expect(link).toHaveAttribute(
      'href',
      expect.stringContaining(
        'subtopic=Health%20Screening%2FDiagnostic%20Services%2CSpecialized%20Treatment%20and%20Prevention',
      ),
    );
  });
});