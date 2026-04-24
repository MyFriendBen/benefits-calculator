import { zodResolver } from '@hookform/resolvers/zod';
import { useWatch } from 'react-hook-form';
import { Typography } from '@mui/material';
import { useContext } from 'react';
import { FormattedMessage } from 'react-intl';
import { useParams } from 'react-router-dom';
import { z } from 'zod';
import type { HasBenefitsProgram } from '../../apiCalls';
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

type ProgramsByCategory = {
  categoryLabel: string;
  categoryDefaultMessage: string;
  programs: HasBenefitsProgram[];
};

function groupByCategory(programs: HasBenefitsProgram[]): ProgramsByCategory[] {
  const map = new Map<string, ProgramsByCategory>();

  for (const program of programs) {
    if (program.category === null) continue;
    const key = program.category.label;
    if (!map.has(key)) {
      map.set(key, {
        categoryLabel: program.category.label,
        categoryDefaultMessage: program.category.default_message,
        programs: [],
      });
    }
    map.get(key)!.programs.push(program);
  }

  return Array.from(map.values()).sort((a, b) =>
    a.categoryDefaultMessage.localeCompare(b.categoryDefaultMessage),
  );
}

function AlreadyHasBenefits() {
  const { formData, hasBenefitsPrograms: programs } = useContext(Context);
  const { uuid } = useParams();
  const backNavigationFunction = useDefaultBackNavigationFunction('hasBenefits');
  const { updateScreen } = useScreenApi();

  const formSchema = z.object({
    alreadyHasBenefits: z.record(z.string(), z.boolean()),
  });

  type FormSchema = z.infer<typeof formSchema>;

  const {
    control,
    formState: { isSubmitted },
    handleSubmit,
    setValue,
  } = useStepForm<FormSchema>({
    resolver: zodResolver(formSchema),
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

  const categories = groupByCategory(programs);

  return (
    <div>
      <QuestionHeader>
        <FormattedMessage
          id="qcc.tell-us-final-text"
          defaultMessage="Tell us some final information about your household."
        />
      </QuestionHeader>
      <QuestionQuestion>
        <OverrideableTranslation
          id="questions.hasBenefits"
          defaultMessage="Does anyone in your household currently receive any of these public benefits?"
        />
      </QuestionQuestion>
      <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
        <FormattedMessage
          id="questions.hasBenefits-description"
          defaultMessage="Select all that apply. Receiving any of these benefits may automatically qualify you for other programs. Leave blank if none apply."
        />
      </Typography>
      <form onSubmit={handleSubmit(formSubmitHandler)}>
        <div className="has-benefits-programs">
          {categories.map((category) => {
            return (
              <div key={category.categoryLabel} className="has-benefits-category">
                <Typography className="has-benefits-category-header">
                  <ResultsTranslate translation={{ label: category.categoryLabel, default_message: category.categoryDefaultMessage }} />
                </Typography>
                <div className="hb-tiles-grid">
                  {category.programs.map((program) => {
                    const key = program.name_abbreviated.toLowerCase();
                    return (
                      <HasBenefitsTile
                        key={program.name_abbreviated}
                        program={program}
                        selected={!!alreadyHasBenefits[key]}
                        disabled={false}
                        onClick={() => {
                          setValue(
                            'alreadyHasBenefits',
                            { ...alreadyHasBenefits, [key]: !alreadyHasBenefits[key] },
                            { shouldValidate: isSubmitted, shouldDirty: true, shouldTouch: true },
                          );
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <PrevAndContinueButtons backNavigationFunction={backNavigationFunction} />
      </form>
    </div>
  );
}

export default AlreadyHasBenefits;
