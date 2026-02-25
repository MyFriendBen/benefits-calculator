import { TextField } from '@mui/material';
import { PatternFormat } from 'react-number-format';
import { Controller, useForm } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import ErrorMessageWrapper from '../ErrorMessage/ErrorMessageWrapper';
import { useParams } from 'react-router-dom';
import { Dispatch, SetStateAction, useContext } from 'react';
import { z } from 'zod';
import { Context } from '../Wrapper/Wrapper';
import { zodResolver } from '@hookform/resolvers/zod';
import { postMessage } from '../../apiCalls';
import './SaveMyResultsModal.css';

type PhoneTextfieldProps = {
  setSnackbar: Dispatch<SetStateAction<{ open: boolean; message: string }>>;
};

const PhoneTextfield = ({ setSnackbar }: PhoneTextfieldProps) => {
  const { formData } = useContext(Context);
  const { uuid } = useParams();
  const intl = useIntl();
  const { formatMessage } = useIntl();

  const phoneFormSchema = z.object({
    phone: z
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
      .refine((value) => value.length === 10, {
        message: formatMessage({
          id: 'validation-helperText.phoneNumber',
          defaultMessage: 'Please enter a 10 digit phone number',
        }),
      }),
  });

  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useForm<z.infer<typeof phoneFormSchema>>({
    resolver: zodResolver(phoneFormSchema),
    defaultValues: {
      phone: formData.signUpInfo.phone ?? '',
    },
  });

  const phoneSubmitHandler = async (data: z.infer<typeof phoneFormSchema>) => {
    if (uuid === undefined) {
      throw new Error('uuid is not defined');
    }

    try {
      const snackbarMessage = intl.formatMessage({
        id: 'emailResults.return-signupCompleted',
        defaultMessage: 'A copy of your results have been sent.',
      });

      const messageBody = {
        screen: uuid,
        phone: data.phone,
        type: 'textScreen',
      };
      await postMessage(messageBody);
      setSnackbar({ open: true, message: snackbarMessage });
    } catch (error) {
      const snackbarMessage = intl.formatMessage({
        id: 'emailResults.error',
        defaultMessage: 'An error occurred on our end, please try submitting again.',
      });
      setSnackbar({ open: true, message: snackbarMessage });
    }
  };

  return (
    <form onSubmit={handleSubmit(phoneSubmitHandler)}>
      <div className="flex-direction-column">
        <article className="bottom-margin">
          <FormattedMessage id="emailResults.enter-phoneNumberLabel" defaultMessage="Text my results" />
        </article>
        <Controller
          name="phone"
          control={control}
          rules={{ required: false }}
          render={({ field }) => (
            <PatternFormat
              value={field.value}
              onValueChange={({ value }) => field.onChange(value)}
              name={field.name}
              onBlur={field.onBlur}
              format="(###) ###-####"
              mask="_"
              customInput={TextField}
              label={<FormattedMessage id="signUp.createPhoneTextfield-label" defaultMessage="Cell Phone" />}
              variant="outlined"
              inputProps={{ inputMode: 'numeric' }}
              error={errors.phone !== undefined}
              helperText={
                errors.phone !== undefined && (
                  <ErrorMessageWrapper fontSize="1rem">{errors.phone.message}</ErrorMessageWrapper>
                )
              }
              sx={{ mb: '1rem' }}
            />
          )}
        />
        <button className="send-button" type="submit">
          <FormattedMessage id="emailResults.sendButton" defaultMessage="Send" />
        </button>
      </div>
    </form>
  );
};

export default PhoneTextfield;
