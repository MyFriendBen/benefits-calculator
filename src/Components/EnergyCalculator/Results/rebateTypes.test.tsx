import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { FormData } from '../../../Types/FormData';
import { EFFICIENCY_WORKS_PROVIDERS, XCEL_PROVIDER } from '../providers';
import { renderCategoryDescription } from './rebateTypes';

const formDataFor = (electricProvider?: string) => ({ energyCalculator: { electricProvider } } as FormData);

const renderHvacDescription = (electricProvider?: string) =>
  render(
    <IntlProvider locale="en" messages={{}}>
      {renderCategoryDescription('hvac', formDataFor(electricProvider))}
    </IntlProvider>,
  );

describe('renderCategoryDescription hvac provider copy', () => {
  const sharedCopy = [/heat pumps offer both heating in the winter/i, /you may qualify for savings on the cost/i];

  it.each([
    ['Xcel', XCEL_PROVIDER],
    ['Efficiency Works', EFFICIENCY_WORKS_PROVIDERS[0]],
  ])('renders only the shared heat pump copy for %s customers', (_name, provider) => {
    renderHvacDescription(provider);

    for (const copy of sharedCopy) {
      expect(screen.getByText(copy)).toBeInTheDocument();
    }
    // Neither provider gets a contractor link.
    expect(screen.queryByText(/consult with an/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it.each([
    ['unknown providers', 'co-some-other-utility'],
    ['a missing provider', undefined],
  ])('renders the generic contractor search link for %s', (_name, provider) => {
    renderHvacDescription(provider);

    for (const copy of sharedCopy) {
      expect(screen.getByText(copy)).toBeInTheDocument();
    }
    expect(screen.getByRole('link', { name: /contractor search here/i })).toHaveAttribute(
      'href',
      'https://homes.rewiringamerica.org/contractor-networks',
    );
  });
});
