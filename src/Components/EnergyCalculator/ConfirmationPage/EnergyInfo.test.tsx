import { render, screen, within } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import EnergyCalculatorEnergyInfo from './EnergyInfo';
import { Context } from '../../Wrapper/Wrapper';
import { createMockContextValue } from '../../../test-utils/renderHelpers';
import { QuestionName } from '../../../Types/Questions';

// Mirrors the two CESN step directories: the renter path skips the appliance
// question and asks about utility bills first.
const DEFAULT_PATH_STEPS: QuestionName[] = [
  'zipcode',
  'energyCalculatorElectricityProvider',
  'energyCalculatorGasProvider',
  'energyCalculatorUtilityStatus',
  'energyCalculatorApplianceStatus',
];

const RENTER_PATH_STEPS: QuestionName[] = [
  'energyCalculatorExpenses',
  'zipcode',
  'energyCalculatorElectricityProvider',
  'energyCalculatorGasProvider',
  'energyCalculatorUtilityStatus',
];

function renderWithSteps(steps: QuestionName[], energyCalculatorOverrides: Record<string, unknown> = {}) {
  const contextValue = createMockContextValue({
    formData: {
      path: 'default',
      expenses: [],
      energyCalculator: {
        electricProviderName: 'Xcel Energy',
        gasProviderName: 'Xcel Energy',
        hasPastDueEnergyBills: true,
        needsHvac: true,
        ...energyCalculatorOverrides,
      },
    } as any,
    getReferrer: ((key: string) => (key === 'stepDirectory' ? steps : undefined)) as any,
  });

  return render(
    <IntlProvider locale="en" messages={{}}>
      <Context.Provider value={contextValue}>
        <MemoryRouter initialEntries={['/cesn/abc/confirm-information']}>
          <EnergyCalculatorEnergyInfo />
        </MemoryRouter>
      </Context.Provider>
    </IntlProvider>,
  );
}

function renderedRowLabels() {
  const rows = document.querySelectorAll('.confirmation-row-label');
  return Array.from(rows).map((row) => row.textContent?.trim());
}

describe('EnergyCalculatorEnergyInfo', () => {
  it('renders a row for each energy question the white label asks', () => {
    renderWithSteps(DEFAULT_PATH_STEPS);

    expect(renderedRowLabels()).toEqual([
      'Electric Utility Provider',
      'Gas Utility Provider',
      'Disconnection Notice or Past Due Bill',
      'Broken appliances or ones in need of replacement',
    ]);
  });

  it('omits rows for questions the white label does not ask', () => {
    renderWithSteps(RENTER_PATH_STEPS);

    expect(renderedRowLabels()).not.toContain('Broken appliances or ones in need of replacement');
  });

  it('orders rows by the step directory rather than a fixed sequence', () => {
    renderWithSteps(RENTER_PATH_STEPS);

    // energyCalculatorExpenses leads the renter directory, so its row comes first.
    expect(renderedRowLabels()).toEqual([
      'Utility Bills',
      'Electric Utility Provider',
      'Gas Utility Provider',
      'Disconnection Notice or Past Due Bill',
    ]);
  });

  it('follows a reordered directory so rows stay consistent with the questions asked', () => {
    renderWithSteps([
      'energyCalculatorUtilityStatus',
      'energyCalculatorElectricityProvider',
      'energyCalculatorGasProvider',
    ]);

    expect(renderedRowLabels()).toEqual([
      'Disconnection Notice or Past Due Bill',
      'Electric Utility Provider',
      'Gas Utility Provider',
    ]);
  });

  it('gives each rendered row its own edit link pointing at that question', () => {
    renderWithSteps(RENTER_PATH_STEPS);

    expect(screen.getByLabelText('edit electricity provider')).toBeInTheDocument();
    expect(screen.getByLabelText('edit expenses')).toBeInTheDocument();
    expect(screen.queryByLabelText('edit appliance status')).not.toBeInTheDocument();
  });

  it('shows the not-applicable copy when a question has no selections', () => {
    renderWithSteps(['energyCalculatorApplianceStatus', 'energyCalculatorUtilityStatus'], { needsHvac: false });

    const applianceRow = screen
      .getByText('Broken appliances or ones in need of replacement')
      .closest('.confirmation-row');
    expect(within(applianceRow as HTMLElement).getByText('Not applicable')).toBeInTheDocument();
  });
});
