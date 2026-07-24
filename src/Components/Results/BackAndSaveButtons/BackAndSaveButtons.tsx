import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import LeftArrowIcon from '@mui/icons-material/KeyboardArrowLeft';
import SaveIcon from '@mui/icons-material/SaveOutlined';
import { FormattedMessageType } from '../../../Types/Questions';
import SaveMyResultsModal from '../SaveMyResultsModal/SaveMyResultsModal';
import { useTrackEvent } from '../../../Assets/analytics';
import './BackAndSaveButtons.css';

type BackAndSaveButtons = {
  navigateToLink: string;
  BackToThisPageText: FormattedMessageType;
  // Fired on back-button click before navigating. Optional because this
  // component renders in several places ("Back to Screener", "Back to Results");
  // only the caller that wants analytics passes it (gap #8).
  onBack?: () => void;
};

const BackAndSaveButtons = ({ navigateToLink, BackToThisPageText, onBack }: BackAndSaveButtons) => {
  const navigate = useNavigate();
  const intl = useIntl();
  const track = useTrackEvent();

  const [openSaveModal, setOpenSaveModal] = useState(false);

  const handleToggleSaveModal = () => {
    setOpenSaveModal((prevOpen) => {
      const nextOpen = !prevOpen;
      if (nextOpen) {
        track('screener_results_save', { save_action: 'open' });
      }
      return nextOpen;
    });
  };
  const backBtnALProps = {
    id: 'backAndSaveBtns.backBtnAL',
    defaultMessage: 'back',
  };
  const saveMyResultsBtnALProps = {
    id: 'backAndSaveBtns.saveMyResultsBtnAL',
    defaultMessage: 'save my results',
  };
  return (
    <div className="results-back-save-btn-container">
      <button
        data-testid="back-to-results-button"
        className="results-back-save-buttons"
        onClick={() => {
          onBack?.();
          navigate(navigateToLink);
        }}
        aria-label={intl.formatMessage(backBtnALProps)}
      >
        <div className="btn-icon-text-container padding-right">
          <LeftArrowIcon />
          {BackToThisPageText}
        </div>
      </button>
      <button
        className="results-back-save-buttons"
        onClick={handleToggleSaveModal}
        aria-label={intl.formatMessage(saveMyResultsBtnALProps)}
      >
        <div className="btn-icon-text-container">
          <FormattedMessage id="results.save-results-btn" defaultMessage="SAVE MY RESULTS" />
          <SaveIcon className="save-icon" />
        </div>
      </button>
      {openSaveModal && <SaveMyResultsModal onClose={() => setOpenSaveModal(false)} />}
    </div>
  );
};

export default BackAndSaveButtons;
