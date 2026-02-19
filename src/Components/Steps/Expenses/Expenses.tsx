import { FormattedMessage, useIntl } from 'react-intl';
import QuestionHeader from '../../QuestionComponents/QuestionHeader';
import HelpButton from '../../HelpBubbleIcon/HelpButton';
import QuestionQuestion from '../../QuestionComponents/QuestionQuestion';
import QuestionDescription from '../../QuestionComponents/QuestionDescription';
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputAdornment,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import { Context } from '../../Wrapper/Wrapper';
import { useContext, useEffect } from 'react';
import { useForm, Controller, SubmitHandler, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import PrevAndContinueButtons from '../../PrevAndContinueButtons/PrevAndContinueButtons';
import { useParams } from 'react-router-dom';
import { useDefaultBackNavigationFunction, useGoToNextStep } from '../../QuestionComponents/questionHooks';
import { useConfig } from '../../Config/configHook';
import { FormattedMessageType } from '../../../Types/Questions';
import ErrorMessageWrapper from '../../ErrorMessage/ErrorMessageWrapper';
import CloseButton from '../../CloseButton/CloseButton';
import AddIcon from '@mui/icons-material/Add';

import { NumericFormat } from 'react-number-format';
import useScreenApi from '../../../Assets/updateScreen';
import { helperText } from '../../HelperText/HelperText';
import './Expenses.css';
import useStepForm from '../stepForm';

const Expenses = () => {
  const { formData } = useContext(Context);
  const { uuid } = useParams();
  const intl = useIntl();
  const translatedAriaLabel = intl.formatMessage({
    id: 'questions.hasExpenses-ariaLabel',
    defaultMessage: 'has expenses',
  });
  const { updateScreen } = useScreenApi();
  const backNavigationFunction = useDefaultBackNavigationFunction('hasExpenses');
  const expenseOptions = useConfig('expense_options') as Record<string, FormattedMessageType>;

  const expenseSourceSchema = z.object({
    expenseSourceName: z
      .string(
        helperText(
          intl.formatMessage({ id: 'errorMessage-expenseType', defaultMessage: 'Please select an expense type' }),
        ),
      )
      .min(1),
    expenseAmount: z
      .number({
        ...helperText(
          intl.formatMessage({
            id: 'errorMessage-greaterThanZero',
            defaultMessage: 'Please enter a number greater than 0',
          }),
        ),
      })
      .int()
      .min(1),
  });
  const expenseSourcesSchema = z.array(expenseSourceSchema);
  const hasExpensesSchema = z.string().regex(/^true|false$/);
  const formSchema = z.object({
    hasExpenses: hasExpensesSchema,
    expenses: expenseSourcesSchema,
  });
  type FormSchema = z.infer<typeof formSchema>;

  const {
    control,
    formState: { errors },
    handleSubmit,
    watch,
    getValues,
  } = useStepForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hasExpenses: formData.hasExpenses ?? 'false',
      expenses: formData.expenses ?? [],
    },
    questionName: 'hasExpenses',
  });

  const watchHasExpenses = watch('hasExpenses');
  const hasTruthyExpenses = watchHasExpenses === 'true';
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'expenses',
  });

  useEffect(() => {
    const noExpensesAreListed = Number(getValues('expenses').length) === 0;
    if (hasTruthyExpenses && noExpensesAreListed) {
      append({
        expenseSourceName: '',
        expenseAmount: 0,
      });
    }

    if (!hasTruthyExpenses) {
      replace([]);
    }
  }, [watchHasExpenses]);

  const formSubmitHandler: SubmitHandler<FormSchema> = async (expensesObject) => {
    if (uuid === undefined) {
      throw new Error('uuid is not defined');
    }

    const updatedFormData = { ...formData, ...expensesObject };
    await updateScreen(updatedFormData);
  };

  const createExpenseMenuItems = (expenseOptions: Record<string, FormattedMessageType>) => {
    const disabledSelectMenuItem = (
      <MenuItem value="select" key="disabled-select-value" disabled>
        <FormattedMessage id="expenseBlock.createExpenseMenuItems-disabledSelectMenuItemText" defaultMessage="Select" />
      </MenuItem>
    );

    const menuItems = Object.entries(expenseOptions).map(([value, message]) => {
      return (
        <MenuItem value={value} key={value}>
          {message}
        </MenuItem>
      );
    });

    return [disabledSelectMenuItem, menuItems];
  };

  const getExpenseSourceLabel = (expenseOptions: Record<string, FormattedMessageType>, expenseSourceName: string) => {
    if (expenseSourceName) {
      return <> ({expenseOptions[expenseSourceName]})</>;
    }
  };

  return (
    <div>
      <QuestionHeader>
        <FormattedMessage id="qcc.about_household" defaultMessage="Tell us about your household" />
      </QuestionHeader>
      <QuestionQuestion>
        <div className="expenses-q-and-help-button">
          <FormattedMessage id="questions.hasExpenses" defaultMessage="Does your household have any expenses?" />
          <HelpButton>
            <FormattedMessage
              id="questions.hasExpenses-description"
              defaultMessage="Add up expenses for everyone who lives in your home. This includes costs like child care, child support, rent, medical expenses, heating bills, and more. We will ask only about expenses that may affect benefits. We will not ask about expenses such as food since grocery bills do not affect benefits."
            />
          </HelpButton>
        </div>
      </QuestionQuestion>
      <QuestionDescription>
        <FormattedMessage
          id="questions.hasExpenses-description-additional"
          defaultMessage="Expenses can affect benefits! We can be more accurate if you tell us key expenses like your rent or mortgage, utilities, and child care."
        />
      </QuestionDescription>
      <form onSubmit={handleSubmit(formSubmitHandler)}>
        <Controller
          name="hasExpenses"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <RadioGroup {...field} aria-label={translatedAriaLabel} className="expense-radiogroup-margin-bottom">
              <FormControlLabel
                value={'true'}
                control={<Radio />}
                label={<FormattedMessage id="radiofield.label-yes" defaultMessage="Yes" />}
              />
              <FormControlLabel
                value={'false'}
                control={<Radio />}
                label={<FormattedMessage id="radiofield.label-no" defaultMessage="No" />}
              />
            </RadioGroup>
          )}
        />
        {fields.map((field, index) => {
          const selectedExpenseSource = watch('expenses')[index].expenseSourceName;
          return (
            <Box className="expense-section-container" key={field.id}>
              {index !== 0 && (
                <div className="delete-button-container">
                  <CloseButton handleClose={() => remove(index)} />
                </div>
              )}
              <Stack className={index % 2 === 0 ? 'expense-section' : ''}>
                <QuestionQuestion>
                  {index === 0 ? (
                    <div className="first-expense-q-padding">
                      <FormattedMessage
                        id="questions.hasExpenses-a"
                        defaultMessage="What type of expense has your household had most recently?"
                      />
                    </div>
                  ) : (
                    <FormattedMessage
                      id="expenseBlock.createExpenseBlockQuestions-questionLabel"
                      defaultMessage="If you have another expense, select it below."
                    />
                  )}
                </QuestionQuestion>
              </Stack>
              <FormControl
                sx={{ m: 1, minWidth: '13.125rem', maxWidth: '100%' }}
                error={!!errors.expenses?.[index]?.expenseSourceName}
                className="expense-section-type"
              >
                <InputLabel id={`expense-type-label-${index}`}>
                  <FormattedMessage
                    id="expenseBlock.createExpenseDropdownMenu-expenseTypeInputLabel"
                    defaultMessage="Expense Type"
                  />
                </InputLabel>
                <Controller
                  name={`expenses.${index}.expenseSourceName`}
                  control={control}
                  render={({ field }) => (
                    <>
                      <Select
                        {...field}
                        labelId={`expense-type-label-${index}`}
                        id={`expenses.${index}.expenseSourceName`}
                        label={
                          <FormattedMessage
                            id="expenseBlock.createExpenseDropdownMenu-expenseTypeSelectLabel"
                            defaultMessage="Expense Type"
                          />
                        }
                        sx={{ backgroundColor: '#fff' }}
                      >
                        {createExpenseMenuItems(expenseOptions)}
                      </Select>
                      {!!errors.expenses?.[index]?.expenseSourceName && (
                        <FormHelperText sx={{ marginLeft: 0 }}>
                          <ErrorMessageWrapper fontSize="1rem">
                            {errors.expenses?.[index]?.expenseSourceName?.message}
                          </ErrorMessageWrapper>
                        </FormHelperText>
                      )}
                    </>
                  )}
                />
              </FormControl>
              <div className="expense-margin-bottom">
                <QuestionQuestion>
                  <FormattedMessage
                    id="expenseBlock.createExpenseAmountTextfield-questionLabel"
                    defaultMessage="How much is this expense every month?"
                  />
                  {getExpenseSourceLabel(expenseOptions, selectedExpenseSource)}
                </QuestionQuestion>
                <div className="expense-block-textfield">
                  <Controller
                    name={`expenses.${index}.expenseAmount`}
                    control={control}
                    render={({ field }) => (
                      <>
                        <NumericFormat
                          value={field.value || ''}
                          onValueChange={({ floatValue }) => field.onChange(floatValue ?? 0)}
                          thousandSeparator
                          allowNegative={false}
                          decimalScale={0}
                          customInput={TextField}
                          label={
                            <FormattedMessage
                              id="expenseBlock.createExpenseAmountTextfield-amountLabel"
                              defaultMessage="Amount"
                            />
                          }
                          variant="outlined"
                          inputProps={{ inputMode: 'decimal' }}
                          sx={{ backgroundColor: '#fff' }}
                          error={!!errors.expenses?.[index]?.expenseAmount}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            sx: { backgroundColor: '#FFFFFF' },
                          }}
                        />
                        {!!errors.expenses?.[index]?.expenseAmount && (
                          <FormHelperText sx={{ marginLeft: 0 }}>
                            <ErrorMessageWrapper fontSize="1rem">
                              {errors.expenses?.[index]?.expenseAmount?.message}
                            </ErrorMessageWrapper>
                          </FormHelperText>
                        )}
                      </>
                    )}
                  />
                </div>
              </div>
            </Box>
          );
        })}
        {hasTruthyExpenses && (
          <Button
            variant="outlined"
            onClick={() =>
              append({
                expenseSourceName: '',
                expenseAmount: 0,
              })
            }
            startIcon={<AddIcon />}
            type="button"
          >
            <FormattedMessage id="expenseBlock.return-addExpenseButton" defaultMessage="Add another expense" />
          </Button>
        )}
        <PrevAndContinueButtons backNavigationFunction={backNavigationFunction} />
      </form>
    </div>
  );
};

export default Expenses;
