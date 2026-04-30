import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import PreviousButton from '../PreviousButton/PreviousButton';
import FormContinueButton from '../ContinueButton/FormContinueButton';

type PrevAndContinueButtonsProps = {
  backNavigationFunction: () => void;
};

const PrevAndContinueButtons = ({ backNavigationFunction }: PrevAndContinueButtonsProps) => {
  return (
    <div className="question-buttons">
      <PreviousButton navFunction={backNavigationFunction} />
      <FormContinueButton
        variant="outlined"
        endIcon={<NavigateNextIcon sx={{ ml: '-8px' }} className="rtl-mirror" />}
      />
    </div>
  );
};

export default PrevAndContinueButtons;
