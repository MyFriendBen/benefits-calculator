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
});
