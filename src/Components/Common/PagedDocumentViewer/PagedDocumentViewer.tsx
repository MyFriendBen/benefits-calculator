import { useCallback, useEffect, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PrintIcon from '@mui/icons-material/Print';
import './PagedDocumentViewer.css';

export type PagedDocumentViewerProps = {
  /** Ordered list of page image URLs (one per page). */
  pageImages: readonly string[];
  /**
   * URL of the underlying PDF — used by the Print/Download action so users get a
   * real PDF, not the display images.
   */
  pdfUrl: string;
  /** Accessible name for the document (e.g. its title). Used for page alt text. */
  title: string;
  className?: string;
};

/**
 * Branded, paginated document viewer. Renders pre-rendered page images with a
 * custom toolbar (full screen / page pager / print) to match design specs that
 * the browser's native PDF viewer can't reproduce. Print/Download opens the
 * underlying PDF so the downloaded artifact is a real PDF.
 */
export default function PagedDocumentViewer({ pageImages, pdfUrl, title, className }: PagedDocumentViewerProps) {
  const intl = useIntl();
  const [pageIndex, setPageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const pageCount = pageImages.length;
  const isFirst = pageIndex === 0;
  const isLast = pageIndex === pageCount - 1;

  const goPrev = useCallback(() => setPageIndex((i) => Math.max(0, i - 1)), []);
  const goNext = useCallback(() => setPageIndex((i) => Math.min(pageCount - 1, i + 1)), [pageCount]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement === rootRef.current) {
      document.exitFullscreen?.();
    } else {
      rootRef.current?.requestFullscreen?.();
    }
  }, []);

  const printDocument = useCallback(() => {
    // Open the real PDF so the user prints/saves a PDF rather than the images.
    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  }, [pdfUrl]);

  const rootClass = ['paged-document-viewer', className].filter(Boolean).join(' ');

  return (
    <div ref={rootRef} className={rootClass}>
      <div className="paged-document-viewer-toolbar">
        <button
          type="button"
          className="paged-document-viewer-toolbar-btn"
          onClick={toggleFullscreen}
          aria-pressed={isFullscreen}
        >
          {isFullscreen ? (
            <>
              <FullscreenExitIcon className="paged-document-viewer-toolbar-icon" aria-hidden="true" />
              <FormattedMessage id="pagedDocumentViewer.exitFullScreen" defaultMessage="Exit full screen" />
            </>
          ) : (
            <>
              <FullscreenIcon className="paged-document-viewer-toolbar-icon" aria-hidden="true" />
              <FormattedMessage id="pagedDocumentViewer.fullScreen" defaultMessage="Full screen" />
            </>
          )}
        </button>

        <div className="paged-document-viewer-pager">
          <button
            type="button"
            className="paged-document-viewer-pager-btn"
            onClick={goPrev}
            disabled={isFirst}
            aria-label={intl.formatMessage({ id: 'pagedDocumentViewer.prevPage', defaultMessage: 'Previous page' })}
          >
            <ChevronLeftIcon aria-hidden="true" />
          </button>
          <span className="paged-document-viewer-pager-label" aria-live="polite">
            {pageIndex + 1}/{pageCount}
          </span>
          <button
            type="button"
            className="paged-document-viewer-pager-btn"
            onClick={goNext}
            disabled={isLast}
            aria-label={intl.formatMessage({ id: 'pagedDocumentViewer.nextPage', defaultMessage: 'Next page' })}
          >
            <ChevronRightIcon aria-hidden="true" />
          </button>
        </div>

        <button type="button" className="paged-document-viewer-toolbar-btn" onClick={printDocument}>
          <FormattedMessage id="pagedDocumentViewer.print" defaultMessage="Print" />
          <PrintIcon className="paged-document-viewer-toolbar-icon" aria-hidden="true" />
        </button>
      </div>

      <div className="paged-document-viewer-page-area" tabIndex={0}>
        <img
          className="paged-document-viewer-page"
          src={pageImages[pageIndex]}
          alt={intl.formatMessage(
            { id: 'pagedDocumentViewer.pageAlt', defaultMessage: '{title} — page {page} of {total}' },
            { title, page: pageIndex + 1, total: pageCount },
          )}
        />
      </div>
    </div>
  );
}
