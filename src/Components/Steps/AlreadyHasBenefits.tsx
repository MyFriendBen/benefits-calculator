import { zodResolver } from '@hookform/resolvers/zod';
import { FormControlLabel, Radio, RadioGroup, Typography } from '@mui/material';
import { useContext } from 'react';
import { Controller } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';
import { z } from 'zod';
import type { HasBenefitsProgram } from '../../apiCalls';
import useScreenApi from '../../Assets/updateScreen';
import { OverrideableTranslation } from '../../Assets/languageOptions';
import ErrorMessageWrapper from '../ErrorMessage/ErrorMessageWrapper';
import MultiSelectTiles from '../SelectTiles/MultiSelectTiles';
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
  const { formatMessage } = useIntl();
  const { uuid } = useParams();
  const backNavigationFunction = useDefaultBackNavigationFunction('hasBenefits');
  const { updateScreen } = useScreenApi();

  const formSchema = z
    .object({
      hasBenefits: z.enum(['true', 'false', 'preferNotToAnswer'], {
        required_error: formatMessage({
          id: 'validation-helperText.hasBenefits',
          defaultMessage: 'Please select an option.',
        }),
      }),
      alreadyHasBenefits: z.record(z.string(), z.boolean()),
    })
    .refine(
      ({ hasBenefits, alreadyHasBenefits }) => {
        const noBenefitsSelected = Object.values(alreadyHasBenefits).every((value) => !value);
        if (hasBenefits === 'true' && noBenefitsSelected) {
          return false;
        }
        return true;
      },
      {
        message: formatMessage({
          id: 'validation-helperText.benefits',
          defaultMessage:
            'If your household does not receive any of these benefits, please select the "No" option above.',
        }),
        path: ['alreadyHasBenefits'],
      },
    );

  type FormSchema = z.infer<typeof formSchema>;

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    setValue,
    watch,
  } = useStepForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      // Don't pre-fill — user must make an explicit choice each visit
      hasBenefits: undefined as unknown as 'true' | 'false' | 'preferNotToAnswer',
      alreadyHasBenefits: formData.benefits,
    },
    questionName: 'hasBenefits',
  });

  const hasBenefits = watch('hasBenefits');
  const tilesEnabled = hasBenefits === 'true';

  useEffect(() => {
    if (!tilesEnabled) {
      const cleared = { ...watch('alreadyHasBenefits') };
      for (const key in cleared) {
        cleared[key] = false;
      }
      setValue('alreadyHasBenefits', cleared);
    }
  }, [tilesEnabled]);

  const formSubmitHandler = async ({ alreadyHasBenefits, hasBenefits }: FormSchema) => {
    if (uuid === undefined) {
      throw new Error('uuid is not defined');
    }
    const newFormData = { ...formData, hasBenefits, benefits: alreadyHasBenefits };
    await updateScreen(newFormData);
  };

  const categories = groupByCategory(programs);

  const tileOptions = programs.map((program) => ({
    value: program.name_abbreviated,
    icon: null,
    text: (
      <span className="has-benefits-tile-text">
        <strong className="has-benefits-tile-acronym">{program.name_abbreviated}</strong>
        <span className="has-benefits-tile-name">
          <ResultsTranslate translation={program.name} />
          {': '}
          <ResultsTranslate translation={program.website_description} />
        </span>
      </span>
    ),
  }));

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
          defaultMessage="Does anyone in your household currently receive any public benefits?"
        />
      </QuestionQuestion>
      <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
        <FormattedMessage
          id="questions.hasBenefits-description"
          defaultMessage="You may automatically qualify for certain programs if someone in your household receives public benefits."
        />
      </Typography>
      <form onSubmit={handleSubmit(formSubmitHandler)}>
        <Controller
          name="hasBenefits"
          control={control}
          render={({ field }) => (
            <RadioGroup
              {...field}
              value={field.value ?? ''}
              aria-label={formatMessage({
                id: 'questions.hasBenefits',
                defaultMessage: 'Does anyone in your household currently receive any public benefits?',
              })}
              sx={{ marginBottom: '1.5rem' }}
            >
              <FormControlLabel
                value="true"
                control={<Radio />}
                label={<FormattedMessage id="radiofield.label-yes" defaultMessage="Yes" />}
              />
              <FormControlLabel
                value="false"
                control={<Radio />}
                label={<FormattedMessage id="radiofield.label-no" defaultMessage="No" />}
              />
              <FormControlLabel
                value="preferNotToAnswer"
                control={<Radio />}
                label={
                  <FormattedMessage id="radiofield.label-preferNotToAnswer" defaultMessage="Prefer not to answer" />
                }
              />
            </RadioGroup>
          )}
        />

        <div className={`has-benefits-programs${tilesEnabled ? '' : ' has-benefits-programs--disabled'}`}>
          {categories.map((category) => {
            const categoryOptions = tileOptions.filter((opt) =>
              category.programs.some((p) => p.name_abbreviated === opt.value),
            );
            return (
              <div key={category.categoryLabel} className="has-benefits-category">
                <Typography className="has-benefits-category-header">
                  <ResultsTranslate translation={{ label: category.categoryLabel, default_message: category.categoryDefaultMessage }} />
                </Typography>
                <MultiSelectTiles
                  options={categoryOptions}
                  values={watch('alreadyHasBenefits') as Partial<Record<string, boolean>>}
                  onChange={(values) => {
                    if (!tilesEnabled) return;
                    setValue('alreadyHasBenefits', values as Record<string, boolean>, {
                      shouldValidate: isSubmitted,
                      shouldDirty: true,
                      shouldTouch: true,
                    });
                  }}
                  variant="flat"
                />
              </div>
            );
          })}
        </div>

        {errors.alreadyHasBenefits !== undefined && (
          <ErrorMessageWrapper fontSize="1rem">
            {errors.alreadyHasBenefits.message as unknown as string}
          </ErrorMessageWrapper>
        )}

        <PrevAndContinueButtons backNavigationFunction={backNavigationFunction} />
      </form>
    </div>
  );
}

export default AlreadyHasBenefits;
