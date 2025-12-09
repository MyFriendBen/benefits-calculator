import { FormattedMessage, useIntl } from 'react-intl';
import QuestionHeader from '../../QuestionComponents/QuestionHeader';
import HelpButton from '../../HelpBubbleIcon/HelpButton';
import QuestionQuestion from '../../QuestionComponents/QuestionQuestion';
import QuestionDescription from '../../QuestionComponents/QuestionDescription';
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import { Context } from '../../Wrapper/Wrapper';
import { useContext } from 'react';
import { Controller, SubmitHandler, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import PrevAndContinueButtons from '../../PrevAndContinueButtons/PrevAndContinueButtons';
import { useParams } from 'react-router-dom';
import { useDefaultBackNavigationFunction } from '../../QuestionComponents/questionHooks';
import { useConfig } from '../../Config/configHook';
import { FormattedMessageType } from '../../../Types/Questions';
import ErrorMessageWrapper from '../../ErrorMessage/ErrorMessageWrapper';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { NUM_PAD_PROPS, handleNumbersOnly } from '../../../Assets/numInputHelpers';
import useScreenApi from '../../../Assets/updateScreen';
import { helperText } from '../../HelperText/HelperText';
import './Expenses.css';
import '../HouseholdMembers/styles/HouseholdMemberSections.css';
import useStepForm from '../stepForm';
import { getDefaultFormItems } from '../../../Assets/formDefaultHelpers';

const Expenses = () => {
  const { formData } = useContext(Context);
  const { uuid } = useParams();
  const intl = useIntl();
  const { updateScreen } = useScreenApi();
  const backNavigationFunction = useDefaultBackNavigationFunction('hasExpenses');
  const expenseOptions = useConfig('expense_options') as Record<string, FormattedMessageType>;

  // Hardcoded frequency options: Daily, Weekly, Monthly, Annually
  const frequencyOptions: Record<string, FormattedMessageType> = {
    daily: <FormattedMessage id="expenseFrequency.daily" defaultMessage="Daily" />,
    weekly: <FormattedMessage id="expenseFrequency.weekly" defaultMessage="Weekly" />,
    monthly: <FormattedMessage id="expenseFrequency.monthly" defaultMessage="Monthly" />,
    annually: <FormattedMessage id="expenseFrequency.annually" defaultMessage="Annually" />,
  };

  const oneOrMoreDigitsButNotAllZero = /^(?!0+$)\d+$/;
  const expenseSourceSchema = z.object({
    expenseSourceName: z
      .string(
        helperText(
          intl.formatMessage({ id: 'errorMessage-expenseType', defaultMessage: 'Please select an expense type' }),
        ),
      )
      .min(1),
    expenseAmount: z
      .string(
        helperText(
          intl.formatMessage({
            id: 'errorMessage-greaterThanZero',
            defaultMessage: 'Please enter a number greater than 0',
          }),
        ),
      )
      .trim()
      .regex(oneOrMoreDigitsButNotAllZero),
    expenseFrequency: z
      .string(
        helperText(
          intl.formatMessage({ id: 'errorMessage-expenseFrequency', defaultMessage: 'Please select a frequency' }),
        ),
      )
      .min(1),
  });
  const expenseSourcesSchema = z.array(expenseSourceSchema);
  const hasExpensesSchema = z.string().regex(/^true|false$/);
  const formSchema = z.object({
    hasExpenses: hasExpensesSchema,
    expenses: expenseSourcesSchema,
  });
  type FormSchema = z.infer<typeof formSchema>;

  // Helper to check if user has been to the expenses page before
  // Check if hasExpenses field has been set (it's set when they submit this form)
  const hasVisitedExpensesBefore = formData.hasExpenses !== undefined && formData.hasExpenses !== '';

  // Empty expense template
  const EMPTY_EXPENSE = { expenseSourceName: '', expenseAmount: '', expenseFrequency: 'monthly' };

  // Get default expenses using shared logic
  const rawExpenses = getDefaultFormItems(
    formData.expenses,
    hasVisitedExpensesBefore,
    true, // Always show one empty box on first visit
    EMPTY_EXPENSE
  );

  // Apply backward compatibility: ensure all expenses have frequency field
  const defaultExpenses = rawExpenses.map(expense => ({
    ...expense,
    expenseFrequency: expense.expenseFrequency || 'monthly'
  }));

  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useStepForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hasExpenses: defaultExpenses.length > 0 ? 'true' : 'false',
      expenses: defaultExpenses,
    },
    questionName: 'hasExpenses',
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'expenses',
  });

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
        <Stack spacing={2} sx={{ mt: 2, mb: 2 }}>
          {fields.map((field, index) => {
            return (
              <Box key={field.id} className="expense-box">
                <Box className="expense-fields-container">
                  {/* First Row: Expense Type */}
                  <Box className="expense-field-type">
                    <FormControl fullWidth size="small" error={!!errors.expenses?.[index]?.expenseSourceName}>
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
                              className="white-input"
                            >
                              {createExpenseMenuItems(expenseOptions)}
                            </Select>
                            {!!errors.expenses?.[index]?.expenseSourceName && (
                              <FormHelperText sx={{ ml: 0 }}>
                                <ErrorMessageWrapper fontSize="0.75rem">
                                  {errors.expenses?.[index]?.expenseSourceName?.message}
                                </ErrorMessageWrapper>
                              </FormHelperText>
                            )}
                          </>
                        )}
                      />
                    </FormControl>
                  </Box>

                  {/* Second Row: Amount and Frequency */}
                  <Box className="expense-amount-frequency-row">
                    {/* Expense Amount */}
                    <Box className="expense-field-amount">
                      <Controller
                        name={`expenses.${index}.expenseAmount`}
                        control={control}
                        render={({ field }) => (
                          <>
                            <TextField
                              {...field}
                              label={
                                <FormattedMessage
                                  id="expenseBlock.createExpenseAmountTextfield-amountLabel"
                                  defaultMessage="Amount"
                                />
                              }
                              size="small"
                              fullWidth
                              inputProps={NUM_PAD_PROPS}
                              onChange={handleNumbersOnly(field.onChange)}
                              className="white-input"
                              error={!!errors.expenses?.[index]?.expenseAmount}
                              InputProps={{
                                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                              }}
                            />
                            {!!errors.expenses?.[index]?.expenseAmount && (
                              <FormHelperText sx={{ ml: 0 }}>
                                <ErrorMessageWrapper fontSize="0.75rem">
                                  {errors.expenses?.[index]?.expenseAmount?.message}
                                </ErrorMessageWrapper>
                              </FormHelperText>
                            )}
                          </>
                        )}
                      />
                    </Box>

                    {/* Expense Frequency */}
                    <Box className="expense-field-frequency">
                      <FormControl fullWidth size="small" error={!!errors.expenses?.[index]?.expenseFrequency}>
                        <InputLabel id={`expense-frequency-label-${index}`}>
                          <FormattedMessage
                            id="expenseBlock.createExpenseDropdownMenu-expenseFrequencyInputLabel"
                            defaultMessage="Frequency"
                          />
                        </InputLabel>
                        <Controller
                          name={`expenses.${index}.expenseFrequency`}
                          control={control}
                          render={({ field }) => (
                            <>
                              <Select
                                {...field}
                                labelId={`expense-frequency-label-${index}`}
                                id={`expenses.${index}.expenseFrequency`}
                                label={
                                  <FormattedMessage
                                    id="expenseBlock.createExpenseDropdownMenu-expenseFrequencySelectLabel"
                                    defaultMessage="Frequency"
                                  />
                                }
                                className="white-input"
                              >
                                {createExpenseMenuItems(frequencyOptions)}
                              </Select>
                              {!!errors.expenses?.[index]?.expenseFrequency && (
                                <FormHelperText sx={{ ml: 0 }}>
                                  <ErrorMessageWrapper fontSize="0.75rem">
                                    {errors.expenses?.[index]?.expenseFrequency?.message}
                                  </ErrorMessageWrapper>
                                </FormHelperText>
                              )}
                            </>
                          )}
                        />
                      </FormControl>
                    </Box>
                  </Box>
                </Box>

                {/* Delete Button */}
                <IconButton
                  onClick={() => remove(index)}
                  aria-label="delete expense"
                  className="expense-delete-button"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            );
          })}
        </Stack>
        <Box sx={{ paddingTop: '0rem', paddingBottom: '1rem' }}>
          <Button
            variant="contained"
            fullWidth
            onClick={() =>
              append({
                expenseSourceName: '',
                expenseAmount: '',
                expenseFrequency: 'monthly',
              })
            }
            startIcon={<AddIcon />}
            type="button"
            className="add-another-expense-button"
          >
            <FormattedMessage id="expenseBlock.return-addExpenseButton" defaultMessage="Add another expense" />
          </Button>
        </Box>
        <PrevAndContinueButtons backNavigationFunction={backNavigationFunction} />
      </form>
    </div>
  );
};

export default Expenses;
