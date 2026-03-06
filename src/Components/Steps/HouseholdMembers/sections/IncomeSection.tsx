import { FormattedMessage, useIntl } from 'react-intl';
import {
  Box,
  FormControl,
  FormHelperText,
  FormLabel,
  IconButton,
  InputAdornment,
  Select,
  Stack,
  TextField,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useEffect, useRef, useState } from 'react';
import {
  Control,
  Controller,
  UseFormSetValue,
  useWatch,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  FieldArrayWithId,
  FieldErrors,
} from 'react-hook-form';
import { NumericFormat } from 'react-number-format';
import { ReactComponent as HelpBubble } from '../../../../Assets/icons/General/helpBubble.svg';
import QuestionQuestion from '../../../QuestionComponents/QuestionQuestion';
import QuestionDescription from '../../../QuestionComponents/QuestionDescription';
import ErrorMessageWrapper from '../../../ErrorMessage/ErrorMessageWrapper';
import { createMenuItems } from '../../SelectHelperFunctions/SelectHelperFunctions';
import { FormattedMessageType } from '../../../../Types/Questions';
import { IncomeStreamFormData } from '../utils/types';
import { EMPTY_INCOME_STREAM } from '../utils/constants';
import '../styles/HouseholdMemberSections.css';
import '../styles/IncomeSection.css';

// Both main and EC workflows share the same incomeStreams shape.
type IncomeFormValues = {
  incomeStreams: IncomeStreamFormData[];
};

interface IncomeSectionProps {
  control: Control<IncomeFormValues>;
  errors: FieldErrors<IncomeFormValues>;
  fields: FieldArrayWithId<IncomeFormValues, 'incomeStreams', 'id'>[];
  append: UseFieldArrayAppend<IncomeFormValues, 'incomeStreams'>;
  remove: UseFieldArrayRemove;
  setValue: UseFormSetValue<IncomeFormValues>;
  incomeCategories: Record<string, FormattedMessageType>;
  incomeOptions: Record<string, Record<string, FormattedMessageType>>;
  frequencyMenuItems: (JSX.Element | JSX.Element[])[];
  pageNumber: number;
}

interface IncomeStreamRowProps {
  index: number;
  control: Control<IncomeFormValues>;
  setValue: UseFormSetValue<IncomeFormValues>;
  remove: UseFieldArrayRemove;
  getError: (index: number, fieldName: keyof IncomeStreamFormData) => unknown;
  incomeCategoriesMenuItems: (JSX.Element | JSX.Element[])[];
  incomeOptions: Record<string, Record<string, FormattedMessageType>>;
  frequencyMenuItems: (JSX.Element | JSX.Element[])[];
}

const IncomeStreamRow = ({
  index,
  control,
  setValue,
  remove,
  getError,
  incomeCategoriesMenuItems,
  incomeOptions,
  frequencyMenuItems,
}: IncomeStreamRowProps) => {
  const [showFreqHelp, setShowFreqHelp] = useState(false);
  const freqHelpRef = useRef<HTMLDivElement>(null);
  const intl = useIntl();

  useEffect(() => {
    if (!showFreqHelp) return;
    const handler = (e: MouseEvent) => {
      if (freqHelpRef.current && !freqHelpRef.current.contains(e.target as Node)) {
        setShowFreqHelp(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showFreqHelp]);

  // useWatch with a field-scoped name subscribes only this row to its own fields,
  // avoiding re-renders of sibling rows when unrelated streams change.
  const selectedType = useWatch({ control, name: `incomeStreams.${index}.incomeCategory` });
  const isHourly = useWatch({ control, name: `incomeStreams.${index}.incomeFrequency` }) === 'hourly';
  const sourceOptions = selectedType && incomeOptions[selectedType] ? incomeOptions[selectedType] : {};
  const specificTypeMenuItems = createMenuItems(
    sourceOptions,
    <FormattedMessage id="personIncomeBlock.createMenuItems-disabledSelectType" defaultMessage="Select source" />,
  );

  const incomeCategoryError = getError(index, 'incomeCategory') as { message?: string } | undefined;
  const incomeStreamNameError = getError(index, 'incomeStreamName') as { message?: string } | undefined;
  const incomeFrequencyError = getError(index, 'incomeFrequency') as { message?: string } | undefined;
  const hoursPerWeekError = getError(index, 'hoursPerWeek') as { message?: string } | undefined;
  const incomeAmountError = getError(index, 'incomeAmount') as { message?: string } | undefined;

  return (
    <Box id={`income-stream-${index}`} className="income-box">
      <Box className="income-fields-container">
        {/* Income Type */}
        <Box className="income-category-container">
          <FormControl fullWidth size="small" error={incomeCategoryError !== undefined}>
            <FormLabel sx={{ fontSize: '0.875rem', fontWeight: 400, mb: 0.5, color: 'text.primary' }}>
              <FormattedMessage id="personIncomeBlock.incomeCategory" defaultMessage="Income Category" />
            </FormLabel>
            <Controller
              name={`incomeStreams.${index}.incomeCategory`}
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  inputProps={{ 'aria-label': 'Income Category' }}
                  id={`income-category-select-${index}`}
                  sx={{ backgroundColor: '#fff' }}
                  onChange={(e) => {
                    field.onChange(e);
                    // Dynamic indexed path — cast required since RHF can't narrow template literals
                    setValue(`incomeStreams.${index}.incomeStreamName` as any, '');
                  }}
                >
                  {incomeCategoriesMenuItems}
                </Select>
              )}
            />
            {incomeCategoryError && (
              <FormHelperText sx={{ ml: 0 }}>
                <ErrorMessageWrapper fontSize="0.75rem">{incomeCategoryError.message ?? ''}</ErrorMessageWrapper>
              </FormHelperText>
            )}
          </FormControl>
        </Box>

        {/* Income Source, Frequency, Hours (if hourly), Amount */}
        <Box className="income-fields-row">
          <Box className="income-field-specific-type">
            <FormControl fullWidth size="small" error={!!selectedType && incomeStreamNameError !== undefined}>
              <FormLabel sx={{ fontSize: '0.875rem', fontWeight: 400, mb: 0.5, color: 'text.primary' }}>
                <FormattedMessage id="personIncomeBlock.incomeStreamName" defaultMessage="Income Source" />
              </FormLabel>
              <Controller
                name={`incomeStreams.${index}.incomeStreamName`}
                control={control}
                render={({ field }) => (
                  // Tooltip needs a non-disabled span wrapper — disabled elements swallow pointer events
                  <Tooltip
                    title={selectedType ? '' : <FormattedMessage id="personIncomeBlock.specificType-tooltip" defaultMessage="Select an income category first" />}
                    disableHoverListener={!!selectedType}
                    disableFocusListener={!!selectedType}
                    disableTouchListener={!!selectedType}
                  >
                    <span>
                      <Select
                        {...field}
                        inputProps={{ 'aria-label': 'Income Source' }}
                        id={`income-source-select-${index}`}
                        sx={{ backgroundColor: '#fff' }}
                        disabled={!selectedType}
                        fullWidth
                      >
                        {specificTypeMenuItems}
                      </Select>
                    </span>
                  </Tooltip>
                )}
              />
              {selectedType && incomeStreamNameError && (
                <FormHelperText sx={{ ml: 0 }}>
                  <ErrorMessageWrapper fontSize="0.75rem">{incomeStreamNameError.message ?? ''}</ErrorMessageWrapper>
                </FormHelperText>
              )}
            </FormControl>
          </Box>

          <Box className="income-field-frequency">
            <div ref={freqHelpRef} className="income-frequency-label-row">
              <FormLabel sx={{ fontSize: '0.875rem', fontWeight: 400, color: 'text.primary' }}>
                <FormattedMessage id="personIncomeBlock.frequency" defaultMessage="Frequency" />
              </FormLabel>
              <IconButton
                size="small"
                onClick={() => setShowFreqHelp((v) => !v)}
                aria-label={intl.formatMessage({ id: 'helpButton.ariaText', defaultMessage: 'help button' })}
              >
                <HelpBubble style={{ height: '16px', width: '16px' }} className="help-button-icon-color" />
              </IconButton>
            </div>
            {showFreqHelp && (
              <p className="help-text">
                <FormattedMessage
                  id="personIncomeBlock.income-freq-help-text"
                  defaultMessage='"Every 2 weeks" means you get paid every other week. "Twice a month" means you get paid two times a month on the same dates each month.'
                />
              </p>
            )}
            <FormControl fullWidth size="small" error={incomeFrequencyError !== undefined}>
              <Controller
                name={`incomeStreams.${index}.incomeFrequency`}
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    inputProps={{ 'aria-label': 'Frequency' }}
                    id={`income-frequency-select-${index}`}
                    sx={{ backgroundColor: '#fff' }}
                  >
                    {frequencyMenuItems}
                  </Select>
                )}
              />
              {incomeFrequencyError && (
                <FormHelperText sx={{ ml: 0 }}>
                  <ErrorMessageWrapper fontSize="0.75rem">{incomeFrequencyError.message ?? ''}</ErrorMessageWrapper>
                </FormHelperText>
              )}
            </FormControl>
          </Box>

          {isHourly && (
            <Box className="income-field-hours">
              <FormLabel sx={{ fontSize: '0.875rem', fontWeight: 400, mb: 0.5, color: 'text.primary', display: 'block' }}>
                <FormattedMessage id="personIncomeBlock.hoursPerWeek" defaultMessage="Hours per Week" />
              </FormLabel>
              <Controller
                name={`incomeStreams.${index}.hoursPerWeek`}
                control={control}
                render={({ field }) => (
                  <>
                    <NumericFormat
                      value={field.value}
                      onValueChange={({ value }) => field.onChange(value)}
                      allowNegative={false}
                      decimalScale={0}
                      customInput={TextField}
                      fullWidth
                      size="small"
                      variant="outlined"
                      inputProps={{ inputMode: 'numeric', 'aria-label': 'Hours per Week' }}
                      sx={{ backgroundColor: '#fff' }}
                      error={hoursPerWeekError !== undefined}
                    />
                    {hoursPerWeekError && (
                      <FormHelperText sx={{ ml: 0 }}>
                        <ErrorMessageWrapper fontSize="0.75rem">{hoursPerWeekError.message ?? ''}</ErrorMessageWrapper>
                      </FormHelperText>
                    )}
                  </>
                )}
              />
            </Box>
          )}

          <Box className="income-field-amount">
            <FormLabel sx={{ fontSize: '0.875rem', fontWeight: 400, mb: 0.5, color: 'text.primary', display: 'block' }}>
              <FormattedMessage id="personIncomeBlock.preTaxAmount" defaultMessage="Pre-Tax Amount" />
            </FormLabel>
            <Controller
              name={`incomeStreams.${index}.incomeAmount`}
              control={control}
              render={({ field }) => (
                <>
                  <NumericFormat
                    value={field.value}
                    onValueChange={({ value }) => field.onChange(value)}
                    thousandSeparator
                    allowNegative={false}
                    decimalScale={isHourly ? 2 : 0}
                    fixedDecimalScale={isHourly}
                    customInput={TextField}
                    fullWidth
                    size="small"
                    variant="outlined"
                    inputProps={{ id: `income-amount-input-${index}`, inputMode: isHourly ? 'decimal' : 'numeric', 'aria-label': 'Pre-Tax Amount' }}
                    sx={{ backgroundColor: '#fff' }}
                    error={incomeAmountError !== undefined}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                  {incomeAmountError && (
                    <FormHelperText sx={{ ml: 0 }}>
                      <ErrorMessageWrapper fontSize="0.75rem">{incomeAmountError.message ?? ''}</ErrorMessageWrapper>
                    </FormHelperText>
                  )}
                </>
              )}
            />
          </Box>
        </Box>
      </Box>

      <IconButton
        onClick={() => remove(index)}
        className="income-delete-button"
        aria-label={intl.formatMessage({ id: 'personIncomeBlock.deleteIncomeAria', defaultMessage: 'Delete income source' })}
      >
        <DeleteIcon />
      </IconButton>
    </Box>
  );
};

const IncomeSection = ({
  control,
  errors,
  fields,
  append,
  remove,
  setValue,
  incomeCategories,
  incomeOptions,
  frequencyMenuItems,
  pageNumber,
}: IncomeSectionProps) => {
  const incomeCategoriesMenuItems = createMenuItems(
    incomeCategories,
    <FormattedMessage id="personIncomeBlock.createMenuItems-disabledSelectCategory" defaultMessage="Select category" />,
  );

  const getError = (index: number, fieldName: keyof IncomeStreamFormData) => {
    return (errors.incomeStreams as FieldErrors<IncomeStreamFormData>[])?.[index]?.[fieldName];
  };

  return (
    <Box id="income-section">
      <QuestionQuestion>
        <FormattedMessage id="householdDataBlock.createIncomeRadioQuestion-questionLabel" defaultMessage="Income Sources" />
      </QuestionQuestion>
      <QuestionDescription>
        {pageNumber === 1 ? (
          <FormattedMessage
            id="householdDataBlock.incomeDescription-you"
            defaultMessage="Start with your own income only. This includes wages, self-employment, current benefits, child support, and any other regular payments. You'll enter income for each household member separately."
          />
        ) : (
          <FormattedMessage
            id="householdDataBlock.incomeDescription-them"
            defaultMessage="Include their wages, benefits, child support, and any other regular payments. If you don't know the exact amount, add your best estimate. It will help make your results more accurate."
          />
        )}
      </QuestionDescription>

      <Stack spacing={2} className="income-streams-stack">
        {fields.map((field, index) => (
          <IncomeStreamRow
            key={field.id}
            index={index}
            control={control}
            setValue={setValue}
            remove={remove}
            getError={getError}
            incomeCategoriesMenuItems={incomeCategoriesMenuItems}
            incomeOptions={incomeOptions}
            frequencyMenuItems={frequencyMenuItems}
          />
        ))}

        <Box sx={{ paddingBottom: '1rem' }}>
          <button onClick={() => append(EMPTY_INCOME_STREAM)} type="button" className="income-add-button">
            <AddIcon fontSize="small" />
            <strong><FormattedMessage id="personIncomeBlock.addIncomeSourceButton" defaultMessage="Add An Income Source" /></strong>
          </button>
        </Box>
      </Stack>
    </Box>
  );
};

export default IncomeSection;
