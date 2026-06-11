import { FormattedMessage } from 'react-intl';
import { Box } from '@mui/material';
import { Control, FieldErrors } from 'react-hook-form';
import QuestionQuestion from '../../../QuestionComponents/QuestionQuestion';
import { FormattedMessageType } from '../../../../Types/Questions';
import { BASIC_INFO_GRID_STYLES } from '../utils/constants';
import { HouseholdMemberFormSchema } from '../utils/schema';
import BasicInfoFields from './BasicInfoFields';
import '../styles/HouseholdMemberSections.css';

interface BasicInfoSectionProps {
  control: Control<HouseholdMemberFormSchema>;
  errors: FieldErrors<HouseholdMemberFormSchema>;
  isFirstMember?: boolean;
  relationshipOptions: Record<string, FormattedMessageType>;
  showSectionHeader?: boolean;
}

const BasicInfoSection = ({
  control,
  errors,
  isFirstMember = false,
  relationshipOptions,
  showSectionHeader = true,
}: BasicInfoSectionProps) => {
  return (
    <Box id="basic-info-section" className="section">
      {showSectionHeader && (
        <QuestionQuestion>
          <FormattedMessage id="householdDataBlock.basicInfo" defaultMessage="Basic Information" />
        </QuestionQuestion>
      )}
      <Box sx={BASIC_INFO_GRID_STYLES}>
        <BasicInfoFields
          control={control as any}
          birthMonthError={errors.birthMonth}
          birthYearError={errors.birthYear}
          relationshipError={errors.relationshipToHH}
          isFirstMember={isFirstMember}
          relationshipOptions={relationshipOptions}
        />
      </Box>
    </Box>
  );
};

export default BasicInfoSection;
