import { zodResolver } from '@hookform/resolvers/zod';
import { useContext } from 'react';
import { SubmitHandler } from 'react-hook-form';
import { FormattedMessage } from 'react-intl';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import useScreenApi from '../../../Assets/updateScreen';
import { Expense, FormData } from '../../../Types/FormData';
import MultiSelectTiles, { MultiSelectTileOption } from '../../OptionCardGroup/MultiSelectTiles';
import PrevAndContinueButtons from '../../PrevAndContinueButtons/PrevAndContinueButtons';
import QuestionHeader from '../../QuestionComponents/QuestionHeader';
import { useDefaultBackNavigationFunction } from '../../QuestionComponents/questionHooks';
import QuestionQuestion from '../../QuestionComponents/QuestionQuestion';
import { ReactComponent as Lightbulb } from '../Icons/Lightbulb.svg';
import { ReactComponent as Stove } from '../Icons/Heat.svg';
import { ReactComponent as AcUnit } from '../Icons/AcUnit.svg';
import { Context } from '../../Wrapper/Wrapper';
import QuestionDescription from '../../QuestionComponents/QuestionDescription';
import { FormattedMessageType } from '../../../Types/Questions';
import useStepForm from '../../Steps/stepForm';

const EXPENSE_TYPES = ['heating', 'cooling', 'electricity'] as const;
export type EnergyCalculatorExpenseType = (typeof EXPENSE_TYPES)[number];

export const ENERGY_CALCULATOR_EXPENSE_NAME_MAP: Record<EnergyCalculatorExpenseType, FormattedMessageType> = {
  heating: <FormattedMessage id="energyCalculator.expenses.heating" defaultMessage="Heating" />,
  cooling: <FormattedMessage id="energyCalculator.expenses.cooling" defaultMessage="Cooling" />,
  electricity: <FormattedMessage id="energyCalculator.expenses.electricity" defaultMessage="Electricity" />,
};

const EXPENSE_OPTIONS: MultiSelectTileOption<EnergyCalculatorExpenseType>[] = [
  {
    value: 'heating',
    text: ENERGY_CALCULATOR_EXPENSE_NAME_MAP.heating,
    icon: <Stove className="option-card-icon" />,
  },
  {
    value: 'cooling',
    text: ENERGY_CALCULATOR_EXPENSE_NAME_MAP.cooling,
    icon: <AcUnit className="option-card-lucide-icon" />,
  },
  {
    value: 'electricity',
    text: ENERGY_CALCULATOR_EXPENSE_NAME_MAP.electricity,
    icon: <Lightbulb className="option-card-lucide-icon" />,
  },
];

export default function EnergyCalculatorExpenses() {
  const { formData } = useContext(Context);
  const { uuid } = useParams();
  const backNavigationFunction = useDefaultBackNavigationFunction('energyCalculatorExpenses');
  const { updateScreen } = useScreenApi();
  const navigate = useNavigate();
  const { whiteLabel, setStepLoading } = useContext(Context);

  const formSchema = z.object({
    expenses: z
      .record(z.enum(EXPENSE_TYPES), z.boolean())
      .refine((obj): obj is Required<typeof obj> => EXPENSE_TYPES.every((key) => obj[key] !== undefined)),
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
      expenses: {
        heating: hasExpense('heating'),
        cooling: hasExpense('cooling'),
        electricity: hasExpense('electricity'),
      },
    },
    questionName: 'energyCalculatorExpenses',
  });

  const createExpense = (expenseName: string): Expense => {
    return {
      expenseSourceName: expenseName,
      expenseAmount: '1',
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
          values={watch('expenses')}
          onChange={(values) => {
            setValue('expenses', values);
          }}
          options={EXPENSE_OPTIONS}
        />
        <PrevAndContinueButtons backNavigationFunction={backNavigationFunction} />
      </form>
    </div>
  );
}
