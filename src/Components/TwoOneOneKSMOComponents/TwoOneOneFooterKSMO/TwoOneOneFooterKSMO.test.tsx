import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { TwoOneOneFooterKS, TwoOneOneFooterMO } from './TwoOneOneFooterKSMO';

jest.mock('../../Config/configHook', () => ({
  useLocalizedLink: () => 'https://example.com/privacy',
}));

const renderFooter = (Footer: () => JSX.Element) =>
  render(
    <IntlProvider locale="en" defaultLocale="en">
      <Footer />
    </IntlProvider>,
  );

describe('TwoOneOneFooterKSMO', () => {
  it.each([
    ['Kansas', TwoOneOneFooterKS, 'United Way of the Plains'],
    ['Missouri', TwoOneOneFooterMO, 'United Way of Greater St. Louis'],
  ])('renders the 2-1-1 %s about and disclaimer text', (state, Footer, unitedWay) => {
    renderFooter(Footer);

    expect(screen.getByText(new RegExp(`^2-1-1 ${state} is a collaboration between ${unitedWay}`))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`However, 2-1-1 ${state} assumes no responsibility`))).toBeInTheDocument();
  });

  it('offers Dial 2-1-1 as the only way to get help', () => {
    renderFooter(TwoOneOneFooterKS);

    expect(screen.getByText(/Try these other ways to get help/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '211 dial link' })).toHaveAttribute('href', 'tel:211');
    expect(screen.queryByRole('link', { name: /chat/i })).not.toBeInTheDocument();
  });

  it('links the MyFriendBen privacy policy', () => {
    renderFooter(TwoOneOneFooterMO);

    expect(screen.getByRole('link', { name: 'MyFriendBen Privacy Policy' })).toHaveAttribute(
      'href',
      'https://example.com/privacy',
    );
  });
});
