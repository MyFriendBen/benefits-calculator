import { PropsWithChildren, useContext } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Context } from '../Wrapper/Wrapper';
import { ALL_VALID_WHITE_LABELS, WhiteLabel } from '../../Types/WhiteLabel';

type Props = PropsWithChildren<{
  whiteLabel?: string;
}>;

const REFERRER_REDIRECT: { [key: string]: string | undefined } = {
  bayaud: 'co',
  bia: 'co',
  brightbytext: 'co',
  broomfield: 'co',
  cch: 'co',
  ccig: 'co',
  cedp: 'co',
  frca: 'co',
  ACTIONCenter: 'co',
  jeffcoHS: 'co',
  jeffcoHSCM: 'co',
  '211co': 'co',
  villageExchange: 'co',
  achs: 'co',
  arapahoectypublichealth: 'co',
  denverhealth: 'co',
  dhs: 'co',
  DPSCommunityHubs: 'co',
  fircsummitresourcecenter: 'co',
  salud: 'co',
  theactioncenter: 'co',
  thegatheringplace: 'co',
  childfirst: 'co',
  eaglecounty: 'co',
};

export default function RedirectToWhiteLabel({ whiteLabel, children }: Props) {
  const { formData } = useContext(Context);
  const location = useLocation();

  let redirectWhiteLabel: string;

  const referrerWhiteLabel = REFERRER_REDIRECT[formData.immutableReferrer ?? ''];
  if (whiteLabel !== undefined) {
    redirectWhiteLabel = '/' + whiteLabel;
  } else if (formData.immutableReferrer === undefined) {
    // wait for the referral source to be set before
    // trying to set the white label based on referrer
    return null;
  } else if (referrerWhiteLabel !== undefined) {
    // redirect legacy referrers to the correct white label
    redirectWhiteLabel = '/' + referrerWhiteLabel;
  } else {
    // if the referrer is not a legacy referrer then render the default component
    return <>{children}</>;
  }

  const url = `${redirectWhiteLabel}${location.pathname}${location.search}`;

  return <Navigate to={url} replace />;
}

export function useUpdateWhiteLabelAndNavigate() {
  const { setWhiteLabel } = useContext(Context);
  const navigate = useNavigate();

  return (whiteLabel: string, url: string, replace: boolean = false) => {
    // Validate white label before setting it
    if (ALL_VALID_WHITE_LABELS.includes(whiteLabel as WhiteLabel)) {
      setWhiteLabel(whiteLabel);
      navigate(url, { replace: replace });
    } else {
      console.error(`Invalid white label: ${whiteLabel}`);
      // Navigate without setting white label (will use default)
      navigate(url, { replace: replace });
    }
  };
}
