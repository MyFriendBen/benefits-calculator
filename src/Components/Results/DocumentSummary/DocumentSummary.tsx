import { useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import { Program, ProgramDocument } from '../../../Types/Results';
import ResultsTranslate from '../Translate/Translate';
import './DocumentSummary.css';

type DocumentWithCount = {
  document: ProgramDocument;
  programCount: number;
};

function getUniqueDocumentsWithCounts(programs: Program[]): DocumentWithCount[] {
  const documentMap = new Map<string, DocumentWithCount>();

  for (const program of programs) {
    for (const document of program.documents) {
      const key = document.text.label;
      const existing = documentMap.get(key);
      if (existing) {
        existing.programCount += 1;
      } else {
        documentMap.set(key, { document, programCount: 1 });
      }
    }
  }

  return Array.from(documentMap.values()).sort((a, b) => b.programCount - a.programCount);
}

type DocumentSummaryProps = {
  programs: Program[];
};

const COLLAPSED_ITEM_COUNT = 3;

const DocumentSummary = ({ programs }: DocumentSummaryProps) => {
  const documentsWithCounts = useMemo(() => getUniqueDocumentsWithCounts(programs), [programs]);
  const [expanded, setExpanded] = useState(false);

  if (documentsWithCounts.length === 0) {
    return null;
  }

  const canExpand = documentsWithCounts.length > COLLAPSED_ITEM_COUNT;
  const visibleDocuments = canExpand && !expanded ? documentsWithCounts.slice(0, COLLAPSED_ITEM_COUNT) : documentsWithCounts;

  return (
    <div className="document-summary-container">
      <p className="document-summary-header">
        <FormattedMessage
          id="results.document-summary.header"
          defaultMessage="In order to apply for the programs you might be eligible for, you will need the below documents:"
        />
      </p>
      <ul className="document-summary-list">
        {visibleDocuments.map(({ document, programCount }, index) => (
          <li key={document.text.label} className="document-summary-item">
            <ResultsTranslate translation={document.text} />
            <span className="document-summary-program-count">
              {index === 0 ? (
                <FormattedMessage
                  id="results.document-summary.program-count-first"
                  defaultMessage="(required to apply for {count} {count, plural, one {program} other {programs}})"
                  values={{ count: programCount }}
                />
              ) : (
                <FormattedMessage
                  id="results.document-summary.program-count"
                  defaultMessage="({count} {count, plural, one {program} other {programs}})"
                  values={{ count: programCount }}
                />
              )}
            </span>
          </li>
        ))}
      </ul>
      {canExpand && (
        <button className="document-summary-toggle" onClick={() => setExpanded((prev) => !prev)}>
          {expanded ? (
            <>
              <VisibilityOffOutlinedIcon fontSize="small" />
              <FormattedMessage id="results.document-summary.show-less" defaultMessage="Show less" />
            </>
          ) : (
            <>
              <VisibilityOutlinedIcon fontSize="small" />
              <FormattedMessage id="results.document-summary.show-more" defaultMessage="Show more" />
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default DocumentSummary;
