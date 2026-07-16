import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import HelpButton from './HelpButton';

// HelpButton reads getReferrer from Wrapper Context; it falls back safely when
// the Context is absent (guarded with optional chaining), so no provider is
// needed here.
//
// NOTE: close-on-outside-click (MUI ClickAwayListener) is intentionally NOT
// tested here — JSDOM does not reliably simulate MUI's document-level click
// listener. That path is covered by Playwright on the income-frequency and
// household-assets tooltips. This suite covers the toggle behavior, which is
// what the tooltip-unification refactor changed.
const renderHelpButton = () =>
  render(
    <IntlProvider locale="en" messages={{}}>
      <HelpButton helpTopic="test-topic">Helpful explanation text</HelpButton>
    </IntlProvider>,
  );

describe('HelpButton', () => {
  it('hides the help text until the icon is clicked', () => {
    renderHelpButton();
    expect(screen.queryByText('Helpful explanation text')).not.toBeInTheDocument();
  });

  it('shows the help text on the first click and hides it on the second (toggle)', () => {
    renderHelpButton();
    const button = screen.getByRole('button', { name: /help button/i });

    fireEvent.click(button);
    expect(screen.getByText('Helpful explanation text')).toBeInTheDocument();

    fireEvent.click(button);
    expect(screen.queryByText('Helpful explanation text')).not.toBeInTheDocument();
  });
});
