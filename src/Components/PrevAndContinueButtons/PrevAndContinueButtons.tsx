import { ButtonProps } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import PreviousButton from '../PreviousButton/PreviousButton';
import FormContinueButton from '../ContinueButton/FormContinueButton';

type PrevAndContinueButtonsProps = {
  backNavigationFunction: () => void;
  disabled?: boolean;
  // Steps can promote Continue to the primary (filled) action; defaults to the
  // shared outlined style used elsewhere in the screener.
  continueVariant?: ButtonProps['variant'];
  // Passed through to the back event's step slug (household sub-pages only).
  stepNameOverride?: string;
};

const PrevAndContinueButtons = ({ backNavigationFunction, disabled, continueVariant = 'outlined', stepNameOverride }: PrevAndContinueButtonsProps) => {
  return (
    <div className="question-buttons">
      <PreviousButton navFunction={backNavigationFunction} stepNameOverride={stepNameOverride} />
      <FormContinueButton
        variant={continueVariant}
        endIcon={<NavigateNextIcon sx={{ ml: '-8px' }} className="rtl-mirror" />}
        disabled={disabled}
      />
    </div>
  );
};

export default PrevAndContinueButtons;
