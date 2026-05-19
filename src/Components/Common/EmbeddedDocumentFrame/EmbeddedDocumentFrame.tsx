import './EmbeddedDocumentFrame.css';

export type EmbeddedDocumentFrameProps = {
  src: string;
  /** Short description of the embedded document for screen readers (required). */
  title: string;
  className?: string;
  /**
   * `sandbox` token list. Default allows common browser PDF rendering while
   * avoiding unnecessary permission (`allow-forms`, `allow-top-navigation`, etc.).
   * Tighten per origin when you know the embed’s behavior.
   */
  sandbox?: string;
};

/** Default sandbox for third‑party document (e.g. PDF) embeds. */
export const DEFAULT_EMBEDDED_DOCUMENT_SANDBOX = 'allow-same-origin allow-scripts allow-downloads';

/**
 * Responsive iframe for embedded documents (PDFs, HTML viewers, etc.).
 * Prefer known, trusted `src` URLs; pair with CSP and vendor guidance where applicable.
 */
export default function EmbeddedDocumentFrame({
  src,
  title,
  className,
  sandbox = DEFAULT_EMBEDDED_DOCUMENT_SANDBOX,
}: EmbeddedDocumentFrameProps) {
  const rootClass = ['embedded-document-frame-root', className].filter(Boolean).join(' ');

  return (
    <div className={rootClass}>
      <iframe
        src={src}
        title={title}
        sandbox={sandbox}
        className="embedded-document-frame-iframe"
        loading="lazy"
      />
    </div>
  );
}
