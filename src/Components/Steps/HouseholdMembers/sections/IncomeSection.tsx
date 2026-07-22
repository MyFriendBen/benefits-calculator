import { useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  Box,
  FormControl,
  FormHelperText,
  FormLabel,
  InputAdornment,
  Select,
  Stack,
  TextField,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
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
import HelpButton from '../../../HelpBubbleIcon/HelpButton';
import QuestionQuestion from '../../../QuestionComponents/QuestionQuestion';
import QuestionDescription from '../../../QuestionComponents/QuestionDescription';
import ErrorMessageWrapper from '../../../ErrorMessage/ErrorMessageWrapper';
import { createMenuItems } from '../../SelectHelperFunctions/SelectHelperFunctions';
import { FormattedMessageType } from '../../../../Types/Questions';
import { IncomeStreamFormData } from '../utils/types';
import {
  EMPLOYMENT_CATEGORY,
  EMPTY_EMPLOYMENT_INCOME_STREAM,
  EMPTY_GIG_INCOME_STREAM,
  EMPTY_INCOME_STREAM,
} from '../utils/constants';
import { isEmploymentStream } from '../utils/helpers';
import { useStepNumber } from '../../../../Assets/stepDirectory';
import { useTrackEvent } from '../../../../Assets/analytics';
import { getStepAnalyticsId, HOUSEHOLD_SUBSTEP_IDS } from '../../../../Assets/analytics/stepIds';
import '../styles/HouseholdMemberSections.css';
import '../styles/IncomeSection.css';

// Both main and EC workflows share the same incomeStreams shape.
type IncomeFormValues = {
  incomeStreams: IncomeStreamFormData[];
};

// Row layout variants, keyed to the three income questions:
// - 'full': category + source dropdowns (government benefits / other payments).
// - 'sourceOnly': category is fixed to employment; only the source dropdown shows
//   (the "Are you currently employed?" question).
// - 'amountOnly': category and source are both implied (self-employment); only
//   frequency + amount show (the "freelance, gig, or occasional work?" question).
type IncomeRowVariant = 'full' | 'sourceOnly' | 'amountOnly';

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
  variant: IncomeRowVariant;
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
  variant,
  control,
  setValue,
  remove,
  getError,
  incomeCategoriesMenuItems,
  incomeOptions,
  frequencyMenuItems,
}: IncomeStreamRowProps) => {
  const intl = useIntl();

  // useWatch with a field-scoped name subscribes only this row to its own fields,
  // avoiding re-renders of sibling rows when unrelated streams change.
  const selectedType = useWatch({ control, name: `incomeStreams.${index}.incomeCategory` });
  const isHourly = useWatch({ control, name: `incomeStreams.${index}.incomeFrequency` }) === 'hourly';

  const showCategory = variant === 'full';
  const showSource = variant === 'full' || variant === 'sourceOnly';

  // sourceOnly rows have a fixed employment category, so scope the source options to it.
  const effectiveCategory = variant === 'sourceOnly' ? EMPLOYMENT_CATEGORY : selectedType;
  const sourceOptions = effectiveCategory && incomeOptions[effectiveCategory] ? incomeOptions[effectiveCategory] : {};
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
        {/* Income Category (only for the "other recurring payments" question) */}
        {showCategory && (
          <Box className="income-category-container">
            <FormControl fullWidth size="small" error={incomeCategoryError !== undefined}>
              <FormLabel id={`income-category-label-${index}`} sx={{ fontSize: '0.875rem', fontWeight: 400, mb: 0.5, color: 'text.primary' }}>
                <FormattedMessage id="personIncomeBlock.incomeCategory" defaultMessage="Income Category" />
              </FormLabel>
              <Controller
                name={`incomeStreams.${index}.incomeCategory`}
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    inputProps={{ 'aria-label': intl.formatMessage({ id: 'personIncomeBlock.incomeCategory', defaultMessage: 'Income Category' }) }}
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
        )}

        {/* Income Source, Frequency, Hours (if hourly), Amount */}
        <Box className="income-fields-row">
          {showSource && (
            <Box className="income-field-specific-type">
              <FormControl fullWidth size="small" error={!!effectiveCategory && incomeStreamNameError !== undefined}>
                <FormLabel id={`income-source-label-${index}`} sx={{ fontSize: '0.875rem', fontWeight: 400, mb: 0.5, color: 'text.primary' }}>
                  <FormattedMessage id="personIncomeBlock.incomeStreamName" defaultMessage="Income Source" />
                </FormLabel>
                <Controller
                  name={`incomeStreams.${index}.incomeStreamName`}
                  control={control}
                  render={({ field }) => (
                    // Tooltip needs a non-disabled span wrapper — disabled elements swallow pointer events
                    <Tooltip
                      title={effectiveCategory ? '' : <FormattedMessage id="personIncomeBlock.specificType-tooltip" defaultMessage="Select an income category first" />}
                      disableHoverListener={!!effectiveCategory}
                      disableFocusListener={!!effectiveCategory}
                      disableTouchListener={!!effectiveCategory}
                    >
                      <span>
                        <Select
                          {...field}
                          inputProps={{ 'aria-label': intl.formatMessage({ id: 'personIncomeBlock.incomeStreamName', defaultMessage: 'Income Source' }) }}
                          id={`income-source-select-${index}`}
                          sx={{ backgroundColor: '#fff' }}
                          disabled={!effectiveCategory}
                          fullWidth
                          MenuProps={{ MenuListProps: { sx: { '& .MuiMenuItem-root': { whiteSpace: 'normal' } } } }}
                        >
                          {specificTypeMenuItems}
                        </Select>
                      </span>
                    </Tooltip>
                  )}
                />
                {!!effectiveCategory && incomeStreamNameError && (
                  <FormHelperText sx={{ ml: 0 }}>
                    <ErrorMessageWrapper fontSize="0.75rem">{incomeStreamNameError.message ?? ''}</ErrorMessageWrapper>
                  </FormHelperText>
                )}
              </FormControl>
            </Box>
          )}

          <Box className="income-field-frequency">
            <div className="income-frequency-label-row">
              <FormLabel id={`income-frequency-label-${index}`} sx={{ fontSize: '0.875rem', fontWeight: 400, color: 'text.primary' }}>
                <FormattedMessage id="personIncomeBlock.frequency" defaultMessage="Frequency" />
              </FormLabel>
              <HelpButton helpTopic="income-frequency" stepName={HOUSEHOLD_SUBSTEP_IDS.memberDetails}>
                <FormattedMessage
                  id="personIncomeBlock.income-freq-help-text"
                  defaultMessage='"Every 2 weeks" means you get paid every other week. "Twice a month" means you get paid two times a month on the same dates each month.'
                />
              </HelpButton>
            </div>
            <FormControl fullWidth size="small" error={incomeFrequencyError !== undefined}>
              <Controller
                name={`incomeStreams.${index}.incomeFrequency`}
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    inputProps={{ 'aria-label': intl.formatMessage({ id: 'personIncomeBlock.frequency', defaultMessage: 'Frequency' }) }}
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
                      inputProps={{ inputMode: 'numeric', 'aria-label': intl.formatMessage({ id: 'personIncomeBlock.hoursPerWeek', defaultMessage: 'Hours per Week' }) }}
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
            <FormLabel id={`income-amount-label-${index}`} sx={{ fontSize: '0.875rem', fontWeight: 400, mb: 0.5, color: 'text.primary', display: 'block' }}>
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
                    inputProps={{ id: `income-amount-input-${index}`, inputMode: isHourly ? 'decimal' : 'numeric', 'aria-label': intl.formatMessage({ id: 'personIncomeBlock.preTaxAmount', defaultMessage: 'Pre-Tax Amount' }) }}
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

      <button
        type="button"
        onClick={() => remove(index)}
        className="income-delete-button"
        aria-label={intl.formatMessage({ id: 'personIncomeBlock.deleteIncomeAria', defaultMessage: 'Delete income source' })}
      >
        <DeleteIcon />
        <span className="income-delete-label">
          <FormattedMessage id="personIncomeBlock.removeIncomeLabel" defaultMessage="Remove" />
        </span>
      </button>
    </Box>
  );
};

interface YesNoToggleProps {
  value: boolean | null;
  onChange: (value: boolean) => void;
  ariaLabel: string;
}

/**
 * Yes/No toggle: two bordered pill buttons side by
 * side, filled with the primary color when selected. Uses plain buttons rather
 * than MUI Button variants because the app theme neutralizes the outlined
 * border (border: none), which would render them as borderless text.
 */
const YesNoToggle = ({ value, onChange, ariaLabel }: YesNoToggleProps) => (
  <div className="income-yes-no-toggle" role="group" aria-label={ariaLabel}>
    <button
      type="button"
      className={`income-yes-no-button${value === true ? ' income-yes-no-selected' : ''}`}
      onClick={() => onChange(true)}
      aria-pressed={value === true}
    >
      <FormattedMessage id="radiofield.label-yes" defaultMessage="Yes" />
    </button>
    <button
      type="button"
      className={`income-yes-no-button${value === false ? ' income-yes-no-selected' : ''}`}
      onClick={() => onChange(false)}
      aria-pressed={value === false}
    >
      <FormattedMessage id="radiofield.label-no" defaultMessage="No" />
    </button>
  </div>
);

/**
 * De-emphasized "+ Add an income source" link — no longer a
 * full-width filled button competing with Continue.
 */
const AddIncomeSourceLink = ({ onClick }: { onClick: () => void }) => (
  <Box>
    <button onClick={onClick} type="button" className="income-add-button">
      <AddIcon fontSize="small" />
      <FormattedMessage id="personIncomeBlock.addIncomeSourceButton" defaultMessage="Add an income source" />
    </button>
  </Box>
);

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
  const intl = useIntl();

  // Only non-employment categories belong to the "government benefits / other
  // recurring payments" question; employment is collected via Q1/Q2.
  const otherIncomeCategories = useMemo(
    () => Object.fromEntries(Object.entries(incomeCategories).filter(([key]) => key !== EMPLOYMENT_CATEGORY)),
    [incomeCategories],
  );

  const incomeCategoriesMenuItems = createMenuItems(
    otherIncomeCategories,
    <FormattedMessage id="personIncomeBlock.createMenuItems-disabledSelectCategory" defaultMessage="Select category" />,
  );

  const getError = (index: number, fieldName: keyof IncomeStreamFormData) => {
    return (errors.incomeStreams as FieldErrors<IncomeStreamFormData>[])?.[index]?.[fieldName];
  };

  // Watch the whole array so rows re-bucket when a category/source changes.
  const watchedStreams = useWatch({ control, name: 'incomeStreams' }) ?? [];
  // useFieldArray fields carry stable ids; pair them with the watched values so we
  // can bucket by live category/source while keeping RHF's stable keys.
  const rows = fields.map((field, index) => ({ field, index, value: watchedStreams[index] ?? field }));

  // Employment rows always carry the fixed 'employment' category; everything else
  // (including a freshly-appended blank row whose category isn't chosen yet) belongs
  // to the "other recurring payments" question.
  const employmentRows = rows.filter((r) => isEmploymentStream(r.value));
  const otherRows = rows.filter((r) => !isEmploymentStream(r.value));

  // The three Yes/No answers live in RHF form state (incomeEmployed/Gig/Other) so
  // they are required by the schema and participate in scroll-to-error. They are
  // seeded from the persisted streams (deriveIncomeAnswers) in defaultValues and
  // stripped before saving — the backend still derives income from the streams.
  const employed = (useWatch({ control, name: 'incomeEmployed' as any }) ?? null) as boolean | null;
  const gig = (useWatch({ control, name: 'incomeGig' as any }) ?? null) as boolean | null;
  const other = (useWatch({ control, name: 'incomeOther' as any }) ?? null) as boolean | null;

  const setEmployed = (v: boolean | null) => setValue('incomeEmployed' as any, v as any, { shouldValidate: true });
  const setGig = (v: boolean | null) => setValue('incomeGig' as any, v as any, { shouldValidate: true });
  const setOther = (v: boolean | null) => setValue('incomeOther' as any, v as any, { shouldValidate: true });

  const employedError = (errors as FieldErrors<any>)?.incomeEmployed as { message?: string } | undefined;
  const gigError = (errors as FieldErrors<any>)?.incomeGig as { message?: string } | undefined;
  const otherError = (errors as FieldErrors<any>)?.incomeOther as { message?: string } | undefined;

  // Q2 (gig) is only asked when Q1 (employed) is "No".
  const showGigQuestion = employed === false;
  // A gig row is any employment row (self-employment) that surfaces while not employed.
  const gigRows = showGigQuestion ? employmentRows : [];
  const employedRows = showGigQuestion ? [] : employmentRows;

  const track = useTrackEvent();
  // Income streams live inside the household member step, so they share its
  // step identity for analytics regardless of which member page is open.
  const householdDataStepNumber = useStepNumber('householdData', false);

  const trackIncomeSource = (action: 'add' | 'delete') => {
    track('screener_income_source', {
      screener_step_name: getStepAnalyticsId('householdData'),
      screener_step_number: householdDataStepNumber >= 0 ? householdDataStepNumber : undefined,
      action,
    });
  };

  const trackedRemove: UseFieldArrayRemove = (index) => {
    trackIncomeSource('delete');
    remove(index);
  };

  // Remove all rows matching a predicate, deleting from the highest index down so
  // earlier indices stay valid as we splice.
  const removeMatching = (predicate: (value: IncomeStreamFormData) => boolean) => {
    const indices = rows
      .filter((r) => predicate(r.value))
      .map((r) => r.index)
      .sort((a, b) => b - a);
    indices.forEach((i) => remove(i));
  };

  const handleEmployedChange = (answer: boolean) => {
    setEmployed(answer);
    if (answer) {
      // Turning employment on hides the gig question; fold any existing gig income
      // back under the (now visible) employment question rather than dropping it.
      setGig(null);
      if (employmentRows.length === 0) {
        append(EMPTY_EMPLOYMENT_INCOME_STREAM);
        trackIncomeSource('add');
      }
    } else {
      removeMatching(isEmploymentStream);
    }
  };

  const handleGigChange = (answer: boolean) => {
    setGig(answer);
    if (answer) {
      if (employmentRows.length === 0) {
        append(EMPTY_GIG_INCOME_STREAM);
        trackIncomeSource('add');
      }
    } else {
      removeMatching(isEmploymentStream);
    }
  };

  const handleOtherChange = (answer: boolean) => {
    setOther(answer);
    if (answer) {
      if (otherRows.length === 0) {
        append(EMPTY_INCOME_STREAM);
        trackIncomeSource('add');
      }
    } else {
      // Remove every non-employment row, including any blank rows the user added
      // but never assigned a category.
      removeMatching((value) => !isEmploymentStream(value));
    }
  };

  const handleAddEmploymentSource = () => {
    append(EMPTY_EMPLOYMENT_INCOME_STREAM);
    trackIncomeSource('add');
  };

  const handleAddGigSource = () => {
    append(EMPTY_GIG_INCOME_STREAM);
    trackIncomeSource('add');
  };

  const handleAddOtherSource = () => {
    append(EMPTY_INCOME_STREAM);
    trackIncomeSource('add');
  };

  const renderRow = (r: { field: { id: string }; index: number }, variant: IncomeRowVariant) => (
    <IncomeStreamRow
      key={r.field.id}
      index={r.index}
      variant={variant}
      control={control}
      setValue={setValue}
      remove={trackedRemove}
      getError={getError}
      incomeCategoriesMenuItems={incomeCategoriesMenuItems}
      incomeOptions={incomeOptions}
      frequencyMenuItems={frequencyMenuItems}
    />
  );

  return (
    <Box id="income-section" className="section">
      <QuestionQuestion>
        <FormattedMessage id="householdDataBlock.createIncomeRadioQuestion-questionLabel" defaultMessage="Income Sources" />
      </QuestionQuestion>
      <QuestionDescription>
        {pageNumber === 1 ? (
          <FormattedMessage
            id="householdDataBlock.incomeDescription-you-questions"
            defaultMessage="Answer each question for yourself only. You'll enter income for each household member separately."
          />
        ) : (
          <FormattedMessage
            id="householdDataBlock.incomeDescription-them-questions"
            defaultMessage="Answer each question for this person. If you don't know the exact amount, add your best estimate. It will help make your results more accurate."
          />
        )}
      </QuestionDescription>

      <Box className="income-questions-container">
        {/* Q1 — Are you currently employed? */}
        <Box className="income-question-block">
          <FormLabel className="income-question-label">
            <FormattedMessage id="householdDataBlock.incomeQuestion-employed" defaultMessage="Are you currently employed?" />
          </FormLabel>
          <YesNoToggle
            value={employed}
            onChange={handleEmployedChange}
            ariaLabel={intl.formatMessage({ id: 'householdDataBlock.incomeQuestion-employed', defaultMessage: 'Are you currently employed?' })}
          />
          {employedError && (
            <FormHelperText sx={{ ml: 0 }}>
              <ErrorMessageWrapper fontSize="0.875rem">{employedError.message ?? ''}</ErrorMessageWrapper>
            </FormHelperText>
          )}
          {employed && (
            <Stack spacing={2} className="income-streams-stack">
              {employedRows.map((r) => renderRow(r, 'sourceOnly'))}
              <AddIncomeSourceLink onClick={handleAddEmploymentSource} />
            </Stack>
          )}
        </Box>

        {/* Q2 — Freelance/gig/occasional work (only when Q1 is No) */}
        {showGigQuestion && (
          <Box className="income-question-block">
            <FormLabel className="income-question-label">
              <FormattedMessage
                id="householdDataBlock.incomeQuestion-gig"
                defaultMessage="Do you earn any money from freelance, gig, or occasional work?"
              />
            </FormLabel>
            <p className="income-question-subtext">
              <FormattedMessage
                id="householdDataBlock.incomeQuestion-gig-subtext"
                defaultMessage="For example: driving for a rideshare, odd jobs, selling goods, or any other irregular paid work."
              />
            </p>
            <YesNoToggle
              value={gig}
              onChange={handleGigChange}
              ariaLabel={intl.formatMessage({ id: 'householdDataBlock.incomeQuestion-gig', defaultMessage: 'Do you earn any money from freelance, gig, or occasional work?' })}
            />
            {gigError && (
              <FormHelperText sx={{ ml: 0 }}>
                <ErrorMessageWrapper fontSize="0.875rem">{gigError.message ?? ''}</ErrorMessageWrapper>
              </FormHelperText>
            )}
            {gig && (
              <Stack spacing={2} className="income-streams-stack">
                {gigRows.map((r) => renderRow(r, 'amountOnly'))}
                <AddIncomeSourceLink onClick={handleAddGigSource} />
              </Stack>
            )}
          </Box>
        )}

        {/* Q3 — Government benefits / child support / alimony / other recurring payments */}
        <Box className="income-question-block">
          <FormLabel className="income-question-label">
            <FormattedMessage
              id="householdDataBlock.incomeQuestion-other"
              defaultMessage="Do you receive any government benefits, child support, alimony, or other recurring payments?"
            />
          </FormLabel>
          <YesNoToggle
            value={other}
            onChange={handleOtherChange}
            ariaLabel={intl.formatMessage({ id: 'householdDataBlock.incomeQuestion-other', defaultMessage: 'Do you receive any government benefits, child support, alimony, or other recurring payments?' })}
          />
          {otherError && (
            <FormHelperText sx={{ ml: 0 }}>
              <ErrorMessageWrapper fontSize="0.875rem">{otherError.message ?? ''}</ErrorMessageWrapper>
            </FormHelperText>
          )}
          {other && (
            <Stack spacing={2} className="income-streams-stack">
              {otherRows.map((r) => renderRow(r, 'full'))}
              <AddIncomeSourceLink onClick={handleAddOtherSource} />
            </Stack>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default IncomeSection;
