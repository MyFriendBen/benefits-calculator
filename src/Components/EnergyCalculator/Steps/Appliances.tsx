import { FormattedMessage } from 'react-intl';
import QuestionHeader from '../../QuestionComponents/QuestionHeader';
import QuestionQuestion from '../../QuestionComponents/QuestionQuestion';
import QuestionDescription from '../../QuestionComponents/QuestionDescription';
import MultiSelectTiles from '../../OptionCardGroup/MultiSelectTiles';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitHandler } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { ReactComponent as WaterHeater } from '../Icons/WaterHeater.svg';
import { ReactComponent as AirConditioner } from '../Icons/AcUnit.svg';
import { ReactComponent as Stove } from '../Icons/Stove.svg';
import PrevAndContinueButtons from '../../PrevAndContinueButtons/PrevAndContinueButtons';
import { useDefaultBackNavigationFunction } from '../../QuestionComponents/questionHooks';
import { useContext } from 'react';
import { Context } from '../../Wrapper/Wrapper';
import useScreenApi from '../../../Assets/updateScreen';
import { useEnergyFormData } from '../hooks';
import useStepForm from '../../Steps/stepForm';

export const applianceStatusOptions = {
  needsWaterHeater: {
    icon: <WaterHeater className="option-card-icon" />,
    text: <FormattedMessage id="applianceStatusOptions.needsWaterHeater" defaultMessage="Water Heater" />,
  },
  needsHvac: {
    icon: <AirConditioner className="option-card-icon" />,
    text: (
      <FormattedMessage id="applianceStatusOptions.needsHvac" defaultMessage="Heating, ventilation, and/or cooling" />
    ),
  },
  needsStove: {
    icon: <Stove className="option-card-icon" />,
    text: <FormattedMessage id="applianceStatusOptions.needsStove" defaultMessage="Cooking stove/range" />,
  },
};

const Appliances = () => {
  const { formData } = useContext(Context);
  const { uuid } = useParams();
  const { updateScreen } = useScreenApi();
  const energyDataAvailable = useEnergyFormData(formData);
  const backNavigationFunction = useDefaultBackNavigationFunction('energyCalculatorApplianceStatus');

  const formSchema = z.object({
    energyCalculator: z.object({
      needsWaterHeater: z.boolean(),
      needsHvac: z.boolean(),
      needsStove: z.boolean(),
    }),
  });

  type FormSchema = z.infer<typeof formSchema>;

  const { handleSubmit, watch, setValue } = useStepForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      energyCalculator: {
        needsWaterHeater: formData.energyCalculator?.needsWaterHeater ?? false,
        needsHvac: formData.energyCalculator?.needsHvac ?? false,
        needsStove: formData.energyCalculator?.needsStove ?? false,
      },
    },
    questionName: 'energyCalculatorApplianceStatus',
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
        <FormattedMessage id="questions.energyCalculator-appliances" defaultMessage="Tell us about your appliances" />
      </QuestionHeader>
      <QuestionQuestion>
        <FormattedMessage
          id="questions.energyCalculator-appliances-subquestion"
          defaultMessage="Do you have appliances you are considering replacing, or are broken and in need of replacement?"
        />
      </QuestionQuestion>
      <QuestionDescription>
        <FormattedMessage
          id="questions.energyCalculator-appliances-q-desc"
          defaultMessage="Select all that apply. Your selection(s) will help surface programs about rebates and incentives that can assist you in future purchases."
        />
      </QuestionDescription>
      <form onSubmit={handleSubmit(formSubmitHandler)}>
        <MultiSelectTiles
          options={Object.entries(applianceStatusOptions).map(([key, option]) => ({
            value: key,
            text: option.text,
            icon: option.icon,
          }))}
          values={
            watch('energyCalculator') || {
              needsWaterHeater: false,
              needsHvac: false,
              needsStove: false,
            }
          }
          onChange={(newValues) => {
            // Cast to the expected type structure to satisfy TypeScript
            const typedValues = {
              needsWaterHeater: newValues.needsWaterHeater || false,
              needsHvac: newValues.needsHvac || false,
              needsStove: newValues.needsStove || false,
            };
            setValue('energyCalculator', typedValues, { shouldValidate: true, shouldDirty: true });
          }}
        />
        <PrevAndContinueButtons backNavigationFunction={backNavigationFunction} />
      </form>
    </>
  );
};
export default Appliances;
