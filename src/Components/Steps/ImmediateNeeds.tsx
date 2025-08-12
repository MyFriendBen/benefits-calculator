import { zodResolver } from '@hookform/resolvers/zod';
import { ReactNode, useContext } from 'react';
import { FormattedMessage } from 'react-intl';
import { useParams } from 'react-router-dom';
import { z } from 'zod';
import useScreenApi from '../../Assets/updateScreen';
import { FormattedMessageType } from '../../Types/Questions';
import { useConfig } from '../Config/configHook';
import MultiSelectTiles from '../OptionCardGroup/MultiSelectTiles';
import PrevAndContinueButtons from '../PrevAndContinueButtons/PrevAndContinueButtons';
import QuestionHeader from '../QuestionComponents/QuestionHeader';
import { useDefaultBackNavigationFunction } from '../QuestionComponents/questionHooks';
import QuestionQuestion from '../QuestionComponents/QuestionQuestion';
import { Context } from '../Wrapper/Wrapper';
import useStepForm from './stepForm';

function ImmediateNeeds() {
  const { formData } = useContext(Context);
  const { uuid } = useParams();
  const formSchema = z.object({
    needs: z.record(z.string(), z.boolean()),
  });
  const { updateScreen } = useScreenApi();

  const immediateNeeds =
    useConfig<Record<string, { text: FormattedMessageType; icon: ReactNode }>>('acute_condition_options');

  const backNavigationFunction = useDefaultBackNavigationFunction('acuteHHConditions');

  type FormSchema = z.infer<typeof formSchema>;

  const { handleSubmit, watch, setValue } = useStepForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      needs: formData.acuteHHConditions,
    },
    questionName: 'acuteHHConditions',
  });

  const submitHandler = async ({ needs }: FormSchema) => {
    if (!uuid) {
      throw new Error('uuid is not defined');
    }

    const newFormData = { ...formData, acuteHHConditions: needs };
    await updateScreen(newFormData);
  };

  return (
    <div>
      <QuestionHeader>
        <FormattedMessage
          id="qcc.tell-us-final-text"
          defaultMessage="Tell us some final information about your household."
        />
      </QuestionHeader>
      <QuestionQuestion>
        <FormattedMessage
          id="questions.acuteHHConditions"
          defaultMessage="Do you want / need information on any of the following resources?"
        />
      </QuestionQuestion>
      <form onSubmit={handleSubmit(submitHandler)}>
        <MultiSelectTiles
          values={watch('needs')}
          onChange={(values) => {
            setValue('needs', values);
          }}
          options={Object.entries(immediateNeeds).map(([value, content]) => {
            return { value: value, text: content.text, icon: content.icon };
          })}
        />
        <PrevAndContinueButtons backNavigationFunction={backNavigationFunction} />
      </form>
    </div>
  );
}

export default ImmediateNeeds;
