import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import EmbeddedDocumentFrame, { DEFAULT_EMBEDDED_DOCUMENT_SANDBOX } from './EmbeddedDocumentFrame';

describe('EmbeddedDocumentFrame', () => {
  it('renders an iframe with title and sandbox', () => {
    render(
      <EmbeddedDocumentFrame src="https://example.com/doc.pdf" title="Sample document" />,
    );
    const iframe = screen.getByTitle('Sample document');
    expect(iframe).toHaveAttribute('src', 'https://example.com/doc.pdf');
    expect(iframe).toHaveAttribute('sandbox', DEFAULT_EMBEDDED_DOCUMENT_SANDBOX);
  });

  it('allows overriding sandbox', () => {
    render(<EmbeddedDocumentFrame src="https://example.com/x" title="Doc" sandbox="allow-downloads" />);
    expect(screen.getByTitle('Doc')).toHaveAttribute('sandbox', 'allow-downloads');
  });
});
