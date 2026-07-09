import { useContext } from 'react';
import { WrapperContext } from '../../Types/WrapperContext';
import { Context } from '../Wrapper/Wrapper';
import { FormattedMessage } from 'react-intl';
import { Icon } from '../Icon/Icon';
import './BackToScreen.css';
import { useNavigate, useParams } from 'react-router-dom';
import dataLayerPush from '../../Assets/analytics';

const BackToScreen = () => {
  const { uuid } = useParams();
  const { formData } = useContext(Context);
  const navigate = useNavigate();
  return (
    <div className="back-to-screen-message">
      <Icon name="triangle-alert" className="back-to-screen-warning-icon" />
      <p>
        <FormattedMessage
          id="backToScreen.message"
          defaultMessage="The following estimates are based on information we got from your tax form. You might be eligible for even more. To check for more benefits and to improve accuracy, review your information and answer a few more questions "
        />
        <a
          className="back-to-screen-message-button"
          onClick={(event) => {
            event.preventDefault();
            dataLayerPush({ event: 'Back To Screen', referrer: formData.immutableReferrer });
            navigate(`/${uuid}/step-1`);
          }}
        >
          <FormattedMessage id="results.openSendResultsButton" defaultMessage="here" />
        </a>
        .
      </p>
    </div>
  );
};

export default BackToScreen;
