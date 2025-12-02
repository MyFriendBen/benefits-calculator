import { zodResolver } from '@hookform/resolvers/zod';
import { FormControlLabel, Radio, RadioGroup } from '@mui/material';
import { ReactNode, useContext, useEffect, useState } from 'react';
import { Controller } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';
import { z } from 'zod';
import useScreenApi from '../../Assets/updateScreen';
import { FormattedMessageType } from '../../Types/Questions';
import CheckBoxAccordion from '../AccordionsContainer/CheckboxAccordion';
import { useConfig } from '../Config/configHook';
import ErrorMessageWrapper from '../ErrorMessage/ErrorMessageWrapper';
import HelpButton from '../HelpBubbleIcon/HelpButton';
import PrevAndContinueButtons from '../PrevAndContinueButtons/PrevAndContinueButtons';
import QuestionHeader from '../QuestionComponents/QuestionHeader';
import { useDefaultBackNavigationFunction } from '../QuestionComponents/questionHooks';
import QuestionQuestion from '../QuestionComponents/QuestionQuestion';
import QuestionDescription from '../QuestionComponents/QuestionDescription';
import { Context } from '../Wrapper/Wrapper';
import useStepForm from './stepForm';
import { OverrideableTranslation } from '../../Assets/languageOptions';

type CategoryBenefitsConfig = {
  [key: string]: {
    benefits: {
      [key: string]: {
        name: FormattedMessageType;
        description: FormattedMessageType;
      };
    };
    category_name: FormattedMessageType;
  };
};

type CategoryBenefitsProps = {
  alreadyHasBenefits: { [key: string]: boolean };
  onChange: (alreadyHasBenefits: { [key: string]: boolean }) => void;
};

function CategoryBenefits({ alreadyHasBenefits, onChange }: CategoryBenefitsProps) {
  const [currentExpanded, setCurrentExpanded] = useState(-1); // start with all accordions closed

  const benefits = useConfig<CategoryBenefitsConfig>('category_benefits');

  return (
    <>
      {Object.values(benefits).map((details, index) => {
        const options = Object.entries(details.benefits).map(([name, benefit]) => {
          return {
            value: name,
            text: (
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{benefit.name}</div>
                <div style={{ fontSize: '0.85rem', color: '#5a5a5a', marginTop: '0.25rem' }}>{benefit.description}</div>
              </div>
            ),
          };
        });

        return (
          <CheckBoxAccordion
            name={details.category_name}
            options={options}
            expanded={currentExpanded === index}
            onExpand={(isExpanded) => {
              if (isExpanded) {
                setCurrentExpanded(index);
              } else {
                if (currentExpanded === index) {
                  setCurrentExpanded(-1); // close all
                }
              }
            }}
            values={alreadyHasBenefits}
            onChange={(values) => {
              let newAlreadyHas: { [key: string]: boolean } = { ...alreadyHasBenefits };

              newAlreadyHas = { ...newAlreadyHas, ...values };

              onChange(newAlreadyHas);
            }}
            key={index}
          />
        );
      })}
    </>
  );
}

function AlreadyHasBenefits() {
  const { formData } = useContext(Context);
  const { formatMessage } = useIntl();
  const { uuid } = useParams();
  const backNavigationFunction = useDefaultBackNavigationFunction('hasBenefits');
  const { updateScreen } = useScreenApi();

  const formSchema = z
    .object({
      hasBenefits: z.enum(['true', 'false', 'preferNotToAnswer']),
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
      hasBenefits: formData.hasBenefits,
      alreadyHasBenefits: formData.benefits,
    },
    questionName: 'hasBenefits',
  });

  const hasBenefits = 'true' === watch('hasBenefits');

  useEffect(() => {
    const newAlreadyHasBenefits = { ...watch('alreadyHasBenefits') };

    if (!hasBenefits) {
      for (const key in newAlreadyHasBenefits) {
        newAlreadyHasBenefits[key] = false;
      }
    }

    setValue('alreadyHasBenefits', newAlreadyHasBenefits);
  }, [hasBenefits]);

  const formSubmitHandler = async ({ alreadyHasBenefits, hasBenefits }: z.infer<typeof formSchema>) => {
    if (uuid === undefined) {
      throw new Error('uuid is not defined');
    }

    const newFormData = { ...formData, hasBenefits: hasBenefits, benefits: alreadyHasBenefits };

    await updateScreen(newFormData);
  };

  const renderHelpSection = () => {
    return (
      <HelpButton>
        <OverrideableTranslation
          id="questions.hasBenefits-description"
          defaultMessage="This information will help make sure we don't give you results for benefits you already have."
        />
      </HelpButton>
    );
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
        <OverrideableTranslation
          id="questions.hasBenefits"
          defaultMessage="Does anyone in your household currently have public assistance benefits?"
        />
        {renderHelpSection()}
      </QuestionQuestion>
      <form onSubmit={handleSubmit(formSubmitHandler)}>
        <Controller
          name="hasBenefits"
          control={control}
          render={({ field }) => {
            return (
              <RadioGroup
                {...field}
                aria-label={formatMessage({
                  id: 'questions.hasBenefits',
                  defaultMessage: 'Does anyone in your household currently have public assistance benefits?',
                })}
                sx={{ marginBottom: '0.2rem', gap: '0rem' }}
              >
                <FormControlLabel
                  value={'true'}
                  control={<Radio />}
                  label={<span style={{ fontSize: '0.95rem' }}><FormattedMessage id="radiofield.label-yes" defaultMessage="Yes" /></span>}
                />
                <FormControlLabel
                  value={'false'}
                  control={<Radio />}
                  label={<span style={{ fontSize: '0.95rem' }}><FormattedMessage id="radiofield.label-no" defaultMessage="No" /></span>}
                />
                <FormControlLabel
                  value={'preferNotToAnswer'}
                  control={<Radio />}
                  label={
                    <span style={{ fontSize: '0.95rem' }}>
                      <FormattedMessage id="radiofield.label-preferNotToAnswer" defaultMessage="Prefer not to answer" />
                    </span>
                  }
                />
              </RadioGroup>
            );
          }}
        />
        {watch('hasBenefits') === 'true' && (
          <div>
            <hr style={{ margin: '1rem 0 2rem 0', border: 'none', borderTop: '1px solid #d0d0d0' }} />
            <QuestionQuestion>
              <FormattedMessage
                id="questions.hasBenefits-a"
                defaultMessage="Please tell us what benefits your household currently has."
              />
            </QuestionQuestion>
            <QuestionDescription>
              <FormattedMessage
                id="questions.hasBenefits-description-expanded"
                defaultMessage="Select all that apply. Expand each category to see available options."
              />
            </QuestionDescription>
            <CategoryBenefits
              alreadyHasBenefits={watch('alreadyHasBenefits')}
              onChange={(values) =>
                setValue('alreadyHasBenefits', values, {
                  shouldValidate: isSubmitted,
                  shouldDirty: true,
                  shouldTouch: true,
                })
              }
            />
            {errors.alreadyHasBenefits !== undefined && (
              <ErrorMessageWrapper fontSize="1rem">
                {errors.alreadyHasBenefits.message as ReactNode}
              </ErrorMessageWrapper>
            )}
          </div>
        )}
        <PrevAndContinueButtons backNavigationFunction={backNavigationFunction} />
      </form>
    </div>
  );
}

export default AlreadyHasBenefits;
