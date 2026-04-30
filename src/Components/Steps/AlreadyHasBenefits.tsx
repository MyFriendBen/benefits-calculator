import { useWatch } from 'react-hook-form';
import { Alert, CircularProgress, Typography } from '@mui/material';
import { useContext, useMemo } from 'react';
import { FormattedMessage } from 'react-intl';
import { useParams } from 'react-router-dom';
import type { HasBenefitsProgram } from '../../Types/ApiCalls';
import useScreenApi from '../../Assets/updateScreen';
import { OverrideableTranslation } from '../../Assets/languageOptions';
import HasBenefitsTile from './HasBenefitsTile';
import PrevAndContinueButtons from '../PrevAndContinueButtons/PrevAndContinueButtons';
import QuestionHeader from '../QuestionComponents/QuestionHeader';
import { useDefaultBackNavigationFunction } from '../QuestionComponents/questionHooks';
import QuestionQuestion from '../QuestionComponents/QuestionQuestion';
import { Context } from '../Wrapper/Wrapper';
import useStepForm from './stepForm';
import ResultsTranslate from '../Results/Translate/Translate';
import './AlreadyHasBenefits.css';

type FormSchema = {
  alreadyHasBenefits: { [key: string]: boolean };
};

type ProgramsByCategory = {
  // Stable React key. For real categories this is the translation label;
  // for the synthetic uncategorized group it's a fixed sentinel.
  groupKey: string;
  // Translation rendered as the heading. Null for the synthetic Other group,
  // which uses a hardcoded FormattedMessage.
  categoryTranslation: { label: string; default_message: string } | null;
  // Sort key. Pushes the Other group to the end.
  sortKey: string;
  programs: HasBenefitsProgram[];
};

const OTHER_GROUP_KEY = '__uncategorized__';
// Bigger than any real category name will sort to, so Other always lands last.
const OTHER_SORT_KEY = '￿';

function groupByCategory(programs: HasBenefitsProgram[]): ProgramsByCategory[] {
  const map = new Map<string, ProgramsByCategory>();

  for (const program of programs) {
    if (program.category === null) {
      if (!map.has(OTHER_GROUP_KEY)) {
        map.set(OTHER_GROUP_KEY, {
          groupKey: OTHER_GROUP_KEY,
          categoryTranslation: null,
          sortKey: OTHER_SORT_KEY,
          programs: [],
        });
      }
      map.get(OTHER_GROUP_KEY)!.programs.push(program);
      continue;
    }
    const key = program.category.label;
    if (!map.has(key)) {
      map.set(key, {
        groupKey: key,
        categoryTranslation: program.category,
        sortKey: program.category.default_message,
        programs: [],
      });
    }
    map.get(key)!.programs.push(program);
  }

  // Sort groups by category display name (Other always last via sortKey),
  // and programs within each group by display name.
  const sorted = Array.from(map.values()).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  for (const group of sorted) {
    group.programs.sort((a, b) => a.name.default_message.localeCompare(b.name.default_message));
  }
  return sorted;
}

function AlreadyHasBenefits() {
  const {
    formData,
    hasBenefitsPrograms: programs,
    hasBenefitsProgramsLoading,
    hasBenefitsProgramsError,
  } = useContext(Context);
  const { uuid } = useParams();
  const backNavigationFunction = useDefaultBackNavigationFunction('hasBenefits');
  const { updateScreen } = useScreenApi();

  const {
    control,
    handleSubmit,
    setValue,
  } = useStepForm<FormSchema>({
    defaultValues: {
      alreadyHasBenefits: formData.benefits,
    },
    questionName: 'hasBenefits',
  });

  const alreadyHasBenefits = useWatch({ control, name: 'alreadyHasBenefits' });

  const formSubmitHandler = async ({ alreadyHasBenefits }: FormSchema) => {
    if (uuid === undefined) {
      throw new Error('uuid is not defined');
    }
    const anySelected = Object.values(alreadyHasBenefits).some(Boolean);
    const hasBenefits = anySelected ? ('true' as const) : ('false' as const);
    const newFormData = { ...formData, hasBenefits, benefits: alreadyHasBenefits };
    await updateScreen(newFormData);
  };

  const categories = useMemo(() => groupByCategory(programs), [programs]);

  const fieldsetLegendId = 'has-benefits-legend';

  const renderTiles = () => {
    if (hasBenefitsProgramsLoading) {
      return (
        <div className="hb-loading" role="status" aria-live="polite">
          <CircularProgress size="1.5rem" />
          <span className="hb-loading-label">
            <FormattedMessage id="questions.hasBenefits-loading" defaultMessage="Loading benefit options…" />
          </span>
        </div>
      );
    }

    if (hasBenefitsProgramsError) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          <FormattedMessage
            id="questions.hasBenefits-loadError"
            defaultMessage="We couldn't load the list of benefits. Please refresh the page to try again."
          />
        </Alert>
      );
    }

    return categories.map((category) => {
      const headingId = `has-benefits-category-${category.groupKey}`;
      return (
        <div key={category.groupKey} className="has-benefits-category" role="group" aria-labelledby={headingId}>
          <Typography
            id={headingId}
            component="h3"
            className="has-benefits-category-header"
          >
            {category.categoryTranslation ? (
              <ResultsTranslate translation={category.categoryTranslation} />
            ) : (
              <FormattedMessage id="questions.hasBenefits-otherCategory" defaultMessage="Other" />
            )}
          </Typography>
          <div className="hb-tiles-grid">
            {category.programs.map((program) => {
              // TODO(MFB-720): drop .toLowerCase() once the join-table migration
              // ships and formData.benefits keys mirror name_abbreviated exactly.
              // Today the read/write paths in updateScreen.ts/updateFormData.tsx
              // use lowercase keys, so admin-entered abbreviations like "SNAP"
              // need coercing to match.
              const key = program.name_abbreviated.toLowerCase();
              return (
                <HasBenefitsTile
                  key={program.name_abbreviated}
                  program={program}
                  selected={!!alreadyHasBenefits[key]}
                  onClick={() => {
                    setValue(
                      'alreadyHasBenefits',
                      { ...alreadyHasBenefits, [key]: !alreadyHasBenefits[key] },
                      { shouldDirty: true, shouldTouch: true },
                    );
                  }}
                />
              );
            })}
          </div>
        </div>
      );
    });
  };

  return (
    <div>
      <QuestionHeader>
        <FormattedMessage
          id="qcc.tell-us-final-text"
          defaultMessage="Tell us some final information about your household."
        />
      </QuestionHeader>
      <QuestionQuestion>
        <span id={fieldsetLegendId}>
          <OverrideableTranslation
            id="questions.hasBenefits"
            defaultMessage="Does anyone in your household currently receive any of these public benefits?"
          />
        </span>
      </QuestionQuestion>
      <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
        <FormattedMessage
          id="questions.hasBenefits-description"
          defaultMessage="Select all that apply. Receiving any of these benefits may automatically qualify you for other programs. Leave blank if none apply."
        />
      </Typography>
      <form onSubmit={handleSubmit(formSubmitHandler)}>
        <fieldset className="has-benefits-programs" aria-labelledby={fieldsetLegendId}>
          {renderTiles()}
        </fieldset>

        <PrevAndContinueButtons
          backNavigationFunction={backNavigationFunction}
          disabled={hasBenefitsProgramsLoading || hasBenefitsProgramsError}
        />
      </form>
    </div>
  );
}

export default AlreadyHasBenefits;
