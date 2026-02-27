import { FormattedMessage, useIntl } from 'react-intl';
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputAdornment,
  InputLabel,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { Control, Controller, UseFieldArrayAppend, UseFieldArrayRemove, FieldArrayWithId, FieldErrors, UseFormWatch } from 'react-hook-form';
import { NumericFormat } from 'react-number-format';
import QuestionQuestion from '../../../QuestionComponents/QuestionQuestion';
import QuestionDescription from '../../../QuestionComponents/QuestionDescription';
import HelpButton from '../../../HelpBubbleIcon/HelpButton';
import ErrorMessageWrapper from '../../../ErrorMessage/ErrorMessageWrapper';
import CloseButton from '../../../CloseButton/CloseButton';
import { createMenuItems } from '../../SelectHelperFunctions/SelectHelperFunctions';
import { FormattedMessageType } from '../../../../Types/Questions';
import { EMPTY_INCOME_STREAM } from '../utils/constants';
import '../styles/HouseholdMemberSections.css';
import '../styles/IncomeSection.css';

// IncomeSection is shared between main and EC workflows. Both have identical incomeStreams
// structure, so we use `any` for form types to accept either schema.
interface IncomeSectionProps {
  control: Control<any>;
  errors: FieldErrors<any>;
  fields: FieldArrayWithId<any, 'incomeStreams', 'id'>[];
  append: UseFieldArrayAppend<any, 'incomeStreams'>;
  remove: UseFieldArrayRemove;
  watch: UseFormWatch<any>;
  incomeOptions: Record<string, FormattedMessageType>;
  frequencyMenuItems: JSX.Element[];
  pageNumber: number;
  isUnder16: boolean;
}

const IncomeSection = ({
  control,
  errors,
  fields,
  append,
  remove,
  watch,
  incomeOptions,
  frequencyMenuItems,
  pageNumber,
  isUnder16,
}: IncomeSectionProps) => {
  const intl = useIntl();
  const watchHasIncome = watch('hasIncome');
  const hasTruthyIncome = watchHasIncome === 'true';

  const getIncomeStreamError = (index: number, fieldName: string) => {
    const incomeStreamsErrors = errors.incomeStreams as any;
    return incomeStreamsErrors?.[index]?.[fieldName];
  };

  const incomeStreamsMenuItems = createMenuItems(
    incomeOptions,
    <FormattedMessage id="personIncomeBlock.createMenuItems-disabledSelectMenuItem" defaultMessage="Select" />,
  );

  const translatedAriaLabel = intl.formatMessage({
    id: 'householdDataBlock.createIncomeRadioQuestion-ariaLabel',
    defaultMessage: 'has an income',
  });

  const formattedMsgId =
    pageNumber === 1 ? 'questions.hasIncome' : 'householdDataBlock.createIncomeRadioQuestion-questionLabel';

  const formattedMsgDefaultMsg =
    pageNumber === 1
      ? 'Do you have an income?'
      : 'Does this individual in your household have significant income you have not already included?';

  const getIncomeStreamSourceLabel = (incomeStreamName: string) => {
    if (incomeStreamName) {
      return (
        <>
          {'('}
          {incomeOptions[incomeStreamName]}
          {')'}?
        </>
      );
    }
    return '?';
  };

  const renderIncomeStreamNameSelect = (index: number) => (
    <FormControl
      sx={{ minWidth: '13.125rem', maxWidth: '100%' }}
      error={getIncomeStreamError(index, 'incomeStreamName') !== undefined}
    >
      <InputLabel id={`income-type-label-${index}`}>
        <FormattedMessage
          id="personIncomeBlock.createIncomeStreamsDropdownMenu-inputLabel"
          defaultMessage="Income Type"
        />
      </InputLabel>
      <Controller
        name={`incomeStreams.${index}.incomeStreamName`}
        control={control}
        render={({ field }) => (
          <>
            <Select
              {...field}
              labelId={`income-type-label-${index}`}
              id={`incomeStreams.${index}.incomeStreamName`}
              label={
                <FormattedMessage
                  id="personIncomeBlock.createIncomeStreamsDropdownMenu-inputLabel"
                  defaultMessage="Income Type"
                />
              }
              sx={{ backgroundColor: '#fff' }}
            >
              {incomeStreamsMenuItems}
            </Select>
            {getIncomeStreamError(index, 'incomeStreamName') !== undefined && (
              <FormHelperText sx={{ ml: 0 }}>
                <ErrorMessageWrapper fontSize="1rem">
                  {getIncomeStreamError(index, 'incomeStreamName')?.message ?? ''}
                </ErrorMessageWrapper>
              </FormHelperText>
            )}
          </>
        )}
      />
    </FormControl>
  );

  const renderIncomeFrequencySelect = (selectedIncomeSource: string, index: number) => {
    let formattedMsgId = 'personIncomeBlock.createIncomeStreamFrequencyDropdownMenu-youQLabel';
    let formattedMsgDefaultMsg = 'How often are you paid this income ';
    if (pageNumber !== 1) {
      formattedMsgId = 'personIncomeBlock.createIncomeStreamFrequencyDropdownMenu-questionLabel';
      formattedMsgDefaultMsg = 'How often are they paid this income ';
    }

    return (
      <div>
        <div className="income-margin-bottom">
          <QuestionQuestion>
            <FormattedMessage id={formattedMsgId} defaultMessage={formattedMsgDefaultMsg} />
            {getIncomeStreamSourceLabel(selectedIncomeSource)}
            <HelpButton>
              <FormattedMessage
                id="personIncomeBlock.income-freq-help-text"
                defaultMessage='"Every 2 weeks" means you get paid every other week. "Twice a month" means you get paid two times a month on the same dates each month.'
              />
            </HelpButton>
          </QuestionQuestion>
        </div>
        <FormControl
          sx={{ minWidth: '13.125rem', maxWidth: '100%' }}
          error={getIncomeStreamError(index, 'incomeFrequency') !== undefined}
        >
          <InputLabel id={`income-frequency-label-${index}`}>
            <FormattedMessage
              id="personIncomeBlock.createIncomeStreamFrequencyDropdownMenu-freqLabel"
              defaultMessage="Frequency"
            />
          </InputLabel>
          <Controller
            name={`incomeStreams.${index}.incomeFrequency`}
            control={control}
            render={({ field }) => (
              <>
                <Select
                  {...field}
                  labelId={`income-frequency-label-${index}`}
                  id={`incomeStreams.${index}.incomeFrequency`}
                  label={
                    <FormattedMessage
                      id="personIncomeBlock.createIncomeStreamFrequencyDropdownMenu-freqLabel"
                      defaultMessage="Frequency"
                    />
                  }
                  sx={{ backgroundColor: '#fff' }}
                >
                  {frequencyMenuItems}
                </Select>
                {getIncomeStreamError(index, 'incomeFrequency') !== undefined && (
                  <FormHelperText sx={{ ml: 0 }}>
                    <ErrorMessageWrapper fontSize="1rem">
                      {getIncomeStreamError(index, 'incomeFrequency')?.message ?? ''}
                    </ErrorMessageWrapper>
                  </FormHelperText>
                )}
              </>
            )}
          />
        </FormControl>
      </div>
    );
  };

  const renderHoursPerWeekTextfield = (index: number, selectedIncomeSource: string) => {
    let formattedMsgId = 'personIncomeBlock.createHoursWorkedTextfield-youQLabel';
    let formattedMsgDefaultMsg = 'How many hours do you work per week ';
    if (pageNumber !== 1) {
      formattedMsgId = 'personIncomeBlock.createHoursWorkedTextfield-questionLabel';
      formattedMsgDefaultMsg = 'How many hours do they work per week ';
    }

    return (
      <>
        <div className="income-margin-bottom">
          <QuestionQuestion>
            <FormattedMessage id={formattedMsgId} defaultMessage={formattedMsgDefaultMsg} />
            {getIncomeStreamSourceLabel(selectedIncomeSource)}
          </QuestionQuestion>
        </div>
        <Controller
          name={`incomeStreams.${index}.hoursPerWeek`}
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <>
              <NumericFormat
                value={field.value === '' ? '' : field.value}
                onValueChange={({ floatValue }) => field.onChange(floatValue ?? 0)}
                allowNegative={false}
                decimalScale={0}
                customInput={TextField}
                label={
                  <FormattedMessage id="incomeBlock.createHoursWorkedTextfield-amountLabel" defaultMessage="Hours" />
                }
                variant="outlined"
                inputProps={{ inputMode: 'numeric' }}
                sx={{ backgroundColor: '#fff' }}
                error={getIncomeStreamError(index, 'hoursPerWeek') !== undefined}
              />
              {getIncomeStreamError(index, 'hoursPerWeek') !== undefined && (
                <FormHelperText sx={{ ml: 0 }}>
                  <ErrorMessageWrapper fontSize="1rem">
                    {getIncomeStreamError(index, 'hoursPerWeek')?.message ?? ''}
                  </ErrorMessageWrapper>
                </FormHelperText>
              )}
            </>
          )}
        />
      </>
    );
  };

  const renderIncomeAmountTextfield = (
    index: number,
    selectedIncomeFrequency: string,
    selectedIncomeStreamSource: string,
  ) => {
    let questionHeader;
    if (selectedIncomeFrequency === 'hourly') {
      let hourlyFormattedMsgId = 'incomeBlock.createIncomeAmountTextfield-hourly-questionLabel';
      let hourlyFormattedMsgDefaultMsg = 'What is your hourly rate ';
      if (pageNumber !== 1) {
        hourlyFormattedMsgId = 'personIncomeBlock.createIncomeAmountTextfield-hourly-questionLabel';
        hourlyFormattedMsgDefaultMsg = 'What is their hourly rate ';
      }
      questionHeader = <FormattedMessage id={hourlyFormattedMsgId} defaultMessage={hourlyFormattedMsgDefaultMsg} />;
    } else {
      let payPeriodFormattedMsgId = 'incomeBlock.createIncomeAmountTextfield-questionLabel';
      let payPeriodFormattedMsgDefaultMsg = 'How much do you receive before taxes each pay period for ';
      if (pageNumber !== 1) {
        payPeriodFormattedMsgId = 'personIncomeBlock.createIncomeAmountTextfield-questionLabel';
        payPeriodFormattedMsgDefaultMsg = 'How much do they receive before taxes each pay period for ';
      }
      questionHeader = (
        <FormattedMessage id={payPeriodFormattedMsgId} defaultMessage={payPeriodFormattedMsgDefaultMsg} />
      );
    }

    return (
      <div>
        <div className="income-textfield-margin-bottom">
          <QuestionQuestion>
            {questionHeader}
            {getIncomeStreamSourceLabel(selectedIncomeStreamSource)}
          </QuestionQuestion>
        </div>
        <Controller
          name={`incomeStreams.${index}.incomeAmount`}
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <>
              <NumericFormat
                value={field.value === '' ? '' : field.value}
                onValueChange={({ floatValue }) => field.onChange(floatValue ?? 0)}
                thousandSeparator
                allowNegative={false}
                decimalScale={0}
                customInput={TextField}
                label={
                  <FormattedMessage
                    id="personIncomeBlock.createIncomeAmountTextfield-amountLabel"
                    defaultMessage="Amount"
                  />
                }
                variant="outlined"
                inputProps={{ inputMode: 'numeric' }}
                sx={{ backgroundColor: '#fff' }}
                error={getIncomeStreamError(index, 'incomeAmount') !== undefined}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  sx: { backgroundColor: '#FFFFFF' },
                }}
              />
              {getIncomeStreamError(index, 'incomeAmount') !== undefined && (
                <FormHelperText sx={{ ml: 0 }}>
                  <ErrorMessageWrapper fontSize="1rem">
                    {getIncomeStreamError(index, 'incomeAmount')?.message ?? ''}
                  </ErrorMessageWrapper>
                </FormHelperText>
              )}
            </>
          )}
        />
      </div>
    );
  };

  return (
    <Box id="income-section" className="section-container">
      <div className="section">
        <QuestionQuestion>
          <FormattedMessage id={formattedMsgId} defaultMessage={formattedMsgDefaultMsg} />
          <HelpButton>
            <FormattedMessage
              id="householdDataBlock.createIncomeRadioQuestion-questionDescription"
              defaultMessage="This includes money from jobs, alimony, investments, or gifts. Income is the money earned or received before deducting taxes"
            />
          </HelpButton>
        </QuestionQuestion>
        {pageNumber === 1 && (
          <QuestionDescription>
            <FormattedMessage
              id="householdDataBlock.createIncomeRadioQuestion-questionDescription.you"
              defaultMessage="Enter income for yourself. You can enter income for other household members later."
            />
          </QuestionDescription>
        )}
        <Controller
          name="hasIncome"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <RadioGroup {...field} aria-label={translatedAriaLabel}>
              <FormControlLabel
                value={'true'}
                control={<Radio />}
                label={<FormattedMessage id="radiofield.label-yes" defaultMessage="Yes" />}
              />
              <FormControlLabel
                value={'false'}
                control={<Radio />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <FormattedMessage id="radiofield.label-no" defaultMessage="No" />
                    {watchHasIncome === 'false' && !isUnder16 && (
                      <Box component="span" sx={{ fontSize: '0.875rem', color: 'text.secondary', ml: 1 }}>
                        <FormattedMessage
                          id="householdDataBlock.createIncomeRadioQuestion-noIncomeDisclaimer"
                          defaultMessage="Income affects benefits. We can be more accurate if you tell us significant household income."
                        />
                      </Box>
                    )}
                  </Box>
                }
              />
            </RadioGroup>
          )}
        />

        <Stack sx={{ margin: fields.length > 0 || hasTruthyIncome ? '1.5rem 0 0' : 0 }}>
          {fields.map((field, index) => {
            const selectedIncomeStreamSource = watch('incomeStreams')[index].incomeStreamName;
            const selectedIncomeFrequency = watch('incomeStreams')[index].incomeFrequency;

            return (
              <div className="section-container income-block-container" key={field.id}>
                <div className={index % 2 === 0 ? 'section' : ''}>
                  {index !== 0 && (
                    <div className="delete-button-container">
                      <CloseButton handleClose={() => remove(index)} />
                    </div>
                  )}
                  <div>
                    {index === 0 && (
                      <div className="income-margin-bottom">
                        <QuestionQuestion>
                          <FormattedMessage
                            id={pageNumber === 1 ? 'questions.hasIncome-a' : 'personIncomeBlock.return-questionLabel'}
                            defaultMessage={
                              pageNumber === 1
                                ? 'What type of income have you had most recently?'
                                : 'What type of income have they had most recently?'
                            }
                          />
                          <HelpButton>
                            <FormattedMessage
                              id="personIncomeBlock.return-questionDescription"
                              defaultMessage="Answer the best you can. You will be able to include additional types of income. The more you include, the more accurate your results will be."
                            />
                          </HelpButton>
                        </QuestionQuestion>
                      </div>
                    )}
                    {index !== 0 && (
                      <div className="income-margin-bottom">
                        <QuestionQuestion>
                          <span className="income-stream-q-padding">
                            <FormattedMessage
                              id={
                                pageNumber === 1
                                  ? 'incomeBlock.createIncomeBlockQuestions-questionLabel'
                                  : 'personIncomeBlock.createIncomeBlockQuestions-questionLabel'
                              }
                              defaultMessage={
                                pageNumber === 1
                                  ? 'If you receive another type of income, select it below.'
                                  : 'If they receive another type of income, select it below.'
                              }
                            />
                          </span>
                        </QuestionQuestion>
                      </div>
                    )}
                    {renderIncomeStreamNameSelect(index)}
                    {renderIncomeFrequencySelect(selectedIncomeStreamSource, index)}
                    {selectedIncomeFrequency === 'hourly' &&
                      renderHoursPerWeekTextfield(index, selectedIncomeStreamSource)}
                    {renderIncomeAmountTextfield(index, selectedIncomeFrequency, selectedIncomeStreamSource)}
                  </div>
                </div>
              </div>
            );
          })}
          {hasTruthyIncome && (
            <div>
              <Button
                variant="outlined"
                onClick={() => append(EMPTY_INCOME_STREAM as any)}
                startIcon={<AddIcon />}
                type="button"
              >
                <FormattedMessage id="personIncomeBlock.return-addIncomeButton" defaultMessage="Add another income" />
              </Button>
            </div>
          )}
        </Stack>
      </div>
    </Box>
  );
};

export default IncomeSection;
