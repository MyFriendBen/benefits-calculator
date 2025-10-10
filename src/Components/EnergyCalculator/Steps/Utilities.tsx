import { FormattedMessage } from 'react-intl';
import QuestionHeader from '../../QuestionComponents/QuestionHeader';
import QuestionQuestion from '../../QuestionComponents/QuestionQuestion';
import QuestionDescription from '../../QuestionComponents/QuestionDescription';
import MultiSelectTiles from '../../OptionCardGroup/MultiSelectTiles';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitHandler } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { ReactComponent as LightbulbOff } from '../Icons/LightbulbOff.svg';
import { ReactComponent as FileWarning } from '../Icons/FileWarning.svg';
import { ReactComponent as Car } from '../Icons/Car.svg';
import PrevAndContinueButtons from '../../PrevAndContinueButtons/PrevAndContinueButtons';
import { useDefaultBackNavigationFunction } from '../../QuestionComponents/questionHooks';
import { useContext } from 'react';
import { Context } from '../../Wrapper/Wrapper';
import useScreenApi from '../../../Assets/updateScreen';
import { useEnergyFormData } from '../hooks';
import useStepForm from '../../Steps/stepForm';

const Utilities = () => {
  const { formData } = useContext(Context);
  const { uuid } = useParams();
  const { updateScreen } = useScreenApi();
  const energyDataAvailable = useEnergyFormData(formData);
  const backNavigationFunction = useDefaultBackNavigationFunction('energyCalculatorUtilityStatus');

  const utilityStatusOptions = {
    electricityIsDisconnected: {
      icon: <LightbulbOff className="option-card-lucide-icon" />,
      text: (
        <FormattedMessage
          id="utilityStatusOptions.electricityIsDisconnected"
          defaultMessage="Your electricity and/or gas is currently disconnected."
        />
      ),
    },
    hasPastDueEnergyBills: {
      icon: <FileWarning className="option-card-lucide-icon" />,
      text: (
        <FormattedMessage
          id="utilityStatusOptions.hasPastDueEnergyBills"
          defaultMessage="You have a past-due electric or heating bill or you are low on fuel."
        />
      ),
    },
    hasOldCar: {
      icon: <Car className="option-card-lucide-icon" />,
      text: (
        <FormattedMessage
          id="utilityStatusOptions.oldCar"
          defaultMessage="You have a gas or diesel-powered vehicle that is 12+ years old or has failed an emissions test."
        />
      ),
    },
  };

  const formSchema = z.object({
    energyCalculator: z.object({
      electricityIsDisconnected: z.boolean(),
      hasPastDueEnergyBills: z.boolean(),
      hasOldCar: z.boolean(),
    }),
  });

  type FormSchema = z.infer<typeof formSchema>;

  const { handleSubmit, watch, setValue } = useStepForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      energyCalculator: {
        electricityIsDisconnected: formData.energyCalculator?.electricityIsDisconnected ?? false,
        hasPastDueEnergyBills: formData.energyCalculator?.hasPastDueEnergyBills ?? false,
        hasOldCar: formData.energyCalculator?.hasOldCar ?? false,
      },
    },
    questionName: 'energyCalculatorUtilityStatus',
  });

  const formSubmitHandler: SubmitHandler<FormSchema> = async (rhfData) => {
    if (uuid === undefined) {
      throw new Error('uuid is not defined');
    }

    if (!energyDataAvailable) {
      throw new Error('energy data is not set up');
    }

    const updatedEnergyCalculatorData = { ...formData.energyCalculator, ...rhfData.energyCalculator };
    const updatedFormData = { ...formData, energyCalculator: updatedEnergyCalculatorData };
    await updateScreen(updatedFormData);
  };

  return (
    <>
      <QuestionHeader>
        <FormattedMessage
          id="qcc.tell-us-final-text"
          defaultMessage="Tell us some final information about your household."
        />
      </QuestionHeader>
      <QuestionQuestion>
        <FormattedMessage
          id="questions.energyCalculator-utilities-subquestion"
          defaultMessage="Do any of the following apply to your household?"
        />
      </QuestionQuestion>
      <QuestionDescription>
        <FormattedMessage id="questions.energyCalculator-utilities-q-desc" defaultMessage="Select all that apply." />
      </QuestionDescription>
      <form onSubmit={handleSubmit(formSubmitHandler)}>
        <MultiSelectTiles
          options={Object.entries(utilityStatusOptions).map(([key, option]) => ({
            value: key,
            text: option.text,
            icon: option.icon,
          }))}
          values={
            watch('energyCalculator') || {
              electricityIsDisconnected: false,
              hasPastDueEnergyBills: false,
              hasOldCar: false,
            }
          }
          onChange={(newValues) => {
            // Cast to the expected type structure to satisfy TypeScript
            const typedValues = {
              electricityIsDisconnected: newValues.electricityIsDisconnected || false,
              hasPastDueEnergyBills: newValues.hasPastDueEnergyBills || false,
              hasOldCar: newValues.hasOldCar || false,
            };
            setValue('energyCalculator', typedValues, { shouldValidate: true, shouldDirty: true });
          }}
        />
        <PrevAndContinueButtons backNavigationFunction={backNavigationFunction} />
      </form>
    </>
  );
};
export default Utilities;
