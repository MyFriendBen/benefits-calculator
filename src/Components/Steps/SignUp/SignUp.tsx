import { zodResolver } from '@hookform/resolvers/zod';
import { Checkbox, FormControlLabel, TextField } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { Controller } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';
import InformationalText from '../../Common/InformationalText/InformationalText';
import { FormData } from '../../../Types/FormData';
import { FormattedMessageType } from '../../../Types/Questions';
import { useConfig, useLocalizedLink } from '../../Config/configHook';
import ErrorMessageWrapper from '../../ErrorMessage/ErrorMessageWrapper';
import PrevAndContinueButtons from '../../PrevAndContinueButtons/PrevAndContinueButtons';
import QuestionHeader from '../../QuestionComponents/QuestionHeader';
import QuestionDescription from '../../QuestionComponents/QuestionDescription';
import { useDefaultBackNavigationFunction } from '../../QuestionComponents/questionHooks';
import QuestionQuestion from '../../QuestionComponents/QuestionQuestion';
import { Context } from '../../Wrapper/Wrapper';
import { useParams } from 'react-router-dom';
import { handleNumbersOnly, NUM_PAD_PROPS } from '../../../Assets/numInputHelpers';
import useScreenApi from '../../../Assets/updateScreen';
import './SignUp.css';
import useStepForm from '../stepForm';

function SignUp() {
  const { formData, setFormData } = useContext(Context);
  const { uuid } = useParams();
  const [hasServerError, setHasServerError] = useState(false);
  const { updateUser } = useScreenApi();
  const { formatMessage } = useIntl();
  const backNavigationFunction = useDefaultBackNavigationFunction('signUpInfo');
  const signUpOptions = useConfig<{ [key: string]: FormattedMessageType }>('sign_up_options');
  const privacyPolicyLink = useLocalizedLink('privacy_policy');
  const consentToContactLink = useLocalizedLink('consent_to_contact');

  const contactInfoSchema = z
    .object({
      firstName: z
        .string({
          errorMap: () => {
            return {
              message: formatMessage({
                id: 'validation-helperText.firstName',
                defaultMessage: 'Please enter your first name',
              }),
            };
          },
        })
        .min(1)
        .trim(),
      lastName: z
        .string({
          errorMap: () => {
            return {
              message: formatMessage({
                id: 'validation-helperText.lastName',
                defaultMessage: 'Please enter your last name',
              }),
            };
          },
        })
        .min(1)
        .trim(),
      email: z
        .string({
          errorMap: () => {
            return {
              message: formatMessage({
                id: 'validation-helperText.email',
                defaultMessage: 'Please enter a valid email address',
              }),
            };
          },
        })
        .email()
        .trim()
        .or(z.literal('')),
      cell: z
        .string({
          errorMap: () => {
            return {
              message: formatMessage({
                id: 'validation-helperText.phoneNumber',
                defaultMessage: 'Please enter a 10 digit phone number',
              }),
            };
          },
        })
        .trim()
        .transform((value) => {
          let newString = '';

          for (const char of value) {
            if (/\d/.test(char)) {
              newString += char;
            }
          }

          return newString;
        })
        .refine((value) => value.length === 0 || value.length === 10, {
          message: formatMessage({
            id: 'validation-helperText.phoneNumber',
            defaultMessage: 'Please enter a 10 digit phone number',
          }),
        }),
      tcpa: z.boolean(),
    })
    .refine(({ tcpa, cell }) => tcpa || cell === '', {
      path: ['tcpa'],
      message: formatMessage({ id: 'signUp.checkbox.error', defaultMessage: 'Please check the box to continue.' }),
    })
    .superRefine(({ email, cell }, ctx) => {
      const noEmailAndCell = email.length === 0 && cell.length === 0;
      const message = formatMessage({
        id: 'validation-helperText.noEmailOrPhoneNumber',
        defaultMessage: 'Please enter an email or phone number',
      });

      if (noEmailAndCell) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: message,
          path: ['email'],
        });
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: message,
          path: ['cell'],
        });
        return false;
      }

      return true;
    });

  const someContactType = (contactType: { [key: string]: boolean }) => {
    return Object.values(contactType).some((value) => value);
  };

  const formSchema = z
    .object({
      contactType: z.record(z.string(), z.boolean()),
      contactInfo: contactInfoSchema.optional(),
    })
    .refine((data) => {
      if (formData.signUpInfo.hasUser) {
        return true;
      }

      const { contactType, contactInfo } = data;
      const showContactInfo = someContactType(contactType);

      if (showContactInfo && contactInfo === undefined) {
        return false;
      }

      return true;
    });

  type FormSchema = z.infer<typeof formSchema>;

  const {
    control,
    formState: { errors, isSubmitted },
    getValues,
    setValue,
    handleSubmit,
    trigger,
    watch,
  } = useStepForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contactType: {
        sendOffers: formData.signUpInfo.sendOffers,
        sendUpdates: formData.signUpInfo.sendUpdates,
      },
    },
    questionName: 'signUpInfo',
  });

  const contactType = watch('contactType');

  useEffect(() => {
    if (someContactType(contactType) && !formData.signUpInfo.hasUser) {
      setValue('contactInfo', { firstName: '', lastName: '', email: '', cell: '', tcpa: false });
      if (isSubmitted) {
        trigger('contactInfo');
        setHasServerError(false);
      }
    } else {
      setValue('contactInfo', undefined);
      setHasServerError(false);
    }
  }, [someContactType(contactType), formData.signUpInfo.hasUser]);

  const submitHandler = async (data: FormSchema) => {
    if (uuid === undefined) {
      throw new Error('uuid is not defined');
    }
    setHasServerError(false);

    const newFormData: FormData = {
      ...formData,

      signUpInfo: {
        ...formData.signUpInfo,
        sendOffers: data.contactType.sendOffers,
        sendUpdates: data.contactType.sendUpdates,
      },
    };

    const updatedSignUpInfo = data.contactInfo;

    if (updatedSignUpInfo === undefined && formData.signUpInfo.hasUser === false) {
      return;
    } else if (updatedSignUpInfo !== undefined) {
      const signUpInfo = newFormData.signUpInfo;

      signUpInfo.firstName = updatedSignUpInfo.firstName;
      signUpInfo.lastName = updatedSignUpInfo.lastName;
      signUpInfo.email = updatedSignUpInfo.email;
      signUpInfo.phone = updatedSignUpInfo.cell;
      signUpInfo.commConsent = updatedSignUpInfo.tcpa;
    }

    try {
      await updateUser(newFormData);
      newFormData.signUpInfo.hasUser = true;
      setFormData(newFormData);
    } catch (e) {
      setHasServerError(true);
      throw e;
    }
  };

  return (
    <div>
      <QuestionHeader>
        <FormattedMessage
          id="qcc.optional-sign-up-text"
          defaultMessage="Sign up for benefits updates and/or feedback opportunities."
        />
      </QuestionHeader>
      <QuestionQuestion>
        <FormattedMessage
          id="questions.signUpInfo"
          defaultMessage="OPTIONAL: Would you like us to contact you about either of the following?"
        />
      </QuestionQuestion>
      <QuestionDescription>
        <FormattedMessage
          id="questions.signUpInfo.description"
          defaultMessage="If you do not want to sign up for either of these notifications, please click continue."
        />
      </QuestionDescription>
      <form onSubmit={handleSubmit(submitHandler)}>
        <div>
          {Object.entries(signUpOptions).map(([name, value]) => {
            const rhfName: `contactType.${string}` = `contactType.${name}`;
            return (
              <div className="sign-up-checkbox-container" key={name}>
                <Controller
                  name={rhfName}
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel control={<Checkbox {...field} checked={getValues(rhfName)} />} label={value} />
                  )}
                />
              </div>
            );
          })}
        </div>
        {watch('contactInfo') !== undefined && !formData.signUpInfo.hasUser && (
          <div className="sign-up-contact-info-container">
            <QuestionQuestion>
              <FormattedMessage id="questions.signUpInfo-a" defaultMessage="Please provide your contact info below:" />
            </QuestionQuestion>
            <div className="sign-up-input-row">
              <Controller
                name="contactInfo.firstName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={<FormattedMessage id="signUp.createFirstNameTextfield-label" defaultMessage="First Name" />}
                    variant="outlined"
                    error={errors.contactInfo?.firstName !== undefined}
                    helperText={
                      errors.contactInfo?.firstName !== undefined && (
                        <ErrorMessageWrapper fontSize="1rem">
                          {errors.contactInfo.firstName.message}
                        </ErrorMessageWrapper>
                      )
                    }
                  />
                )}
              />
              <Controller
                name="contactInfo.lastName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={<FormattedMessage id="signUp.createLastNameTextfield-label" defaultMessage="Last Name" />}
                    variant="outlined"
                    error={errors.contactInfo?.lastName !== undefined}
                    helperText={
                      errors.contactInfo?.lastName !== undefined && (
                        <ErrorMessageWrapper fontSize="1rem">{errors.contactInfo.lastName.message}</ErrorMessageWrapper>
                      )
                    }
                  />
                )}
              />
            </div>
            <div className="sign-up-input-row">
              <Controller
                name="contactInfo.email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    onChange={(...args) => {
                      field.onChange(...args);
                      if (isSubmitted) {
                        trigger(['contactInfo.cell', 'contactInfo.email']);
                      }
                    }}
                    label={<FormattedMessage id="signUp.createEmailTextfield-label" defaultMessage="Email" />}
                    variant="outlined"
                    error={errors.contactInfo?.email !== undefined}
                    helperText={
                      errors.contactInfo?.email !== undefined && (
                        <ErrorMessageWrapper fontSize="1rem">{errors.contactInfo.email.message}</ErrorMessageWrapper>
                      )
                    }
                  />
                )}
              />
              <Controller
                name="contactInfo.cell"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={<FormattedMessage id="signUp.createPhoneTextfield-label" defaultMessage="Cell Phone" />}
                    variant="outlined"
                    inputProps={NUM_PAD_PROPS}
                    onChange={handleNumbersOnly((...args) => {
                      field.onChange(...args);
                      if (isSubmitted) {
                        trigger(['contactInfo.cell', 'contactInfo.email', 'contactInfo.tcpa']);
                      }
                    })}
                    error={errors.contactInfo?.cell !== undefined}
                    helperText={
                      errors.contactInfo?.cell !== undefined && (
                        <ErrorMessageWrapper fontSize="1rem">{errors.contactInfo.cell.message}</ErrorMessageWrapper>
                      )
                    }
                  />
                )}
              />
            </div>
            <p className="sign-up-disclaimer-text">
              <FormattedMessage
                id="signUp.displayDisclosureSection-consentText"
                defaultMessage="A copy of your MyFriendBen results will automatically be sent to the email/phone number you provided."
              />
            </p>
            <div>
              <Controller
                name="contactInfo.tcpa"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <>
                    <FormControlLabel
                      control={
                        <Checkbox
                          {...field}
                          checked={getValues('contactInfo.tcpa')}
                          sx={
                            errors.contactInfo?.tcpa !== undefined
                              ? { color: '#c6252b', alignSelf: 'flex-start' }
                              : { alignSelf: 'flex-start' }
                          }
                          onChange={(...args) => {
                            field.onChange(...args);
                            if (isSubmitted) {
                              trigger(['contactInfo.cell', 'contactInfo.tcpa']);
                            }
                          }}
                        />
                      }
                      label={
                        <div className="sign-up-text">
                          <FormattedMessage
                            id="signUp.displayDisclosureSection.tcpa"
                            defaultMessage="I consent to MyFriendBen and its affiliates contacting me via text message to offer additional programs or opportunities that may be of interest to me and my family, for marketing purposes, updates and alerts, and to solicit feedback. I understand that the frequency of these text messages may vary, and that standard message and data costs may apply. Reply HELP for help and STOP to end. View our <tos>Terms of Service</tos> and <privacy>Privacy Policy</privacy>."
                            values={{
                              tos: (chunks: any) => (
                                <a href={consentToContactLink} target="_blank" rel="noopener noreferrer"  className="link-color">
                                  {chunks}
                                </a>
                              ),
                              privacy: (chunks: any) => (
                                <a href={privacyPolicyLink} target="_blank" rel="noopener noreferrer" className="link-color">
                                  {chunks}
                                </a>
                              ),
                            }}
                          />
                        </div>
                      }
                    />
                    {errors.contactInfo?.tcpa && (
                      <ErrorMessageWrapper fontSize="1rem">{errors.contactInfo.tcpa.message}</ErrorMessageWrapper>
                    )}
                  </>
                )}
              />
            </div>
            <div className="sign-up-server-error-container">
              {hasServerError && (
                <ErrorMessageWrapper fontSize="1.5rem">
                  <FormattedMessage
                    id="validation-helperText.serverError"
                    defaultMessage="Please enter a valid email address and/or phone number. This error could also be caused by entering an email address that is already in our system. If the error persists, remember that this question is optional and will not impact your MyFriendBen results. You can skip this question by deselecting the boxes at the top of the page and pressing continue."
                  />
                </ErrorMessageWrapper>
              )}
            </div>
          </div>
        )}
        <PrevAndContinueButtons backNavigationFunction={backNavigationFunction} />
      </form>
    </div>
  );
}

export default SignUp;
