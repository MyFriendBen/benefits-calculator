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
import QuestionHeader from '../../QuestionComponents/QuestionHeader';
import { useDefaultBackNavigationFunction } from '../../QuestionComponents/questionHooks';
import QuestionQuestion from '../../QuestionComponents/QuestionQuestion';
import { createMenuItems } from '../../Steps/SelectHelperFunctions/SelectHelperFunctions';
import { Context } from '../../Wrapper/Wrapper';
import { useEnergyFormData } from '../hooks';
import useStepForm from '../../Steps/stepForm';
import { OTHER_ELECTRIC_PROVIDERS, useUtilityProviders } from '../providers';

export default function ElectricityProvider() {
  const { formData } = useContext(Context);
  const energyDataAvailable = useEnergyFormData(formData);
  const { uuid } = useParams();
  const backNavigationFunction = useDefaultBackNavigationFunction('energyCalculatorElectricityProvider');
  const { formatMessage } = useIntl();
  const { updateScreen } = useScreenApi();

  const { providers, hasError: hasProviderError } = useUtilityProviders();

  const providerOptions = useMemo(() => {
    if (providers === undefined || hasProviderError) {
      return {};
    }

    const options: { [key: string]: string | FormattedMessageType } = { ...providers.electric };

    for (const [code, text] of Object.entries(OTHER_ELECTRIC_PROVIDERS)) {
      options[code] = text;
    }

    return options;
  }, [formData.zipcode, providers]);

  const formSchema = z.object({
    electricityProvider: z
      .string()
      .min(1, {
        message: formatMessage({
          id: 'energyCalculator.electricityProvider.errorMessage',
          defaultMessage: 'Please select an electricity provider',
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
            id: 'energyCalculator.electricityProvider.errorMessage',
            defaultMessage: 'Please select an electricity provider',
          }),
        },
      ),
  });

  type FormSchema = z.infer<typeof formSchema>;

  const {
    control,
    formState: { errors },
    handleSubmit,
    trigger,
    getValues,
  } = useStepForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      electricityProvider: formData.energyCalculator?.electricProvider ?? '',
    },
    questionName: 'energyCalculatorElectricityProvider',
  });

  const formSubmitHandler: SubmitHandler<FormSchema> = async ({ electricityProvider }) => {
    if (!uuid) {
      throw new Error('no uuid');
    }
    if (!energyDataAvailable) {
      throw new Error('energy data is not set up');
    }

    const updatedEnergyData: EnergyCalculatorFormData = {
      ...formData.energyCalculator,
      electricProvider: electricityProvider,
      electricProviderName: providers?.electric[electricityProvider] ?? '',
    };

    const updatedFormData: FormData = { ...formData, energyCalculator: updatedEnergyData };
    await updateScreen(updatedFormData);
  };

  useEffect(() => {
    // trigger validation after the providers have loaded
    // this removes any error messages that may have been shown if
    // the user tries to continue before the providers are loaded
    if (providers !== undefined) {
      if (getValues('electricityProvider') === '') {
        return;
      }

      trigger('electricityProvider');
    }
  }, [providerOptions, providers]);

  return (
    <div>
      <QuestionHeader>
        <FormattedMessage
          id="energyCalculator.electricityProvider.header"
          defaultMessage="Tell us about your utilities"
        />
      </QuestionHeader>
      <QuestionQuestion>
        <FormattedMessage
          id="energyCalculator.electricityProvider.question"
          defaultMessage="Who is your electric utility provider?"
        />
      </QuestionQuestion>
      <form onSubmit={handleSubmit(formSubmitHandler)}>
        <FormControl
          sx={{ mt: 1, mb: 2, minWidth: 210, maxWidth: '100%' }}
          error={errors.electricityProvider !== undefined || hasProviderError}
        >
          <InputLabel>
            <FormattedMessage id="energyCalculator.electricityProvider.label" defaultMessage="Electric Provider" />
          </InputLabel>
          <Controller
            name="electricityProvider"
            control={control}
            rules={{ required: true }}
            render={({ field }) => {
              let errorMessage: null | FormattedMessageType = null;
              if (hasProviderError) {
                errorMessage = (
                  <FormHelperText>
                    <FormattedMessage
                      id="energyCalculator.electricityProvider.apiError"
                      defaultMessage="There was an issue loading the electric providers. Please refresh the page."
                    />
                  </FormHelperText>
                );
              } else if (errors.electricityProvider !== undefined) {
                errorMessage = (
                  <FormHelperText>
                    <ErrorMessageWrapper>{errors.electricityProvider.message}</ErrorMessageWrapper>
                  </FormHelperText>
                );
              }

              if (providers === undefined) {
                return (
                  <>
                    <Select
                      value=""
                      label={
                        <FormattedMessage
                          id="energyCalculator.electricityProvider.label"
                          defaultMessage="Electric Provider"
                        />
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
                    label={
                      <FormattedMessage
                        id="energyCalculator.electricityProvider.label"
                        defaultMessage="Electric Provider"
                      />
                    }
                  >
                    {createMenuItems(
                      providerOptions,
                      <FormattedMessage
                        id="energyCalculator.electricityProvider.placeholder"
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
