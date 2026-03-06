import { zodResolver } from '@hookform/resolvers/zod';
import { FormControl, FormHelperText, InputLabel, MenuItem, Select } from '@mui/material';
import { useContext, useEffect, useMemo } from 'react';
import { Controller, SubmitHandler } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';
import { z } from 'zod';
import useScreenApi from '../../../Assets/updateScreen';
import { EnergyCalculatorFormData, FormData } from '../../../Types/FormData';
import { FormattedMessageType } from '../../../Types/Questions';
import ErrorMessageWrapper from '../../ErrorMessage/ErrorMessageWrapper';
import PrevAndContinueButtons from '../../PrevAndContinueButtons/PrevAndContinueButtons';
import QuestionDescription from '../../QuestionComponents/QuestionDescription';
import QuestionHeader from '../../QuestionComponents/QuestionHeader';
import { useDefaultBackNavigationFunction } from '../../QuestionComponents/questionHooks';
import QuestionQuestion from '../../QuestionComponents/QuestionQuestion';
import { createMenuItems } from '../../Steps/SelectHelperFunctions/SelectHelperFunctions';
import { Context } from '../../Wrapper/Wrapper';
import { OTHER_GAS_PROVIDERS, useUtilityProviders } from '../providers';
import { useEnergyFormData } from '../hooks';
import useStepForm from '../../Steps/stepForm';

export default function GasProvider() {
  const { formData } = useContext(Context);
  const energyDataAvailable = useEnergyFormData(formData);
  const { uuid } = useParams();
  const backNavigationFunction = useDefaultBackNavigationFunction('energyCalculatorGasProvider');
  const { formatMessage } = useIntl();
  const { updateScreen } = useScreenApi();

  const { providers, hasError: hasProviderError } = useUtilityProviders();

  const providerOptions = useMemo(() => {
    if (providers === undefined || hasProviderError) {
      return {};
    }

    const options: { [key: string]: string | FormattedMessageType } = { ...providers.gas };

    for (const [code, text] of Object.entries(OTHER_GAS_PROVIDERS)) {
      options[code] = text;
    }

    return options;
  }, [formData.zipcode, providers]);

  const formSchema = z.object({
    gasProvider: z
      .string()
      .min(1, {
        message: formatMessage({
          id: 'energyCalculator.gasProvider.errorMessage',
          defaultMessage: 'Please select a heating source',
        }),
      })
      .refine(
        (provider) => {
          // make sure that the providers are loaded
          if (providers === undefined || hasProviderError) {
            return false;
          }

          return provider in providerOptions;
        },
        {
          message: formatMessage({
            id: 'energyCalculator.gasProvider.errorMessage',
            defaultMessage: 'Please select a heating source',
          }),
        },
      ),
  });

  type FormSchema = z.infer<typeof formSchema>;

  const {
    control,
    formState: { errors },
    trigger,
    handleSubmit,
    getValues,
  } = useStepForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gasProvider: formData.energyCalculator?.gasProvider ?? '',
    },
    questionName: 'energyCalculatorGasProvider',
  });

  const formSubmitHandler: SubmitHandler<FormSchema> = async ({ gasProvider }) => {
    if (!uuid) {
      throw new Error('no uuid');
    }
    if (!energyDataAvailable) {
      throw new Error('energy data is not set up');
    }

    const updatedEnergyData: EnergyCalculatorFormData = {
      ...formData.energyCalculator,
      gasProvider: gasProvider,
      gasProviderName: providers?.gas[gasProvider] ?? '',
    };

    const updatedFormData: FormData = { ...formData, energyCalculator: updatedEnergyData };
    await updateScreen(updatedFormData);
  };

  useEffect(() => {
    // trigger validation after the providers have loaded
    // this removes any error messages that may have been shown if
    // the user tries to continue before the providers are loaded
    if (providers !== undefined) {
      if (getValues('gasProvider') === '') {
        return;
      }

      trigger('gasProvider');
    }
  }, [providerOptions, providers]);

  return (
    <div>
      <QuestionHeader>
        <FormattedMessage id="energyCalculator.gasProvider.header" defaultMessage="Tell us about your utilities" />
      </QuestionHeader>
      <QuestionQuestion>
        <FormattedMessage
          id="energyCalculator.gasProvider.question"
          defaultMessage="What is your home's heating source?"
        />
      </QuestionQuestion>
      <QuestionDescription>
        <FormattedMessage
          id="energyCalculator.gasProvider.description"
          defaultMessage="If you heat your home with gas or electricity, please select your provider."
        />
      </QuestionDescription>
      <form onSubmit={handleSubmit(formSubmitHandler)}>
        <FormControl
          sx={{ mt: 1, mb: 2, minWidth: 210, maxWidth: '100%' }}
          error={errors.gasProvider !== undefined || hasProviderError}
        >
          <InputLabel>
            <FormattedMessage id="energyCalculator.gasProvider.label" defaultMessage="Heating Source" />
          </InputLabel>
          <Controller
            name="gasProvider"
            control={control}
            rules={{ required: true }}
            render={({ field }) => {
              let errorMessage: null | FormattedMessageType = null;
              if (hasProviderError) {
                errorMessage = (
                  <FormHelperText>
                    <FormattedMessage
                      id="energyCalculator.gasProvider.apiError"
                      defaultMessage="There was an issue loading the gas providers. Please refresh the page."
                    />
                  </FormHelperText>
                );
              } else if (errors.gasProvider !== undefined) {
                errorMessage = (
                  <FormHelperText>
                    <ErrorMessageWrapper>{errors.gasProvider.message}</ErrorMessageWrapper>
                  </FormHelperText>
                );
              }

              if (providers === undefined) {
                return (
                  <>
                    <Select
                      value=""
                      label={
                        <FormattedMessage id="energyCalculator.gasProvider.label" defaultMessage="Heating Source" />
                      }
                    >
                      <MenuItem value="loading" disabled>
                        <FormattedMessage id="energyCalculator.gasProvider.loading" defaultMessage="Loading" />
                      </MenuItem>
                    </Select>
                    {errorMessage}
                  </>
                );
              }

              return (
                <>
                  <Select
                    {...field}
                    label={<FormattedMessage id="energyCalculator.gasProvider.label" defaultMessage="Heating Source" />}
                  >
                    {createMenuItems(
                      providerOptions,
                      <FormattedMessage
                        id="energyCalculator.gasProvider.placeholder"
                        defaultMessage="Select a provider"
                      />,
                    )}
                  </Select>
                  {errorMessage}
                </>
              );
            }}
          />
        </FormControl>
        <PrevAndContinueButtons backNavigationFunction={backNavigationFunction} />
      </form>
    </div>
  );
}
