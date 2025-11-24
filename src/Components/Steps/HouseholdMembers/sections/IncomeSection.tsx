import { FormattedMessage } from 'react-intl';
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Control, Controller, UseFieldArrayAppend, UseFieldArrayRemove, FieldArrayWithId, FieldErrors } from 'react-hook-form';
import QuestionQuestion from '../../../QuestionComponents/QuestionQuestion';
import QuestionDescription from '../../../QuestionComponents/QuestionDescription';
import HelpButton from '../../../HelpBubbleIcon/HelpButton';
import ErrorMessageWrapper from '../../../ErrorMessage/ErrorMessageWrapper';
import { createMenuItems } from '../../SelectHelperFunctions/SelectHelperFunctions';
import { FormattedMessageType } from '../../../../Types/Questions';
import { DOLLARS, handleNumbersOnly, NUM_PAD_PROPS } from '../../../../Assets/numInputHelpers';
import { EMPTY_INCOME_STREAM } from '../utils/types';
import '../styles/HouseholdMemberSections.css';

interface IncomeSectionProps {
  control: Control<any>;
  errors: FieldErrors<any>;
  fields: FieldArrayWithId<any, 'incomeStreams', 'id'>[];
  append: UseFieldArrayAppend<any, 'incomeStreams'>;
  remove: UseFieldArrayRemove;
  watch: (name: string) => any;
  setValue: (name: any, value: any) => void;
  incomeCategories: Record<string, FormattedMessageType>;
  incomeOptions: Record<string, Record<string, FormattedMessageType>>;
  frequencyMenuItems: JSX.Element[];
}

const IncomeSection = ({
  control,
  errors,
  fields,
  append,
  remove,
  watch,
  setValue,
  incomeCategories,
  incomeOptions,
  frequencyMenuItems,
}: IncomeSectionProps) => {
  const incomeCategoriesMenuItems = createMenuItems(
    incomeCategories,
    <FormattedMessage id="personIncomeBlock.createMenuItems-disabledSelectCategory" defaultMessage="Select category" />,
  );

  // Helper to safely get error for income stream field
  const getIncomeStreamError = (index: number, fieldName: string) => {
    const incomeStreamsErrors = errors.incomeStreams as any;
    return incomeStreamsErrors?.[index]?.[fieldName];
  };

  return (
    <Box id="income-section" className="section">
      <QuestionQuestion>
        <FormattedMessage id="householdDataBlock.incomeSources" defaultMessage="Income Sources" />
        <HelpButton>
          <FormattedMessage
            id="householdDataBlock.createIncomeRadioQuestion-questionDescription"
            defaultMessage="This includes money from jobs, alimony, investments, or gifts. Income is the money earned or received before deducting taxes"
          />
        </HelpButton>
      </QuestionQuestion>
      <QuestionDescription>
        <FormattedMessage
          id="householdDataBlock.incomeSourcesDescription"
          defaultMessage="Enter income for yourself. You can enter income for other household members later."
        />
      </QuestionDescription>
      {errors.incomeStreams && (
        <FormHelperText sx={{ ml: 0, mb: 1 }}>
          <ErrorMessageWrapper fontSize="var(--error-message-font-size)">
            <FormattedMessage
              id="householdDataBlock.incomeStreamsError"
              defaultMessage="Please complete all income fields or remove this income source."
            />
          </ErrorMessageWrapper>
        </FormHelperText>
      )}
      <Stack spacing={2} sx={{ marginTop: '0.5rem' }}>
        {fields.map((field, index) => {
          return (
            <Box key={field.id} className="income-box">
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                {/* First Row: Income Category */}
                <Box sx={{ width: '100%' }}>
                  <Typography className="form-field-label">
                    <FormattedMessage id="personIncomeBlock.incomeCategory" defaultMessage="Income Category" />
                  </Typography>
                  <FormControl
                    fullWidth
                    size="small"
                    error={getIncomeStreamError(index, 'incomeCategory') !== undefined}
                  >
                    <Controller
                      name={`incomeStreams.${index}.incomeCategory`}
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          displayEmpty
                          sx={{ backgroundColor: '#fff' }}
                          onChange={(e) => {
                            field.onChange(e);
                            setValue(`incomeStreams.${index}.incomeStreamName`, '');
                          }}
                        >
                          {incomeCategoriesMenuItems}
                        </Select>
                      )}
                    />
                  </FormControl>
                </Box>

                {/* Second Row: Specific Type, Amount, Frequency */}
                <Box sx={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <Box sx={{ flex: '1 1 200px', minWidth: '150px' }}>
                    <Typography className="form-field-label">
                      <FormattedMessage id="personIncomeBlock.specificType" defaultMessage="Specific Type" />
                    </Typography>
                    <FormControl
                      fullWidth
                      size="small"
                      error={getIncomeStreamError(index, 'incomeStreamName') !== undefined}
                    >
                      <Controller
                        name={`incomeStreams.${index}.incomeStreamName`}
                        control={control}
                        render={({ field }) => {
                          const selectedCategory = watch('incomeStreams')[index]?.incomeCategory;
                          const categoryOptions = selectedCategory && incomeOptions[selectedCategory]
                            ? incomeOptions[selectedCategory]
                            : {};
                          const specificTypeMenuItems = createMenuItems(
                            categoryOptions,
                            <FormattedMessage id="personIncomeBlock.createMenuItems-disabledSelectType" defaultMessage="Select type" />,
                          );

                          return (
                            <Select
                              {...field}
                              displayEmpty
                              sx={{ backgroundColor: '#fff' }}
                              disabled={!selectedCategory}
                            >
                              {specificTypeMenuItems}
                            </Select>
                          );
                        }}
                      />
                    </FormControl>
                  </Box>

                  <Box sx={{ flex: '1 1 150px', minWidth: '120px' }}>
                    <Typography className="form-field-label">
                      <FormattedMessage id="personIncomeBlock.preTaxAmount" defaultMessage="Pre-Tax Amount" />
                    </Typography>
                    <Controller
                      name={`incomeStreams.${index}.incomeAmount`}
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          size="small"
                          variant="outlined"
                          placeholder="0.00"
                          inputProps={NUM_PAD_PROPS}
                          onChange={handleNumbersOnly(field.onChange, DOLLARS)}
                          sx={{ backgroundColor: '#fff' }}
                          error={getIncomeStreamError(index, 'incomeAmount') !== undefined}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                          }}
                        />
                      )}
                    />
                  </Box>

                  <Box sx={{ flex: '1 1 150px', minWidth: '120px' }}>
                    <Typography className="form-field-label">
                      <FormattedMessage id="personIncomeBlock.frequency" defaultMessage="Frequency" />
                    </Typography>
                    <FormControl
                      fullWidth
                      size="small"
                      error={getIncomeStreamError(index, 'incomeFrequency') !== undefined}
                    >
                      <Controller
                        name={`incomeStreams.${index}.incomeFrequency`}
                        control={control}
                        render={({ field }) => (
                          <Select {...field} displayEmpty sx={{ backgroundColor: '#fff' }}>
                            {frequencyMenuItems}
                          </Select>
                        )}
                      />
                    </FormControl>
                  </Box>
                </Box>
              </Box>

              <IconButton
                onClick={() => remove(index)}
                sx={{ marginTop: '1.5rem' }}
                aria-label="delete income source"
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          );
        })}

        <Button
          variant="outlined"
          fullWidth
          onClick={() => append(EMPTY_INCOME_STREAM as any)}
          startIcon={<AddIcon />}
          type="button"
          className="income-button"
        >
          <FormattedMessage id="personIncomeBlock.return-addIncomeButton" defaultMessage="+ Add Another Income Source" />
        </Button>
      </Stack>
    </Box>
  );
};

export default IncomeSection;
