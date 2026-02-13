import { useParams, useLocation } from 'react-router';
import { FormattedMessage, useIntl } from 'react-intl';
import LinearProgress from '@mui/material/LinearProgress';
import { STARTING_QUESTION_NUMBER, useStepDirectory } from '../../Assets/stepDirectory';
import { useContext, useEffect } from 'react';
import { Context } from '../Wrapper/Wrapper';
import dataLayerPush from '../../Assets/analytics';
import './ProgressBar.css';
import { useReorderLanguage, useTranslateNumber } from '../../Assets/languageOptions';

interface ProgressBarProps {
  step?: number;
}

const ProgressBar = ({ step }: ProgressBarProps) => {
  const { theme } = useContext(Context);
  const stepDirectory = useStepDirectory();
  const totalSteps = stepDirectory.length + STARTING_QUESTION_NUMBER;
  const { id, uuid } = useParams();
  const location = useLocation();
  const intl = useIntl();
  const translateNumber = useTranslateNumber();

  const progressBarTranslatedAL = {
    id: 'progressBar.ariaLabel',
    defaultMessage: 'progress bar',
  };

  useEffect(() => {
    dataLayerPush({ event: 'config', user_id: uuid });
  }, [uuid]);

  // Extract step number from URL pathname (e.g., /step-1, /step-3, etc.)
  const getStepFromPath = () => {
    const match = location.pathname.match(/step-(\d+)/);
    return match ? Number(match[1]) : null;
  };

  let stepValue = step ?? id ?? getStepFromPath() ?? 0;

  const stepText = useReorderLanguage(
    [
      <FormattedMessage id="confirmation.return-stepLabel" defaultMessage="Step " key="0" />,
      translateNumber(stepValue),
      <FormattedMessage id="confirmation.return-ofLabel" defaultMessage=" of " key="1" />,
      translateNumber(totalSteps),
    ],
    { my: [0, 3, 2, 1] },
  );

  // Don't render progress bar if we're not on a valid step page
  if (!stepValue || Number(stepValue) <= 0) {
    return null;
  }

  let progressPercentage: number = ((Number(stepValue) - 1) / (totalSteps - 1)) * 100;

  const progressBarStyles = {
    marginBottom: '5px',
    backgroundColor: '#d6d6d6c4',
    borderRadius: '500rem;',
    height: '1rem',
    '& .MuiLinearProgress-bar': {
      background: theme.progressBarColor,
      borderRadius: '500rem;',
    },
  };

  return (
    <aside className="progress-bar-container">
      <LinearProgress
        sx={progressBarStyles}
        variant="determinate"
        value={progressPercentage}
        className="progress-bar rtl-mirror"
        aria-label={intl.formatMessage(progressBarTranslatedAL)}
      />
      <p className="step-progress-title">{stepText}</p>
    </aside>
  );
};

export default ProgressBar;
