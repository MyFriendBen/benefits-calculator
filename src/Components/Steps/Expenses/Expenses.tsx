import { Fragment, useContext, useMemo } from 'react';
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
import { NumericFormat } from 'react-number-format';
import TextField from '@mui/material/TextField';
import useScreenApi from '../../../Assets/updateScreen';
import useStepForm from '../stepForm';
import './Expenses.css';

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

  const { expenseKeys, expenseIndexMap, categorizedExpenses } = useMemo(() => {
    const categories = Object.entries(expenseOptionsByCategory).filter(([, options]) => Object.keys(options).length > 0);
    const keys = categories.flatMap(([, options]) => Object.keys(options));
    return {
      expenseKeys: keys,
      expenseIndexMap: new Map(keys.map((key, i) => [key, i])),
      categorizedExpenses: categories,
    };
  }, [expenseOptionsByCategory]);

  const expenseRowSchema = z.object({
    expenseSourceName: z.string(),
    expenseAmount: z.number().int().min(0),
    expenseFrequency: z.string(),
  });
  const formSchema = z.object({
    expenses: z.array(expenseRowSchema),
  });
  type FormSchema = z.infer<typeof formSchema>;

  const buildDefaultValues = (): FormSchema => {
    const savedExpenseMap = new Map(formData.expenses.map((e) => [e.expenseSourceName, e]));

    return {
      expenses: expenseKeys.map((key) => {
        const saved = savedExpenseMap.get(key);
        return {
          expenseSourceName: key,
          expenseAmount: saved?.expenseAmount ?? 0,
          expenseFrequency: saved?.expenseFrequency ?? 'monthly',
        };
      }),
    };
  };

  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useStepForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: buildDefaultValues(),
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
          defaultMessage="These are the expenses that can affect your benefits. Enter whole dollar amounts for any expenses your household has."
        />
      </QuestionDescription>
      <form onSubmit={handleSubmit(formSubmitHandler)}>
        <table
          className="expenses-table"
          role="grid"
          aria-label={intl.formatMessage({
            id: 'expenses.table.ariaLabel',
            defaultMessage: 'Household expenses',
          })}
        >
          <thead className="sr-only">
            <tr>
              <th scope="col">
                <FormattedMessage id="expenses.header.type" defaultMessage="Expense Type" />
              </th>
              <th scope="col">
                <FormattedMessage id="expenses.header.amount" defaultMessage="Amount" />
              </th>
              <th scope="col">
                <FormattedMessage id="expenses.header.frequency" defaultMessage="Frequency" />
              </th>
            </tr>
          </thead>
          <tbody>
            {categorizedExpenses.map(([categoryKey, options]) => (
              <Fragment key={categoryKey}>
                <tr className="expense-category-row">
                  <th colSpan={3} scope="colgroup" className="expense-category-label">
                    <FormattedMessage
                      id={`expenses.category.${categoryKey}`}
                      defaultMessage={categoryKey.replace(/([A-Z])/g, ' $1').replace(/^./, (s: string) => s.toUpperCase())}
                    />
                  </th>
                </tr>
                <tr className="expense-column-headers" aria-hidden="true">
                  <td className="expense-col-header">
                    <FormattedMessage id="expenses.header.type" defaultMessage="Expense Type" />
                  </td>
                  <td className="expense-col-header expense-col-header-amount">
                    <FormattedMessage id="expenses.header.amount" defaultMessage="Amount" />
                  </td>
                  <td className="expense-col-header expense-col-header-frequency">
                    <FormattedMessage id="expenses.header.frequency" defaultMessage="Frequency" />
                  </td>
                </tr>
                {Object.entries(options).map(([expenseKey, label]) => {
                  const index = expenseIndexMap.get(expenseKey)!;
                  const plainName = intl.formatMessage({
                    id: `expenseOptions.${expenseKey}`,
                    defaultMessage: expenseKey.replace(/([A-Z])/g, ' $1').replace(/^./, (s: string) => s.toUpperCase()),
                  });
                  return (
                    <tr key={expenseKey} className="expense-row">
                      <td className="expense-name-cell">
                        <label htmlFor={`expense-amount-${expenseKey}`}>{label}</label>
                      </td>
                      <td className="expense-amount-cell">
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
                      </td>
                      <td className="expense-frequency-cell">
                        <Controller
                          name={`expenses.${index}.expenseFrequency`}
                          control={control}
                          render={({ field }) => (
                            <FrequencySelector value={field.value} onChange={field.onChange} expenseName={plainName} />
                          )}
                        />
                      </td>
                    </tr>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
        <PrevAndContinueButtons backNavigationFunction={backNavigationFunction} />
      </form>
    </div>
  );
};

export default Expenses;
