import { TextField } from '@mui/material';
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

type EmailTextfieldProps = {
  setSnackbar: Dispatch<SetStateAction<{ open: boolean; message: string }>>;
};

const EmailTextfield = ({ setSnackbar }: EmailTextfieldProps) => {
  const { formData } = useContext(Context);
  const { uuid } = useParams();
  const intl = useIntl();
  const { formatMessage } = useIntl();

  const emailFormSchema = z.object({
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
      .trim(),
  });

  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useForm<z.infer<typeof emailFormSchema>>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      email: formData.signUpInfo.email ?? '',
    },
  });

  const emailSubmitHandler = async (data: z.infer<typeof emailFormSchema>) => {
    if (uuid === undefined) {
      throw new Error('uuid is not defined');
    }

    try {
      const snackbarMessage = intl.formatMessage({
        id: 'emailResults.return-signupCompleted-email',
        defaultMessage:
          'A copy of your results have been sent. If you do not see the email in your inbox, please check your spam folder.',
      });

      const messageBody = {
        screen: uuid,
        email: data.email,
        type: 'emailScreen',
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
    <form onSubmit={handleSubmit(emailSubmitHandler)}>
      <div className="flex-direction-column">
        <article className="bottom-margin">
          <FormattedMessage id="emailResults.enter-emailLabel" defaultMessage="Email my results" />
        </article>
        <Controller
          name="email"
          control={control}
          rules={{ required: false }}
          render={({ field }) => (
            <TextField
              {...field}
              label={<FormattedMessage id="signUp.createEmailTextfield-label" defaultMessage="Email" />}
              variant="outlined"
              error={errors.email !== undefined}
              helperText={
                errors.email !== undefined && (
                  <ErrorMessageWrapper>{errors.email.message}</ErrorMessageWrapper>
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

export default EmailTextfield;
