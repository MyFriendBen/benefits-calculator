import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import HelpButton from './HelpButton';

// Covers the toggle (what the refactor changed). Close-on-outside-click isn't
// tested here — JSDOM doesn't reliably simulate MUI's document listener; that's a
// Playwright check. HelpButton falls back safely without Wrapper Context.
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
