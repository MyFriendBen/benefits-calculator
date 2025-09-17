import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useNavigate, useParams } from 'react-router-dom';
import LeftArrowIcon from '@mui/icons-material/KeyboardArrowLeft';
import { ReactComponent as SaveIcon } from '../../../Assets/save.svg';
import { Modal } from '@mui/material';
import { FormattedMessageType } from '../../../Types/Questions';
import SaveMyResultsModal from '../../SaveMyResultsModal/SaveMyResultsModal';
import './BackAndSaveButtons.css';

type BackAndSaveButtons = {
  navigateToLink: string;
  BackToThisPageText: FormattedMessageType;
};

const BackAndSaveButtons = ({ navigateToLink, BackToThisPageText }: BackAndSaveButtons) => {
  const navigate = useNavigate();
  const { uuid: screenerId } = useParams();
  const intl = useIntl();

  const [openSaveModal, setOpenSaveModal] = useState(false);
  let definedScreenerId = '';
  if (screenerId) {
    definedScreenerId = screenerId;
  }
  const backBtnALProps = {
    id: 'backAndSaveBtns.backBtnAL',
    defaultMessage: 'back',
  };
  const saveMyResultsBtnALProps = {
    id: 'backAndSaveBtns.saveMyResultsBtnAL',
    defaultMessage: 'save my results',
  };
  const emailResultsModalALProps = {
    id: 'backAndSaveBtns.emailResultsModalAL',
    defaultMessage: 'send me my results modal',
  };

  return (
    <div className="results-back-save-btn-container">
      <button
        data-testid="back-to-results-button"
        className="results-back-save-buttons"
        onClick={() => {
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
        onClick={() => setOpenSaveModal(!openSaveModal)}
        aria-label={intl.formatMessage(saveMyResultsBtnALProps)}
      >
        <div className="btn-icon-text-container padding-left">
          <FormattedMessage id="results.save-results-btn" defaultMessage="SAVE MY RESULTS" />
          <SaveIcon className="save-icon" />
        </div>
      </button>
      <Modal open={openSaveModal} aria-label={intl.formatMessage(emailResultsModalALProps)}>
        <SaveMyResultsModal close={() => setOpenSaveModal(!openSaveModal)} />
      </Modal>
    </div>
  );
};

export default BackAndSaveButtons;
