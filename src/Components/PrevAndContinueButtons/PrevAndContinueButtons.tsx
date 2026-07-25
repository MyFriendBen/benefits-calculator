import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import PreviousButton from '../PreviousButton/PreviousButton';
import FormContinueButton from '../ContinueButton/FormContinueButton';

type PrevAndContinueButtonsProps = {
  backNavigationFunction: () => void;
  disabled?: boolean;
  // Passed through to the back event's step slug (household sub-pages only).
  stepNameOverride?: string;
};

const PrevAndContinueButtons = ({ backNavigationFunction, disabled, stepNameOverride }: PrevAndContinueButtonsProps) => {
  return (
    <div className="question-buttons">
      <PreviousButton navFunction={backNavigationFunction} stepNameOverride={stepNameOverride} />
      <FormContinueButton
        variant="outlined"
        endIcon={<NavigateNextIcon sx={{ ml: '-8px' }} className="rtl-mirror" />}
        disabled={disabled}
      />
    </div>
  );
};

export default PrevAndContinueButtons;
