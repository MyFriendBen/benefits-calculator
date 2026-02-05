import { TextField } from '@mui/material';
import { Controller, SubmitHandler } from 'react-hook-form';
import { Context } from '../../Wrapper/Wrapper';
import { useContext, useState } from 'react';
import * as z from 'zod';
import { FormattedMessage, useIntl } from 'react-intl';
import QuestionHeader from '../../QuestionComponents/QuestionHeader';
import QuestionQuestion from '../../QuestionComponents/QuestionQuestion';
import PrevAndContinueButtons from '../../PrevAndContinueButtons/PrevAndContinueButtons';
import { useParams } from 'react-router-dom';
import { useDefaultBackNavigationFunction, useGoToNextStep } from '../../QuestionComponents/questionHooks';
import { handleNumbersOnly, NUM_PAD_PROPS } from '../../../Assets/numInputHelpers';
import useScreenApi from '../../../Assets/updateScreen';
import { OverrideableTranslation } from '../../../Assets/languageOptions';
import useStepForm from '../stepForm';
import { zodResolver } from '@hookform/resolvers/zod';
import ErrorMessageWrapper from '../../ErrorMessage/ErrorMessageWrapper';
import './HouseholdSize.css';

const HouseholdSize = () => {
  const { formData } = useContext(Context);
  const { uuid } = useParams();
  const backNavigationFunction = useDefaultBackNavigationFunction('householdSize');
  const nextStep = useGoToNextStep('householdSize', '1');
  const intl = useIntl();
  const { updateScreen } = useScreenApi();
  const [showRoommateInfo, setShowRoommateInfo] = useState(false);

  const formSchema = z.object({
    householdSize: z.coerce
      .number({
        errorMap: () => {
          return {
            message: intl.formatMessage({
              id: 'errorMessage-numberOfHHMembers',
              defaultMessage: 'Please enter the number of people in your household (max. 8)',
            }),
          };
        },
      })
      .int()
      .positive()
      .lte(8),
  });

  type FormSchema = z.infer<typeof formSchema>;

  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useStepForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      householdSize: formData.householdSize || undefined,
    },
    questionName: 'householdSize',
    onSubmitSuccessfulOverride: nextStep,
  });

  const formSubmitHandler: SubmitHandler<FormSchema> = async ({ householdSize }) => {
    if (uuid) {
      const updatedFormData = {
        ...formData,
        householdSize,
        householdData: formData.householdData.slice(0, householdSize),
      };
      await updateScreen(updatedFormData);
    }
  };

  return (
    <div>
      <QuestionHeader>
        <FormattedMessage id="qcc.about_household" defaultMessage="Tell us about your household" />
      </QuestionHeader>
      <QuestionQuestion>
        <>
          <OverrideableTranslation
            id="questions.householdSize"
            defaultMessage="Including you, how many people are in your household?"
          />
          <ul className="household-size-help-list">
            <li>
              <strong>
                <OverrideableTranslation
                  id="questions.householdSize-helpText-fileTaxes-label"
                  defaultMessage="If you file taxes:"
                />
              </strong>{' '}
              <OverrideableTranslation
                id="questions.householdSize-helpText-fileTaxes-description"
                defaultMessage="Count everyone on your tax return. Also count your spouse, even if you file taxes apart."
              />
            </li>
            <li>
              <strong>
                <OverrideableTranslation
                  id="questions.householdSize-helpText-noFileTaxes-label"
                  defaultMessage="If you don't file taxes:"
                />
              </strong>{' '}
              <OverrideableTranslation
                id="questions.householdSize-helpText-noFileTaxes-description"
                defaultMessage="Count the people you live with and also buy and prepare food with."
              />
            </li>
          </ul>
          <button
            type="button"
            className="household-size-roommate-link link-color"
            onClick={() => setShowRoommateInfo(!showRoommateInfo)}
            aria-expanded={showRoommateInfo}
            aria-controls="roommate-info-content"
          >
            <span className={`chevron ${showRoommateInfo ? 'chevron-expanded' : ''}`}>▶</span>
            <span className="roommate-link-text">
              <OverrideableTranslation
                id="questions.householdSize-roommateToggle"
                defaultMessage="What about roommates?"
              />
            </span>
          </button>
          {showRoommateInfo && (
            <p
              id="roommate-info-content"
              className="household-size-roommate-info"
              aria-live="polite"
            >
              <OverrideableTranslation
                id="questions.householdSize-roommateInfo"
                defaultMessage="If you have a roommate but don't share food costs with them, don't count them. They should use this tool on their own to check their benefits."
              />
            </p>
          )}
        </>
      </QuestionQuestion>
      <form onSubmit={handleSubmit(formSubmitHandler)}>
        <Controller
          name="householdSize"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <TextField
              {...field}
              label={<FormattedMessage id="questions.householdSize-inputLabel" defaultMessage="Household Size" />}
              variant="outlined"
              inputProps={NUM_PAD_PROPS}
              onChange={handleNumbersOnly(field.onChange)}
              onFocus={(e) => {
                e.target.select();
              }}
              error={errors.householdSize !== undefined}
              helperText={
                errors.householdSize !== undefined && (
                  <ErrorMessageWrapper fontSize="1rem">{errors.householdSize?.message}</ErrorMessageWrapper>
                )
              }
            />
          )}
        />
        <PrevAndContinueButtons backNavigationFunction={backNavigationFunction} />
      </form>
    </div>
  );
};

export default HouseholdSize;
