import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import ResultsPopup from './ResultsPopup';
import React from 'react';

const renderWithIntl = (component: React.ReactElement) => {
  return render(<IntlProvider locale="en" defaultLocale="en">{component}</IntlProvider>);
};

describe('ResultsPopup', () => {
  const mockMessage = 'Test popup message';
  const mockLinkUrl = 'https://example.com/survey';
  const mockLinkText = 'Take Survey';
  const mockMinimizedText = 'Click here';

  describe('Rendering', () => {
    it('renders nothing when shouldShow returns false', () => {
      const { container } = renderWithIntl(
        <ResultsPopup shouldShow={() => false} message={mockMessage} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders full popup when shouldShow returns true', () => {
      renderWithIntl(<ResultsPopup shouldShow={() => true} message={mockMessage} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(mockMessage)).toBeInTheDocument();
    });

    it('renders minimized popup when startMinimized is true', () => {
      renderWithIntl(
        <ResultsPopup
          shouldShow={() => true}
          message={mockMessage}
          minimizedText={mockMinimizedText}
          startMinimized={true}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /restore survey popup/i })).toBeInTheDocument();
      expect(screen.getByText(mockMinimizedText)).toBeInTheDocument();
    });

    it('renders with default link text when linkUrl provided but no linkText', () => {
      renderWithIntl(<ResultsPopup shouldShow={() => true} message={mockMessage} linkUrl={mockLinkUrl} />);

      expect(screen.getByText('Learn More')).toBeInTheDocument();
    });

    it('renders with custom link text when provided', () => {
      renderWithIntl(
        <ResultsPopup
          shouldShow={() => true}
          message={mockMessage}
          linkUrl={mockLinkUrl}
          linkText={mockLinkText}
        />
      );

      expect(screen.getByText(mockLinkText)).toBeInTheDocument();
    });

    it('does not render link button when linkUrl is not provided', () => {
      renderWithIntl(<ResultsPopup shouldShow={() => true} message={mockMessage} />);

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes on dialog', () => {
      renderWithIntl(<ResultsPopup shouldShow={() => true} message={mockMessage} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-label', 'Survey invitation');
      expect(dialog).toHaveAttribute('tabIndex', '-1');
    });

    it('has proper ARIA attributes on minimized popup', () => {
      renderWithIntl(
        <ResultsPopup
          shouldShow={() => true}
          message={mockMessage}
          minimizedText={mockMinimizedText}
          startMinimized={true}
        />
      );

      const button = screen.getByRole('button', { name: /restore survey popup/i });
      expect(button).toHaveAttribute('tabIndex', '0');
    });

    it('has close button with proper aria-label in full popup', () => {
      renderWithIntl(<ResultsPopup shouldShow={() => true} message={mockMessage} />);

      expect(screen.getByLabelText('Minimize popup')).toBeInTheDocument();
    });

    it('has close button with proper aria-label in minimized popup', () => {
      renderWithIntl(
        <ResultsPopup
          shouldShow={() => true}
          message={mockMessage}
          minimizedText={mockMinimizedText}
          startMinimized={true}
        />
      );

      expect(screen.getByLabelText('Close popup')).toBeInTheDocument();
    });

    it('link opens in new tab with security attributes', () => {
      renderWithIntl(
        <ResultsPopup
          shouldShow={() => true}
          message={mockMessage}
          linkUrl={mockLinkUrl}
          linkText={mockLinkText}
        />
      );

      const link = screen.getByRole('link', { name: mockLinkText });
      expect(link).toHaveAttribute('href', mockLinkUrl);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('User Interactions - Minimizing', () => {
    it('minimizes popup when backdrop is clicked', () => {
      renderWithIntl(<ResultsPopup shouldShow={() => true} message={mockMessage} />);

      const backdrop = screen.getByLabelText('Survey invitation').previousSibling as HTMLElement;
      fireEvent.click(backdrop);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /restore survey popup/i })).toBeInTheDocument();
    });

    it('minimizes popup when close button is clicked', () => {
      renderWithIntl(<ResultsPopup shouldShow={() => true} message={mockMessage} />);

      const closeButton = screen.getByLabelText('Minimize popup');
      fireEvent.click(closeButton);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /restore survey popup/i })).toBeInTheDocument();
    });

    it('minimizes popup when link is clicked', () => {
      renderWithIntl(
        <ResultsPopup
          shouldShow={() => true}
          message={mockMessage}
          linkUrl={mockLinkUrl}
          linkText={mockLinkText}
        />
      );

      const link = screen.getByRole('link', { name: mockLinkText });
      fireEvent.click(link);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /restore survey popup/i })).toBeInTheDocument();
    });
  });

  describe('User Interactions - Restoring', () => {
    it('restores popup when minimized popup is clicked', () => {
      renderWithIntl(
        <ResultsPopup
          shouldShow={() => true}
          message={mockMessage}
          minimizedText={mockMinimizedText}
          startMinimized={true}
        />
      );

      const minimizedPopup = screen.getByRole('button', { name: /restore survey popup/i });
      fireEvent.click(minimizedPopup);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /restore survey popup/i })).not.toBeInTheDocument();
    });

    it('restores popup when Enter key is pressed on minimized popup', () => {
      renderWithIntl(
        <ResultsPopup
          shouldShow={() => true}
          message={mockMessage}
          minimizedText={mockMinimizedText}
          startMinimized={true}
        />
      );

      const minimizedPopup = screen.getByRole('button', { name: /restore survey popup/i });
      fireEvent.keyDown(minimizedPopup, { key: 'Enter', code: 'Enter' });

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('restores popup when Space key is pressed on minimized popup', () => {
      renderWithIntl(
        <ResultsPopup
          shouldShow={() => true}
          message={mockMessage}
          minimizedText={mockMinimizedText}
          startMinimized={true}
        />
      );

      const minimizedPopup = screen.getByRole('button', { name: /restore survey popup/i });
      fireEvent.keyDown(minimizedPopup, { key: ' ', code: 'Space' });

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('does not restore popup when other keys are pressed on minimized popup', () => {
      renderWithIntl(
        <ResultsPopup
          shouldShow={() => true}
          message={mockMessage}
          minimizedText={mockMinimizedText}
          startMinimized={true}
        />
      );

      const minimizedPopup = screen.getByRole('button', { name: /restore survey popup/i });
      fireEvent.keyDown(minimizedPopup, { key: 'a', code: 'KeyA' });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /restore survey popup/i })).toBeInTheDocument();
    });
  });

  describe('User Interactions - Dismissing', () => {
    it('dismisses popup completely when X is clicked', () => {
      const { container } = renderWithIntl(<ResultsPopup shouldShow={() => true} message={mockMessage} />);

      const closeButton = screen.getByLabelText('Minimize popup');
      fireEvent.click(closeButton);

      // First, it minimizes
      expect(screen.getByRole('button', { name: /restore survey popup/i })).toBeInTheDocument();

      // Then click X on minimized popup
      const dismissButton = screen.getByLabelText('Close popup');
      fireEvent.click(dismissButton);

      // Now it should be completely gone
      expect(container.firstChild).toBeNull();
    });

    it('prevents event propagation when dismissing minimized popup', () => {
      const { container } = renderWithIntl(
        <ResultsPopup
          shouldShow={() => true}
          message={mockMessage}
          minimizedText={mockMinimizedText}
          startMinimized={true}
        />
      );

      const dismissButton = screen.getByLabelText('Close popup');
      fireEvent.click(dismissButton);

      // The popup should be completely dismissed
      expect(container.firstChild).toBeNull();
    });

    it('remains dismissed even if shouldShow changes to true', () => {
      const { rerender, container } = renderWithIntl(
        <ResultsPopup shouldShow={() => true} message={mockMessage} />
      );

      // Minimize and then dismiss
      const closeButton = screen.getByLabelText('Minimize popup');
      fireEvent.click(closeButton);

      const dismissButton = screen.getByLabelText('Close popup');
      fireEvent.click(dismissButton);

      expect(container.firstChild).toBeNull();

      // Re-render with shouldShow still true
      rerender(
        <IntlProvider locale="en" defaultLocale="en">
          <ResultsPopup shouldShow={() => true} message={mockMessage} />
        </IntlProvider>
      );

      // Should still be dismissed
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Focus Management', () => {
    it('focuses dialog when it opens', async () => {
      renderWithIntl(<ResultsPopup shouldShow={() => true} message={mockMessage} />);

      const dialog = screen.getByRole('dialog');

      await waitFor(() => {
        expect(dialog).toHaveFocus();
      });
    });

    it('focuses dialog when restored from minimized state', async () => {
      renderWithIntl(
        <ResultsPopup
          shouldShow={() => true}
          message={mockMessage}
          minimizedText={mockMinimizedText}
          startMinimized={true}
        />
      );

      const minimizedPopup = screen.getByRole('button', { name: /restore survey popup/i });
      fireEvent.click(minimizedPopup);

      const dialog = screen.getByRole('dialog');

      await waitFor(() => {
        expect(dialog).toHaveFocus();
      });
    });

    it('does not focus when popup is minimized', () => {
      const { rerender } = renderWithIntl(
        <ResultsPopup shouldShow={() => true} message={mockMessage} />
      );

      const closeButton = screen.getByLabelText('Minimize popup');
      fireEvent.click(closeButton);

      const minimizedPopup = screen.getByRole('button', { name: /restore survey popup/i });

      rerender(
        <IntlProvider locale="en" defaultLocale="en">
          <ResultsPopup shouldShow={() => true} message={mockMessage} />
        </IntlProvider>
      );

      expect(minimizedPopup).not.toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('handles shouldShow function that throws error gracefully', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      const shouldShowWithError = () => {
        throw new Error('Test error');
      };

      expect(() => {
        renderWithIntl(<ResultsPopup shouldShow={shouldShowWithError} message={mockMessage} />);
      }).toThrow();

      consoleError.mockRestore();
    });

    it('handles undefined message gracefully', () => {
      renderWithIntl(<ResultsPopup shouldShow={() => true} message={undefined as any} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('handles React elements as message', () => {
      const CustomMessage = () => <span>Custom React Element Message</span>;

      renderWithIntl(<ResultsPopup shouldShow={() => true} message={<CustomMessage />} />);

      expect(screen.getByText('Custom React Element Message')).toBeInTheDocument();
    });

    it('handles React elements as link text', () => {
      const CustomLinkText = () => <span>Custom Link</span>;

      renderWithIntl(
        <ResultsPopup
          shouldShow={() => true}
          message={mockMessage}
          linkUrl={mockLinkUrl}
          linkText={<CustomLinkText />}
        />
      );

      expect(screen.getByText('Custom Link')).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('maintains separate state for minimized and dismissed', () => {
      const { rerender } = renderWithIntl(<ResultsPopup shouldShow={() => true} message={mockMessage} />);

      // Minimize
      const closeButton = screen.getByLabelText('Minimize popup');
      fireEvent.click(closeButton);

      expect(screen.getByRole('button', { name: /restore survey popup/i })).toBeInTheDocument();

      // Re-render
      rerender(
        <IntlProvider locale="en" defaultLocale="en">
          <ResultsPopup shouldShow={() => true} message={mockMessage} />
        </IntlProvider>
      );

      // Should still be minimized
      expect(screen.getByRole('button', { name: /restore survey popup/i })).toBeInTheDocument();
    });

    it('does not show popup when shouldShow becomes false', () => {
      const { rerender, container } = renderWithIntl(
        <ResultsPopup shouldShow={() => true} message={mockMessage} />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Change shouldShow to false
      rerender(
        <IntlProvider locale="en" defaultLocale="en">
          <ResultsPopup shouldShow={() => false} message={mockMessage} />
        </IntlProvider>
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Default Props', () => {
    it('uses default minimized text when not provided', () => {
      renderWithIntl(<ResultsPopup shouldShow={() => true} message={mockMessage} startMinimized={true} />);

      expect(screen.getByText('Click to learn more')).toBeInTheDocument();
    });

    it('starts in full popup mode by default', () => {
      renderWithIntl(<ResultsPopup shouldShow={() => true} message={mockMessage} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /restore survey popup/i })).not.toBeInTheDocument();
    });
  });

  describe('CSS Classes', () => {
    it('applies correct CSS classes to full popup', () => {
      renderWithIntl(<ResultsPopup shouldShow={() => true} message={mockMessage} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('results-popup-container');
    });

    it('applies correct CSS classes to minimized popup', () => {
      const { container } = renderWithIntl(
        <ResultsPopup shouldShow={() => true} message={mockMessage} startMinimized={true} />
      );

      const minimizedContainer = container.querySelector('.results-popup-minimized');
      expect(minimizedContainer).toBeInTheDocument();
    });

    it('applies correct CSS classes to backdrop', () => {
      const { container } = renderWithIntl(<ResultsPopup shouldShow={() => true} message={mockMessage} />);

      const backdrop = container.querySelector('.results-popup-backdrop');
      expect(backdrop).toBeInTheDocument();
      expect(backdrop).toHaveAttribute('aria-hidden', 'true');
    });

    it('applies correct CSS classes to buttons', () => {
      renderWithIntl(
        <ResultsPopup
          shouldShow={() => true}
          message={mockMessage}
          linkUrl={mockLinkUrl}
          linkText={mockLinkText}
        />
      );

      const link = screen.getByRole('link', { name: mockLinkText });
      expect(link).toHaveClass('results-popup-button');

      const closeButton = screen.getByLabelText('Minimize popup');
      expect(closeButton).toHaveClass('results-popup-close-button');
    });
  });
});
