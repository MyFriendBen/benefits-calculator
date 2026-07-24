import { Button } from '@mui/material';
import { useContext, useEffect } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useNavigate } from 'react-router';
import ccigLandingPageImage from '../../Assets/States/CO/WhiteLabels/CCIG/ccigLandingPage.png';
import { useQueryString } from '../QuestionComponents/questionHooks';
import { Context } from '../Wrapper/Wrapper';
import './CcigLandingPage.css';

export default function CcigLandingPage() {
  const { setFormData } = useContext(Context);
  const navigate = useNavigate();
  const { formatMessage } = useIntl();
  const queryString = useQueryString();

  useEffect(() => {
    setFormData((prevFormData) => ({ ...prevFormData, immutableReferrer: 'ccig', referralSource: 'ccig' }));
  }, [setFormData]);

  const handleGetStarted = () => {
    navigate(`/co/step-1${queryString}`);
  };

  return (
    <main className="benefits-form ccig-landing-page-container">
      <img
        src={ccigLandingPageImage}
        alt={formatMessage({
          id: 'ccig.landingPage.image.alt',
          defaultMessage: 'CDIG in partnership with myfriendben',
        })}
        className="ccig-landing-page-logo"
      />
      <p className="ccig-landing-page-text">
        <FormattedMessage
          id="ccig.landingPage.text.1"
          defaultMessage="Welcome to the final part of the application process for the Colorado Design Insight Group!"
        />
      </p>
      <p className="ccig-landing-page-text">
        <FormattedMessage
          id="ccig.landingPage.text.2"
          defaultMessage="Thank you again for your interest in joining CDIG. This last section of the application will help us learn more about your family demographics, income, and benefits that you have experience with. This information is helpful to help match you to insight sessions to improve programs, initiatives, and policies."
        />
      </p>
      <p className="ccig-landing-page-text">
        <FormattedMessage
          id="ccig.landingPage.text.3"
          defaultMessage="Please take your time to fully complete all the questions this screener."
        />
      </p>
      <p className="ccig-landing-page-text">
        <FormattedMessage
          id="ccig.landingPage.text.4"
          defaultMessage="At the end of the screener, you will also learn about additional benefits and programs that you and your family could qualify for!"
        />
      </p>
      <p className="ccig-landing-page-text">
        <FormattedMessage
          id="ccig.landingPage.text.5"
          defaultMessage="If you have any questions or need assistance, please email us at cdig@garycommunity.org."
        />
      </p>
      <Button variant="contained" onClick={handleGetStarted}>
        <FormattedMessage id="jeffco-getStarted-button" defaultMessage="Get Started" />
      </Button>
    </main>
  );
}
