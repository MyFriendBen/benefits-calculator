import { useState, useCallback, useEffect } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import IosShareIcon from '@mui/icons-material/IosShare';
import { FormattedMessage } from 'react-intl';
import { useFeatureFlag } from '../Config/configHook';
import ShareModal from './ShareModal';
import './ShareModal.css';

const ShareModalAutoPopup = () => {
  const isShareEnabled = useFeatureFlag('share_popup');
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleRestore = useCallback(() => {
    setIsMinimized(false);
  }, []);

  const handleMinimize = useCallback(() => {
    setIsMinimized(true);
  }, []);

  if (!isShareEnabled || !isVisible || isDismissed) return null;

  if (isMinimized) {
    return (
      <div className="share-modal-chip-container">
        <button
          type="button"
          aria-label="Close share popup"
          className="share-modal-chip-close"
          onClick={() => setIsDismissed(true)}
        >
          <CloseIcon fontSize="inherit" />
        </button>
        <button
          type="button"
          className="share-modal-chip"
          onClick={handleRestore}
          aria-label="Open share options"
        >
          <span className="share-modal-chip-icon" aria-hidden="true">
            <IosShareIcon style={{ fontSize: '1rem' }} />
          </span>
          <span className="share-modal-chip-text">
            <span className="share-modal-chip-title">
              <FormattedMessage id="sharePopup.minimized" defaultMessage="Share MyFriendBen" />
            </span>
            <span className="share-modal-chip-subtitle">
              <FormattedMessage id="sharePopup.minimizedSubtitle" defaultMessage="Help a friend discover benefits" />
            </span>
          </span>
        </button>
      </div>
    );
  }

  return <ShareModal open={true} onClose={handleMinimize} />;
};

export default ShareModalAutoPopup;
