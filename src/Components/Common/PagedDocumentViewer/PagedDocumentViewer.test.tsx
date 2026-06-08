import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import PagedDocumentViewer from './PagedDocumentViewer';

const PAGE_IMAGES = ['/docs/page-1.png', '/docs/page-2.png'];
const PDF_URL = '/docs/guide.pdf';

function renderViewer() {
  return render(
    <IntlProvider locale="en" messages={{}}>
      <PagedDocumentViewer pageImages={PAGE_IMAGES} pdfUrl={PDF_URL} title="Test guide" />
    </IntlProvider>,
  );
}

describe('PagedDocumentViewer', () => {
  it('shows the first page and the page count', () => {
    renderViewer();
    expect(screen.getByText('1/2')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', PAGE_IMAGES[0]);
  });

  it('disables Previous on the first page and advances with Next', () => {
    renderViewer();
    expect(screen.getByRole('button', { name: /previous page/i })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /next page/i }));
    expect(screen.getByText('2/2')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', PAGE_IMAGES[1]);
  });

  it('disables Next on the last page', () => {
    renderViewer();
    fireEvent.click(screen.getByRole('button', { name: /next page/i }));
    expect(screen.getByRole('button', { name: /next page/i })).toBeDisabled();
  });

  it('pages with the arrow keys on the focusable page area', () => {
    renderViewer();
    const pageArea = screen.getByRole('group');

    fireEvent.keyDown(pageArea, { key: 'ArrowRight' });
    expect(screen.getByText('2/2')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', PAGE_IMAGES[1]);

    fireEvent.keyDown(pageArea, { key: 'ArrowLeft' });
    expect(screen.getByText('1/2')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', PAGE_IMAGES[0]);
  });

  it('does not page past the bounds with arrow keys', () => {
    renderViewer();
    const pageArea = screen.getByRole('group');

    // Already on the first page — ArrowLeft is a no-op.
    fireEvent.keyDown(pageArea, { key: 'ArrowLeft' });
    expect(screen.getByText('1/2')).toBeInTheDocument();

    // On the last page — ArrowRight is a no-op.
    fireEvent.keyDown(pageArea, { key: 'ArrowRight' });
    fireEvent.keyDown(pageArea, { key: 'ArrowRight' });
    expect(screen.getByText('2/2')).toBeInTheDocument();
  });

  it('opens the underlying PDF when Print is clicked', () => {
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
    renderViewer();
    fireEvent.click(screen.getByRole('button', { name: /print/i }));
    expect(openSpy).toHaveBeenCalledWith(PDF_URL, '_blank', 'noopener,noreferrer');
    openSpy.mockRestore();
  });

  it('requests fullscreen when Full screen is clicked and toggles the label', () => {
    const requestFullscreen = jest.fn();
    // jsdom does not implement the Fullscreen API; stub the bits we use.
    (HTMLElement.prototype as unknown as { requestFullscreen: () => void }).requestFullscreen = requestFullscreen;

    renderViewer();
    const root = document.querySelector('.paged-document-viewer') as HTMLElement;

    const fullScreenBtn = screen.getByRole('button', { name: /^full screen$/i });
    fireEvent.click(fullScreenBtn);
    expect(requestFullscreen).toHaveBeenCalled();

    // Simulate the browser entering fullscreen on our element.
    Object.defineProperty(document, 'fullscreenElement', { value: root, configurable: true });
    fireEvent(document, new Event('fullscreenchange'));

    expect(screen.getByRole('button', { name: /exit full screen/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^full screen$/i })).not.toBeInTheDocument();
  });

  it('focuses the page area and pages on arrow keys after entering fullscreen', () => {
    (HTMLElement.prototype as unknown as { requestFullscreen: () => void }).requestFullscreen = jest.fn();

    renderViewer();
    const root = document.querySelector('.paged-document-viewer') as HTMLElement;
    const pageArea = screen.getByRole('group');

    fireEvent.click(screen.getByRole('button', { name: /^full screen$/i }));

    // Simulate the browser entering fullscreen on our element.
    Object.defineProperty(document, 'fullscreenElement', { value: root, configurable: true });
    fireEvent(document, new Event('fullscreenchange'));

    // Focus moves to the page area so the user does not have to click first.
    expect(pageArea).toHaveFocus();

    // Arrow keys page even when the keydown is dispatched at the document level
    // (e.g. the toggle button still holds focus in a real browser).
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(screen.getByText('2/2')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(screen.getByText('1/2')).toBeInTheDocument();
  });

  it('does not hijack arrow keys at the document level when not fullscreen', () => {
    renderViewer();
    // No fullscreen entered — a stray document-level arrow should not page.
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(screen.getByText('1/2')).toBeInTheDocument();
  });

  it('renders nothing when there are no page images', () => {
    const { container } = render(
      <IntlProvider locale="en" messages={{}}>
        <PagedDocumentViewer pageImages={[]} pdfUrl={PDF_URL} title="Empty guide" />
      </IntlProvider>,
    );
    // Guard prevents a "1/0" pager and an <img> with an undefined src.
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
