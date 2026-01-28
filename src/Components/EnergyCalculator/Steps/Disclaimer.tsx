import { useContext, useEffect } from 'react';
import { Context } from '../../Wrapper/Wrapper';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router-dom';
import { STARTING_QUESTION_NUMBER } from '../../../Assets/stepDirectory';
import { Checkbox, FormControlLabel } from '@mui/material';
import { FormattedMessage, useIntl } from 'react-intl';
import { FormattedMessageType } from '../../../Types/Questions';
import dataLayerPush from '../../../Assets/analytics';
import QuestionHeader from '../../QuestionComponents/QuestionHeader';
import { useConfig, useLocalizedLink } from '../../Config/configHook';
import ErrorMessageWrapper from '../../ErrorMessage/ErrorMessageWrapper';
import PrevAndContinueButtons from '../../PrevAndContinueButtons/PrevAndContinueButtons';
import { useQueryString } from '../../QuestionComponents/questionHooks';
import { OTHER_PAGE_TITLES } from '../../../Assets/pageTitleTags';
import useScreenApi from '../../../Assets/updateScreen';
import '../../../Components/Steps/Disclaimer/Disclaimer.css';
import { usePageTitle } from '../../Common/usePageTitle';

const isTrue = (value: boolean) => {
  return value;
};

const Disclaimer = () => {
  const { formData, setScreenLoading, setStepLoading } = useContext(Context);
  let { uuid } = useParams();
  const navigate = useNavigate();
  // use defaults for the config on this page because the config won't be loaded
  // when the page is first rendered when coming from /select-state
  const publicChargeOption = useConfig<{ link: string; text: FormattedMessageType }>('public_charge_rule', {
    link: '',
    text: <FormattedMessage id="landingPage.defaultPublicChargeLink" defaultMessage="Public Charge Rule" />,
  });
  const privacyPolicyLink = useLocalizedLink('privacy_policy');
  const consentToContactLinks = useLocalizedLink('consent_to_contact');
  const queryString = useQueryString();
  const { createScreen, updateScreen } = useScreenApi();
  const backNavigationFunction = () => {
    if (uuid !== undefined) {
      navigate(`/cesn/${uuid}/step-1${queryString}`);
      return;
    }

    navigate(`/cesn/step-1${queryString}`);
  };

  usePageTitle(OTHER_PAGE_TITLES.disclaimer);

  const { formatMessage } = useIntl();
  const isChecked = () => {
    return {
      message: formatMessage({
        id: 'disclaimer.error',
        defaultMessage: 'Please check the box to continue.',
      }),
    };
  };

  const formSchema = z.object({
    agreeToTermsOfService: z.boolean().refine(isTrue, isChecked()),
    is13OrOlder: z.boolean().refine(isTrue, isChecked()),
  });

  type FormSchema = z.infer<typeof formSchema>;

  const {
    control,
    formState: { errors },
    getValues,
    handleSubmit,
  } = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      agreeToTermsOfService: formData.agreeToTermsOfService ?? false,
      is13OrOlder: formData.is13OrOlder ?? false,
    },
  });

  const formSubmitHandler: SubmitHandler<FormSchema> = async (termsOfServiceAndAgeData) => {
    const updatedFormData = { ...formData, ...termsOfServiceAndAgeData };
    setStepLoading(true);

    if (uuid) {
      await updateScreen(updatedFormData);
      startScreen(uuid);
    } else {
      const response = await createScreen(updatedFormData);
      setScreenLoading(false);
      startScreen(response.uuid);
    }
  };

  const startScreen = async (uuid: string) => {
    setStepLoading(false);
    navigate(`/cesn/${uuid}/step-${STARTING_QUESTION_NUMBER}`);
  };

  const renderDisclaimerText = () => {
    return (
      <section className="disclaimer-text-section">
        <FormattedMessage
          id="energyCalculatorDisclaimer.body"
          defaultMessage="The Colorado Energy Savings Navigator is a tool that can help determine energy-related bill assistance and rebates you are likely eligible for. Here's what you should know before you get started:"
        />
        <ul className="disclaimer-list-container">
          <li>
            <FormattedMessage
              id="energyCalculatorDisclaimer.firstBulletItem"
              defaultMessage="The Colorado Energy Savings Navigator only provides estimates of what you may qualify for. You should not rely on these estimates. You must confirm your final eligibility and benefit amount with the proper agency or other decision maker."
            />
          </li>
          <li>
            <FormattedMessage
              id="energyCalculatorDisclaimer.secondBulletItem"
              defaultMessage="Your responses will remain anonymous unless you provide optional contact information and consent to receive future communication."
            />
          </li>
          <li>
            <div>
              <FormattedMessage
                id="energyCalculatorDisclaimer.publicCharge"
                defaultMessage="Some benefits are available to Non-U.S. citizens. Non-U.S. citizens planning to apply for legal permanent residency or a visa should consider how applying for any benefits may affect their immigration status. For more information, please review the "
              />
              <a
                className="link-color"
                href={publicChargeOption.link}
                target="_blank"
                onClick={() => {
                  dataLayerPush({
                    event: 'public_charge',
                    action: 'public charge link click',
                  });
                }}
              >
                {publicChargeOption.text}
              </a>
              <FormattedMessage id="energyCalculatorDisclaimer.publicCharge.afterLink" defaultMessage="." />
            </div>
          </li>
        </ul>
      </section>
    );
  };

  const createAgreeTTSCheckboxLabel = () => {
    return (
      <div className="disclaimer-font">
        <FormattedMessage
          id="disclaimer-label"
          defaultMessage="By proceeding, you confirm that you have read and agree to the "
        />
        <a href={privacyPolicyLink} target="_blank" className="link-color">
          <FormattedMessage id="landingPage-policyText" defaultMessage="Privacy Policy" />
        </a>
        <FormattedMessage id="landingPage-and-text" defaultMessage=" and " />
        <a href={consentToContactLinks} target="_blank" className="link-color">
          <FormattedMessage id="landingPage-additionalTerms" defaultMessage="Terms and Conditions" />
        </a>
        <FormattedMessage id="landingPage-disclaimer-lable-end" defaultMessage="." />
      </div>
    );
  };

  return (
    <main className="benefits-form">
      <QuestionHeader>
        <FormattedMessage id="disclaimer.header" defaultMessage="What you should know: " />
      </QuestionHeader>
      {renderDisclaimerText()}
      <form onSubmit={handleSubmit(formSubmitHandler)}>
        <div className="checkbox-container">
          <Controller
            name="agreeToTermsOfService"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <>
                <FormControlLabel
                  control={
                    <Checkbox
                      {...field}
                      checked={getValues('agreeToTermsOfService')}
                      sx={errors.agreeToTermsOfService ? { color: '#c6252b' } : {}}
                    />
                  }
                  label={createAgreeTTSCheckboxLabel()}
                />
                {errors.agreeToTermsOfService && (
                  <ErrorMessageWrapper fontSize="1rem">{errors.agreeToTermsOfService.message}</ErrorMessageWrapper>
                )}
              </>
            )}
          />
          <Controller
            name="is13OrOlder"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <>
                <FormControlLabel
                  control={
                    <Checkbox
                      {...field}
                      checked={getValues('is13OrOlder')}
                      sx={errors.is13OrOlder ? { color: '#c6252b' } : {}}
                    />
                  }
                  label={
                    <div className="disclaimer-font">
                      <FormattedMessage
                        id="disclaimer-label-age"
                        defaultMessage="I confirm I am 13 years of age or older."
                      />
                    </div>
                  }
                  className="top-margin"
                />
                {errors.is13OrOlder && (
                  <ErrorMessageWrapper fontSize="1rem">{errors.is13OrOlder.message}</ErrorMessageWrapper>
                )}
              </>
            )}
          />
        </div>
        <PrevAndContinueButtons backNavigationFunction={backNavigationFunction} />
      </form>
    </main>
  );
};

export default Disclaimer;
