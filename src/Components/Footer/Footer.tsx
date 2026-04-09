import Paper from '@mui/material/Paper';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import FacebookIcon from '@mui/icons-material/Facebook';
import SvgIcon from '@mui/material/SvgIcon';
import { useContext, useState } from 'react';
import { Context } from '../Wrapper/Wrapper';
import { useConfig, useLocalizedLink } from '../Config/configHook';
import { FormattedMessage } from 'react-intl';
import './Footer.css';
import { useLogo } from '../Referrer/useLogo';
import ShareModal from '../Results/ShareModal/ShareModal';

const InstagramIcon = () => (
  <SvgIcon sx={{ color: '#fff', fontSize: '1.25rem' }} viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </SvgIcon>
);

const SOCIAL_LINKS = {
  linkedin: 'https://www.linkedin.com/company/myfriendben/posts/?feedView=all',
  facebook: 'https://www.facebook.com/p/My-Friend-Ben-61553295617598/',
  instagram: 'https://www.instagram.com/myfriendbenorg/',
};

interface FooterProps {
  hideServiceLinks?: boolean;
}

const Footer = ({ hideServiceLinks }: FooterProps) => {
  const privacyPolicyLink = useLocalizedLink('privacy_policy');
  const termsAndConditionsLink = useLocalizedLink('consent_to_contact');
  const context = useContext(Context);
  const { getReferrer, theme } = context;
  const { email, survey } = useConfig<{ email: string; survey: string }>('feedback_links');

  const [shareOpen, setShareOpen] = useState(false);

  const baseLogoClass = 'logo footer-logo';
  const footerLogoClass = getReferrer('footerLogoClass', '');
  const logoClassName = footerLogoClass ? `${baseLogoClass} ${footerLogoClass}` : baseLogoClass;

  return (
    <footer>
      <Paper elevation={0} sx={{ width: '100%', backgroundColor: theme.footerColor, color: '#ffffff' }} square={true}>
        <div className="footer-content-container">
          <div>{useLogo('logoFooterSource', 'logoFooterAlt', logoClassName)}</div>
          <div className="footer-feedback-buttons">
            <button className="footer-feedback-button" onClick={() => setShareOpen(true)}>
              <FormattedMessage id="shareMfbButton" defaultMessage="SHARE MFB" />
            </button>
            <a className="footer-feedback-button" href={survey} target="_blank" rel="noreferrer">
              <FormattedMessage id="reportABugButton" defaultMessage="REPORT AN ISSUE" />
            </a>
            <a className="footer-feedback-button" href={`mailto:${email}`}>
              <FormattedMessage id="contactUsButton" defaultMessage="CONTACT US" />
            </a>
          </div>
          <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} />
        </div>
        {!hideServiceLinks && (
          <div className="footer-bottom-bar">
            <div className="footer-policy-links">
              <a href="https://www.myfriendben.org/about-us/" target="_blank" rel="noreferrer" className="policy-link">
                <FormattedMessage id="footer.aboutUs" defaultMessage="About Us" />
              </a>
              <a href={privacyPolicyLink} target="_blank" rel="noreferrer" className="policy-link">
                <FormattedMessage id="footer.privacyPolicy" defaultMessage="Privacy" />
              </a>
              <a href={termsAndConditionsLink} target="_blank" rel="noreferrer" className="policy-link">
                <FormattedMessage id="footer.termsAndConditions" defaultMessage="Terms" />
              </a>
            </div>
            <div className="footer-social-icons">
              <a href={SOCIAL_LINKS.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn">
                <LinkedInIcon sx={{ color: '#fff', fontSize: '1.5rem' }} />
              </a>
              <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noreferrer" aria-label="Facebook">
                <FacebookIcon sx={{ color: '#fff', fontSize: '1.5rem' }} />
              </a>
              <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
                <InstagramIcon />
              </a>
            </div>
          </div>
        )}
      </Paper>
    </footer>
  );
};

export default Footer;
