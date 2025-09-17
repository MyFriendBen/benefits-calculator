import MFBDEFAULT from '../../Assets/Logos/mfb_default_logo_header.png';
import MFBCOLogo from '../../Assets/States/CO/Logos/mfb_co_logo.png';
import MFBNCLogo from '../../Assets/States/NC/Logos/mfb_nc_logo.png';
import MFBILLogo from '../../Assets/States/IL/Logos/mfb_il_logo.png';
import MFBMALogo from '../../Assets/States/MA/Logos/mfb_massachusetts_logo.png';
import MFBCOEnergyLogo from '../../Assets/States/CO/Logos/mfb_co_energy_logo.png';
import MFB_NCFooterLogo from '../../Assets/States/NC/Logos/MFB_NCFooterLogo.png';
import BIAMFBLogo from '../../Assets/States/CO/WhiteLabels/BIA/biamfbcombinedlogo.png';
import JHSAMFBLogo from '../../Assets/States/CO/WhiteLabels/JeffcoAssets/jeffcobrand.png';
import JPSMLogo from '../../Assets/States/CO/WhiteLabels/JeffcoAssets/jeffcopublicschoolslogo.png';
import VELogo from '../../Assets/States/CO/WhiteLabels/VillageExchange/villageExchangeLogo.png';
import CCHMFBLogo from '../../Assets/States/CO/WhiteLabels/ColoradoCoalitionHomeless/cchcobrand.png';
import LGSLogo from '../../Assets/States/CO/WhiteLabels/LetsGetSet/lgsLogo.png';
import GACLogo from '../../Assets/States/CO/WhiteLabels/GetAheadColorado/gaclogo.png';
import FIRCLogo from '../../Assets/States/CO/WhiteLabels/FircCobrand/FIRCLogo.png';
import COMFBLogo from '../../Assets/States/CO/Logos/mfb_co_logo.png';
import DHSMFBLogo from '../../Assets/States/CO/WhiteLabels/DenverHumanServices/denverHSLogo.png';
import CCIGLogo from '../../Assets/States/CO/WhiteLabels/CCIG/ccigLogo.png';
import ECMFBLogo from '../../Assets/States/CO/WhiteLabels/EagleCounty/ECMFBLogo.png';
import ACHSMFBLogo from '../../Assets/States/CO/WhiteLabels/AdamsCountyHumanServices/achs.png';
import LC_MFBLogo from '../../Assets/States/CO/WhiteLabels/LarimerCounty/LC_MFBLogo.png';
import TC_MFBLogo from '../../Assets/States/CO/WhiteLabels/TellerCounty/TC_MFBLogo.png';
import PC_MFBLogo from '../../Assets/States/CO/WhiteLabels/PuebloCounty/PC_MFBLogo.png';
import PitkinCounty_MFBLogo from '../../Assets/States/CO/WhiteLabels/PitkenCounty/PitkinCountyLogo.png';
import PoweredByLogo from '../../Assets/Logos/powered_by_mfb.png';
import RewiringAmericaLogo from '../../Assets/States/CO/Logos/rewiring_america_logo.png';
import Broomfield_MFBLogo from '../../Assets/States/CO/WhiteLabels/Broomfield/Broomfield_MFBLogo.png';
import TheActionCenter_MFBLogo from '../../Assets/States/CO/WhiteLabels/TheActionCenter/TheActionCenter_MFBLogo.png';
import CESN_Logo_English from '../../Assets/States/CO/WhiteLabels/co_energy_calculator/CESN_logo_English.png';
import CESN_Logo_Spanish from '../../Assets/States/CO/WhiteLabels/co_energy_calculator/CESN_logo_Spanish.png';
import HispanicFederation_MFBLogo from '../../Assets/States/NC/WhiteLabels/HispanicFederation/HispanicFederation_MFBLogo.png';
import { useIntl } from 'react-intl';

const logoMap: { [key: string]: string | undefined } = {
  MFB_COLogo: MFBCOLogo,
  MFB_ILLogo: MFBILLogo,
  MFB_NCLogo: MFBNCLogo,
  MFB_MALogo: MFBMALogo,
  MFB_COEnergyLogo: MFBCOEnergyLogo,
  MFB_NCFooterLogo: MFB_NCFooterLogo,
  BIA_MFBLogo: BIAMFBLogo,
  JHS_AMFBLogo: JHSAMFBLogo,
  JHSA_MFBLogo: JHSAMFBLogo,
  JPS_MFBLogo: JPSMLogo,
  VE_Logo: VELogo,
  CCH_MFBLogo: CCHMFBLogo,
  LGS_Logo: LGSLogo,
  GAC_Logo: GACLogo,
  FIRC_Logo: FIRCLogo,
  CO_MFBLogo: COMFBLogo,
  DHS_MFBLogo: DHSMFBLogo,
  CCIG_Logo: CCIGLogo,
  EC_MFBLogo: ECMFBLogo,
  ACHS_MFBLogo: ACHSMFBLogo,
  LC_MFBLogo: LC_MFBLogo,
  TC_MFBLogo: TC_MFBLogo,
  PC_MFBLogo: PC_MFBLogo,
  PitkinCounty_MFBLogo: PitkinCounty_MFBLogo,
  PoweredByLogo: PoweredByLogo,
  RewiringAmericaLogo: RewiringAmericaLogo,
  Broomfield_MFBLogo: Broomfield_MFBLogo,
  TheActionCenter_MFBLogo: TheActionCenter_MFBLogo,
  CESN_Logo_English: CESN_Logo_English,
  CESN_Logo_Spanish: CESN_Logo_Spanish,
  HispanicFederation_MFBLogo: HispanicFederation_MFBLogo,
};

export const renderLogoSource = (sourceLabel: string, logoAlt: string, logoClass: string) => {
  const intl = useIntl();
  const currentLanguage = intl.locale;

  let logoSrc = logoMap[sourceLabel] ?? MFBDEFAULT;

  // Handle language-aware CESN logo selection
  if (sourceLabel.startsWith('CESN_')) {
    const isSpanish = currentLanguage === 'es';

    // Map base CESN labels to language-specific variants
    if (sourceLabel === 'CESN_Logo') {
      logoSrc = isSpanish
        ? logoMap['CESN_Logo_Spanish'] ?? logoMap['CESN_Logo_English'] ?? MFBDEFAULT
        : logoMap['CESN_Logo_English'] ?? MFBDEFAULT;
    }
  }

  return <img src={logoSrc} alt={logoAlt} className={logoClass} />;
};
