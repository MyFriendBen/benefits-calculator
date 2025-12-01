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

const Expenses = () => {
  const { formData } = useContext(Context);
  const { uuid } = useParams();
  const intl = useIntl();
  const { updateScreen } = useScreenApi();
  const backNavigationFunction = useDefaultBackNavigationFunction('hasExpenses');
  const expenseOptions = useConfig('expense_options') as Record<string, FormattedMessageType>;

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
  });
  const expenseSourcesSchema = z.array(expenseSourceSchema);
  const hasExpensesSchema = z.string().regex(/^true|false$/);
  const formSchema = z.object({
    hasExpenses: hasExpensesSchema,
    expenses: expenseSourcesSchema,
  });
  type FormSchema = z.infer<typeof formSchema>;

  const defaultExpenses = formData.expenses && formData.expenses.length > 0
    ? formData.expenses
    : [{ expenseSourceName: '', expenseAmount: '' }];

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
                <Box className="expense-fields-wrapper">
                  {/* Expense Type */}
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
        <Box className="add-expense-button-container">
          <Button
            variant="outlined"
            onClick={() =>
              append({
                expenseSourceName: '',
                expenseAmount: '',
              })
            }
            startIcon={<AddIcon />}
            type="button"
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
