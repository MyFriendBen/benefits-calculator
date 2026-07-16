import { TextField } from '@mui/material';
import { Controller, SubmitHandler } from 'react-hook-form';
import { Context } from '../../Wrapper/Wrapper';
import { useContext } from 'react';
import * as z from 'zod';
import { FormattedMessage, useIntl } from 'react-intl';
import QuestionHeader from '../../QuestionComponents/QuestionHeader';
import QuestionQuestion from '../../QuestionComponents/QuestionQuestion';
import PrevAndContinueButtons from '../../PrevAndContinueButtons/PrevAndContinueButtons';
import { useParams, useNavigate } from 'react-router-dom';
import { useDefaultBackNavigationFunction } from '../../QuestionComponents/questionHooks';
import { useStepNumber } from '../../../Assets/stepDirectory';
import { NumericFormat } from 'react-number-format';
import useScreenApi from '../../../Assets/updateScreen';
import { OverrideableTranslation } from '../../../Assets/languageOptions';
import useStepForm from '../stepForm';
import { zodResolver } from '@hookform/resolvers/zod';
import ErrorMessageWrapper from '../../ErrorMessage/ErrorMessageWrapper';
import { useTrackEvent } from '../../../Assets/analytics';
import { getStepAnalyticsId } from '../../../Assets/analytics/stepIds';
import './HouseholdSize.css';

const HouseholdSize = () => {
  const { formData } = useContext(Context);
  const { uuid, whiteLabel } = useParams();
  const backNavigationFunction = useDefaultBackNavigationFunction('householdSize');
  const navigate = useNavigate();
  const householdDataStepNumber = useStepNumber('householdData', false);
  const householdSizeStepNumber = useStepNumber('householdSize', false);
  const intl = useIntl();
  const { updateScreen } = useScreenApi();
  const track = useTrackEvent();

  const formSchema = z.object({
    householdSize: z
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
    onSubmitSuccessfulOverride: () => {},
  });

  const formSubmitHandler: SubmitHandler<FormSchema> = async ({ householdSize }) => {
    if (uuid) {
      const updatedFormData = {
        ...formData,
        householdSize,
        householdData: formData.householdData.slice(0, householdSize),
      };
      await updateScreen(updatedFormData);
      // This step navigates manually (onSubmitSuccessfulOverride) instead of through
      // the shared useGoToNextStep hook, so it must fire its own 'complete' event.
      track('screener_form_step', {
        screener_step_name: getStepAnalyticsId('householdSize'),
        // useStepNumber returns -1 when the step isn't in this referrer's
        // directory; normalize to undefined like the other call sites.
        screener_step_number: householdSizeStepNumber >= 0 ? householdSizeStepNumber : undefined,
        step_action: 'complete',
      });
      const page = householdSize === 1 ? '1' : '0';
      navigate(`/${whiteLabel}/${uuid}/step-${householdDataStepNumber}/${page}`);
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
                <OverrideableTranslation id="questions.householdSize-helpText-you-label" defaultMessage="You" />
              </strong>{' '}
              &mdash;{' '}
              <OverrideableTranslation
                id="questions.householdSize-helpText-you-description"
                defaultMessage="Always include yourself."
              />
            </li>
            <li>
              <strong>
                <OverrideableTranslation id="questions.householdSize-helpText-spouse-label" defaultMessage="Spouse" />
              </strong>{' '}
              &mdash;{' '}
              <OverrideableTranslation
                id="questions.householdSize-helpText-spouse-description"
                defaultMessage="Include them even if you file taxes separately or live apart."
              />
            </li>
            <li>
              <strong>
                <OverrideableTranslation
                  id="questions.householdSize-helpText-dependents-label"
                  defaultMessage="Dependents"
                />
              </strong>{' '}
              &mdash;{' '}
              <OverrideableTranslation
                id="questions.householdSize-helpText-dependents-description"
                defaultMessage="Include everyone under 18 who lives with you and adults you live with who rely on your income."
              />
            </li>
            <li>
              <strong>
                <OverrideableTranslation
                  id="questions.householdSize-helpText-others-label"
                  defaultMessage="Others you live with"
                />
              </strong>{' '}
              &mdash;{' '}
              <OverrideableTranslation
                id="questions.householdSize-helpText-others-description"
                defaultMessage="Only include them if you buy and prepare the majority of meals together."
              />
            </li>
          </ul>
        </>
      </QuestionQuestion>
      <form onSubmit={handleSubmit(formSubmitHandler)}>
        <Controller
          name="householdSize"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <NumericFormat
              value={field.value === 0 ? '' : field.value}
              onValueChange={({ floatValue }) => field.onChange(floatValue ?? 0)}
              allowNegative={false}
              decimalScale={0}
              customInput={TextField}
              label={<FormattedMessage id="questions.householdSize-inputLabel" defaultMessage="Household Size" />}
              variant="outlined"
              inputProps={{ inputMode: 'numeric' }}
              onFocus={(e) => {
                e.target.select();
              }}
              error={errors.householdSize !== undefined}
              helperText={
                errors.householdSize !== undefined && (
                  <ErrorMessageWrapper>{errors.householdSize?.message}</ErrorMessageWrapper>
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
