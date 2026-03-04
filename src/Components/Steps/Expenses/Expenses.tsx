import { useContext, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { InputAdornment } from '@mui/material';
import QuestionHeader from '../../QuestionComponents/QuestionHeader';
import QuestionQuestion from '../../QuestionComponents/QuestionQuestion';
import QuestionDescription from '../../QuestionComponents/QuestionDescription';
import PrevAndContinueButtons from '../../PrevAndContinueButtons/PrevAndContinueButtons';
import FrequencySelector from './FrequencySelector';
import { Context } from '../../Wrapper/Wrapper';
import { useParams } from 'react-router-dom';
import { useDefaultBackNavigationFunction } from '../../QuestionComponents/questionHooks';
import { useConfig } from '../../Config/configHook';
import { FormattedMessageType } from '../../../Types/Questions';
import { ExpenseFrequency } from '../../../Types/FormData';
import { NumericFormat } from 'react-number-format';
import TextField from '@mui/material/TextField';
import useScreenApi from '../../../Assets/updateScreen';
import useStepForm from '../stepForm';
import { camelCaseToTitleCase } from '../../../utils/camelCaseToTitleCase';
import './Expenses.css';

// Schemas are stable and don't depend on component state — defined at module scope
// to avoid recreating them on every render.
const expenseRowSchema = z.object({
  expenseSourceName: z.string(),
  expenseAmount: z.number().int().min(0),
  expenseFrequency: z.enum(['monthly', 'yearly']),
});
const formSchema = z.object({
  expenses: z.array(expenseRowSchema),
});
type FormSchema = z.infer<typeof formSchema>;

const Expenses = () => {
  const { formData } = useContext(Context);
  const { uuid } = useParams();
  const intl = useIntl();
  const { updateScreen } = useScreenApi();
  const backNavigationFunction = useDefaultBackNavigationFunction('hasExpenses');
  const expenseOptionsByCategory = useConfig('expense_options_by_category') as Record<
    string,
    Record<string, FormattedMessageType>
  >;

  // Pre-build the flat key list, index map, and per-row plain names in one pass.
  // expenseIndexMap keys are the same keys being iterated in the JSX below,
  // so expenseIndexMap.get(expenseKey) is always defined — the ! assertion is safe.
  const { expenseKeys, expenseIndexMap, categorizedExpenses } = useMemo(() => {
    const categories = Object.entries(expenseOptionsByCategory).filter(([, options]) => Object.keys(options).length > 0);
    const keys = categories.flatMap(([, options]) => Object.keys(options));
    return {
      expenseKeys: keys,
      expenseIndexMap: new Map(keys.map((key, i) => [key, i])),
      categorizedExpenses: categories.map(([categoryKey, options]) => ({
        categoryKey,
        options: Object.entries(options).map(([expenseKey, label]) => ({
          expenseKey,
          label,
          // Pre-compute the plain-text name used for the frequency toggle aria-label.
          plainName: intl.formatMessage(
            { id: `expenseOptions.${expenseKey}`, defaultMessage: camelCaseToTitleCase(expenseKey) },
          ),
        })),
        categoryLabel: intl.formatMessage(
          { id: `expenses.category.${categoryKey}`, defaultMessage: camelCaseToTitleCase(categoryKey) },
        ),
      })),
    };
  }, [expenseOptionsByCategory, intl]);

  const {
    control,
    formState: { errors },
    handleSubmit,
    watch,
  } = useStepForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      expenses: expenseKeys.map((key) => {
        const saved = formData.expenses.find((e) => e.expenseSourceName === key);
        return {
          expenseSourceName: key,
          expenseAmount: saved?.expenseAmount ?? 0,
          expenseFrequency: (saved?.expenseFrequency ?? 'monthly') as ExpenseFrequency,
        };
      }),
    },
    questionName: 'hasExpenses',
  });

  const formSubmitHandler: SubmitHandler<FormSchema> = async (data) => {
    if (uuid === undefined) {
      throw new Error('uuid is not defined');
    }

    const nonZeroExpenses = data.expenses.filter((e) => e.expenseAmount > 0);

    const updatedFormData = {
      ...formData,
      hasExpenses: nonZeroExpenses.length > 0 ? 'true' : 'false',
      expenses: nonZeroExpenses,
    };

    await updateScreen(updatedFormData);
  };

  return (
    <div>
      <QuestionHeader>
        <FormattedMessage id="qcc.about_household" defaultMessage="Tell us about your household" />
      </QuestionHeader>
      <QuestionQuestion>
        <FormattedMessage id="expenses.header.question" defaultMessage="Which of the following expenses does your household have?" />
      </QuestionQuestion>
      <QuestionDescription>
        <FormattedMessage
          id="expenses.header.description"
          defaultMessage="These are the expenses that can affect your benefits. Enter whole dollar amounts for any expenses your household has. If you're unsure of the exact amount, enter an estimate rather than leaving it as $0."
        />
      </QuestionDescription>
      <form onSubmit={handleSubmit(formSubmitHandler)}>
        <div className="expenses-list">
          {categorizedExpenses.map(({ categoryKey, categoryLabel, options }) => (
            <div key={categoryKey} className="expense-category">
              <div className="expense-category-header">
                <h3 className="expense-category-label">{categoryLabel}</h3>
                <span className="expense-col-header" aria-hidden="true">
                  <FormattedMessage id="expenses.header.amount" defaultMessage="Amount" />
                </span>
                <span className="expense-col-header" aria-hidden="true">
                  <FormattedMessage id="expenses.header.frequency" defaultMessage="Frequency" />
                </span>
              </div>
              {options.map(({ expenseKey, label, plainName }) => {
                const index = expenseIndexMap.get(expenseKey)!; // always defined — map is built from same keys
                const amount = watch(`expenses.${index}.expenseAmount`);
                return (
                  <div key={expenseKey} className={`expense-row${amount > 0 ? ' expense-row--active' : ''}`}>
                    <label htmlFor={`expense-amount-${expenseKey}`} className="expense-name-cell">{label}</label>
                    <div className="expense-amount-cell">
                      <Controller
                        name={`expenses.${index}.expenseAmount`}
                        control={control}
                        render={({ field }) => (
                          <NumericFormat
                            value={field.value === 0 ? '' : field.value}
                            onValueChange={({ floatValue }) => field.onChange(floatValue ?? 0)}
                            thousandSeparator
                            allowNegative={false}
                            decimalScale={0}
                            customInput={TextField}
                            id={`expense-amount-${expenseKey}`}
                            inputProps={{ inputMode: 'numeric' }}
                            size="small"
                            placeholder="0"
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>,
                              sx: { backgroundColor: '#ffffff' },
                            }}
                            error={!!errors.expenses?.[index]?.expenseAmount}
                            helperText={errors.expenses?.[index]?.expenseAmount?.message}
                            sx={{ width: '9rem' }}
                          />
                        )}
                      />
                    </div>
                    <div className="expense-frequency-cell">
                      <Controller
                        name={`expenses.${index}.expenseFrequency`}
                        control={control}
                        render={({ field }) => (
                          <FrequencySelector value={field.value} onChange={field.onChange} expenseName={plainName} />
                        )}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <PrevAndContinueButtons backNavigationFunction={backNavigationFunction} />
      </form>
    </div>
  );
};

export default Expenses;
