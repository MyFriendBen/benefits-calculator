import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { ProgramDocument } from '../../../Types/Results';
import { createProgram, createTranslation } from '../testHelpers';
import DocumentSummary from './DocumentSummary';

jest.mock('../Translate/Translate', () => ({ translation }: { translation: { default_message: string } }) => (
  <span>{translation.default_message}</span>
));

const createDocument = (label: string): ProgramDocument => ({
  text: createTranslation(label),
  link_url: createTranslation(''),
  link_text: createTranslation(''),
});

const renderDocumentSummary = (programs = [createProgram()]) =>
  render(
    <IntlProvider locale="en">
      <DocumentSummary programs={programs} />
    </IntlProvider>,
  );

describe('DocumentSummary', () => {
  describe('rendering', () => {
    it('renders nothing when no programs have documents', () => {
      const { container } = renderDocumentSummary([createProgram({ documents: [] })]);
      expect(container).toBeEmptyDOMElement();
    });

    it('renders the header text', () => {
      const programs = [createProgram({ documents: [createDocument('Proof of income')] })];
      renderDocumentSummary(programs);
      expect(
        screen.getByText(/in order to apply for the programs you might be eligible for/i),
      ).toBeInTheDocument();
    });

    it('renders document items', () => {
      const programs = [
        createProgram({ documents: [createDocument('Proof of income'), createDocument('Proof of identity')] }),
      ];
      renderDocumentSummary(programs);
      expect(screen.getByText('Proof of income')).toBeInTheDocument();
      expect(screen.getByText('Proof of identity')).toBeInTheDocument();
    });

    it('shows program count for each document', () => {
      const doc = createDocument('Proof of income');
      const programs = [createProgram({ documents: [doc] }), createProgram({ documents: [doc] })];
      renderDocumentSummary(programs);
      expect(screen.getByText(/2 programs/i)).toBeInTheDocument();
    });

    it('uses "required to apply for" wording for the first (most common) document', () => {
      const programs = [
        createProgram({ documents: [createDocument('Doc A'), createDocument('Doc B')] }),
      ];
      renderDocumentSummary(programs);
      expect(screen.getByText(/required to apply for/i)).toBeInTheDocument();
    });

    it('deduplicates documents that appear across multiple programs', () => {
      const doc = createDocument('Shared doc');
      const programs = [createProgram({ documents: [doc] }), createProgram({ documents: [doc] })];
      renderDocumentSummary(programs);
      expect(screen.getAllByText('Shared doc')).toHaveLength(1);
    });

    it('sorts documents by program count descending', () => {
      const docA = createDocument('Rare doc');
      const docB = createDocument('Common doc');
      const programs = [
        createProgram({ documents: [docA, docB] }),
        createProgram({ documents: [docB] }),
      ];
      renderDocumentSummary(programs);
      const items = screen.getAllByRole('listitem');
      expect(items[0]).toHaveTextContent('Common doc');
      expect(items[1]).toHaveTextContent('Rare doc');
    });
  });

  describe('show more / show less', () => {
    const manyDocs = [
      createDocument('Doc 1'),
      createDocument('Doc 2'),
      createDocument('Doc 3'),
      createDocument('Doc 4'),
      createDocument('Doc 5'),
    ];
    const programsWithManyDocs = [createProgram({ documents: manyDocs })];

    it('does not render toggle when there are 3 or fewer documents', () => {
      const programs = [
        createProgram({
          documents: [createDocument('Doc 1'), createDocument('Doc 2'), createDocument('Doc 3')],
        }),
      ];
      renderDocumentSummary(programs);
      expect(screen.queryByRole('button', { name: /show more/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /show less/i })).not.toBeInTheDocument();
    });

    it('renders toggle when there are more than 3 documents', () => {
      renderDocumentSummary(programsWithManyDocs);
      expect(screen.getByRole('button', { name: /show more/i })).toBeInTheDocument();
    });

    it('only shows the first 3 documents when collapsed', () => {
      renderDocumentSummary(programsWithManyDocs);
      expect(screen.getByText('Doc 1')).toBeInTheDocument();
      expect(screen.getByText('Doc 2')).toBeInTheDocument();
      expect(screen.getByText('Doc 3')).toBeInTheDocument();
      expect(screen.queryByText('Doc 4')).not.toBeInTheDocument();
      expect(screen.queryByText('Doc 5')).not.toBeInTheDocument();
    });

    it('shows all documents after clicking show more', () => {
      renderDocumentSummary(programsWithManyDocs);
      fireEvent.click(screen.getByRole('button', { name: /show more/i }));
      expect(screen.getByText('Doc 4')).toBeInTheDocument();
      expect(screen.getByText('Doc 5')).toBeInTheDocument();
    });

    it('switches button label to show less after expanding', () => {
      renderDocumentSummary(programsWithManyDocs);
      fireEvent.click(screen.getByRole('button', { name: /show more/i }));
      expect(screen.getByRole('button', { name: /show less/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /show more/i })).not.toBeInTheDocument();
    });

    it('collapses back to 3 items after clicking show less', () => {
      renderDocumentSummary(programsWithManyDocs);
      fireEvent.click(screen.getByRole('button', { name: /show more/i }));
      fireEvent.click(screen.getByRole('button', { name: /show less/i }));
      expect(screen.queryByText('Doc 4')).not.toBeInTheDocument();
      expect(screen.queryByText('Doc 5')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /show more/i })).toBeInTheDocument();
    });
  });
});
