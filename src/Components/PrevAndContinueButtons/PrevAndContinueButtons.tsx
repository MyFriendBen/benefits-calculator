import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import PreviousButton from '../PreviousButton/PreviousButton';
import FormContinueButton from '../ContinueButton/FormContinueButton';

type PrevAndContinueButtonsProps = {
  backNavigationFunction: () => void;
  disabled?: boolean;
};

const PrevAndContinueButtons = ({ backNavigationFunction, disabled }: PrevAndContinueButtonsProps) => {
  return (
    <div className="question-buttons">
      <PreviousButton navFunction={backNavigationFunction} />
      <FormContinueButton
        variant="outlined"
        endIcon={<NavigateNextIcon sx={{ ml: '-8px' }} className="rtl-mirror" />}
        disabled={disabled}
      />
    </div>
  );
};

export default PrevAndContinueButtons;
