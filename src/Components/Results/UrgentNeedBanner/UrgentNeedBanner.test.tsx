import { render } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import UrgentNeedBanner from './UrgentNeedBanner';

// Mock the Results context and defaultMessage
jest.mock('../Results', () => ({
  useResultsContext: () => ({ needs: [] }),
  useResultsLink: () => '/results/near-term-needs',
}));

// Mock ResultsTranslate component
jest.mock('../Translate/Translate', () => {
  return ({ translation }: { translation: any }) => <span>{translation?.default_message || 'Default message'}</span>;
});

describe('UrgentNeedBanner', () => {
  it('renders without crashing', () => {
    render(
      <IntlProvider locale="en" messages={{}}>
        <UrgentNeedBanner />
      </IntlProvider>
    );
  });

  it('returns null when no needs are provided', () => {
    const { container } = render(
      <IntlProvider locale="en" messages={{}}>
        <UrgentNeedBanner />
      </IntlProvider>
    );
    expect(container.firstChild).toBeNull();
  });
});