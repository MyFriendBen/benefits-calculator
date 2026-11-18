import { zodResolver } from '@hookform/resolvers/zod';
import { ReactNode, useContext } from 'react';
import { SubmitHandler } from 'react-hook-form';
import { FormattedMessage } from 'react-intl';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import useScreenApi from '../../../Assets/updateScreen';
import { Expense, FormData } from '../../../Types/FormData';
import MultiSelectTiles, { MultiSelectTileOption } from '../../SelectTiles/MultiSelectTiles';
import PrevAndContinueButtons from '../../PrevAndContinueButtons/PrevAndContinueButtons';
import QuestionHeader from '../../QuestionComponents/QuestionHeader';
import { useDefaultBackNavigationFunction } from '../../QuestionComponents/questionHooks';
import QuestionQuestion from '../../QuestionComponents/QuestionQuestion';
import { Context } from '../../Wrapper/Wrapper';
import QuestionDescription from '../../QuestionComponents/QuestionDescription';
import { FormattedMessageType } from '../../../Types/Questions';
import useStepForm from '../../Steps/stepForm';
import { useConfig } from '../../Config/configHook';

type EnergyCalculatorExpenseOption = { icon: ReactNode; text: FormattedMessageType };

/**
 * The utility expenses the energy calculator asks about, as option cards, in the order benefits-api
 * serves them (`energy_calculator_expense_options` in configuration/white_labels/cesn.py).
 */
export function useEnergyCalculatorExpenseOptions(): Record<string, EnergyCalculatorExpenseOption> {
  return useConfig<Record<string, EnergyCalculatorExpenseOption>>('energy_calculator_expense_options', {});
}

export default function EnergyCalculatorExpenses() {
  const { formData } = useContext(Context);
  const { uuid } = useParams();
  const backNavigationFunction = useDefaultBackNavigationFunction('energyCalculatorExpenses');
  const { updateScreen } = useScreenApi();
  const navigate = useNavigate();
  const { whiteLabel, setStepLoading } = useContext(Context);
  const expenseOptions = useEnergyCalculatorExpenseOptions();
  const expenseTypes = Object.keys(expenseOptions);

  const formSchema = z.object({
    expenses: z.record(z.string(), z.boolean()).refine((obj) => expenseTypes.every((key) => obj[key] !== undefined)),
  });

  const hasExpense = (expenseName: string) => {
    for (const expense of formData.expenses) {
      if (expense.expenseSourceName === expenseName) {
        return true;
      }
    }

    return false;
  };

  type FormSchema = z.infer<typeof formSchema>;

  const { handleSubmit, watch, setValue } = useStepForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      expenses: Object.fromEntries(expenseTypes.map((type) => [type, hasExpense(type)])),
    },
    questionName: 'energyCalculatorExpenses',
  });

  const createExpense = (expenseName: string): Expense => {
    return {
      expenseSourceName: expenseName,
      expenseAmount: 1,
      expenseFrequency: 'monthly',
    };
  };

  const formSubmitHandler: SubmitHandler<FormSchema> = async ({ expenses }) => {
    if (!uuid) {
      throw new Error('no uuid');
    }

    const updatedExpenses: Expense[] = [];

    for (const [expenseName, hasExpense] of Object.entries(expenses)) {
      if (hasExpense) {
        updatedExpenses.push(createExpense(expenseName));
      }
    }

    const updatedFormData: FormData = { ...formData, expenses: updatedExpenses };
    await updateScreen(updatedFormData);
  };

  return (
    <div>
      <QuestionHeader>
        <FormattedMessage id="qcc.about_household" defaultMessage="Tell us about your household" />
      </QuestionHeader>
      <QuestionQuestion>
        <FormattedMessage
          id="energyCalculator.expenses.question"
          defaultMessage="Are any of the following utility bills in your name or another household member's name"
        />
      </QuestionQuestion>
      <QuestionDescription>
        <FormattedMessage
          id="energyCalculator.expenses.description"
          defaultMessage="Do not select if the bills are rolled into your rent. Select all that apply."
        />
      </QuestionDescription>
      <form onSubmit={handleSubmit(formSubmitHandler)}>
        <MultiSelectTiles
          variant="square"
          values={watch('expenses')}
          onChange={(values) => {
            setValue('expenses', values);
          }}
          options={expenseTypes.map(
            (type): MultiSelectTileOption<string> => ({
              value: type,
              text: expenseOptions[type].text,
              icon: expenseOptions[type].icon,
            }),
          )}
        />
        <PrevAndContinueButtons backNavigationFunction={backNavigationFunction} />
      </form>
    </div>
  );
}
