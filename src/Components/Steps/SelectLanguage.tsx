import { useConfig } from '../Config/configHook';
import { FormControl, Select, InputLabel, MenuItem, SelectChangeEvent } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import { Context } from '../Wrapper/Wrapper';
import { useContext, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import QuestionHeader from '../QuestionComponents/QuestionHeader';
import { useQueryString } from '../QuestionComponents/questionHooks';
import FormContinueButton from '../ContinueButton/FormContinueButton';
import QuestionQuestion from '../QuestionComponents/QuestionQuestion';
import { STATES } from './SelectStatePage';
import { OTHER_PAGE_TITLES } from '../../Assets/pageTitleTags';
import { useUpdateWhiteLabelAndNavigate } from '../RouterUtil/RedirectToWhiteLabel';
import { usePageTitle } from '../Common/usePageTitle';
import { useTrackEvent } from '../../Assets/analytics';
import { PRE_DIRECTORY_STEP_IDS } from '../../Assets/analytics/stepIds';

const STEP_1_ANALYTICS_ID = PRE_DIRECTORY_STEP_IDS.language;

const SelectLanguagePage = () => {
  const { locale, selectLanguage, configLoading } = useContext(Context);
  const languageOptions = useConfig<{ [key: string]: string }>('language_options');
  const { whiteLabel, uuid } = useParams();

  const queryString = useQueryString();
  const navigate = useNavigate();
  const track = useTrackEvent();

  usePageTitle(OTHER_PAGE_TITLES.language);

  // This is the true first screen of the screener (step-1), so it's the single
  // place to mark the start of the funnel, in addition to its own step view.
  //
  // form_start must fire ONCE per screening, or the funnel denominator inflates:
  // step-1 has no remount key, and users can navigate back to it (Back from
  // step-2, or re-entry), each of which remounts this effect. Guard on a
  // per-uuid sessionStorage flag so a given screening counts one start, while a
  // genuinely new screening (new uuid) still starts fresh. The step VIEW below
  // is intentionally NOT guarded — every view should count toward drop-off.
  useEffect(() => {
    const startKey = uuid ? `mfb_form_start_${uuid}` : 'mfb_form_start';
    if (!sessionStorage.getItem(startKey)) {
      sessionStorage.setItem(startKey, '1');
      track('screener_form_start', { screener_step_name: STEP_1_ANALYTICS_ID, screener_step_number: 1 });
    }
    track('screener_form_step', {
      screener_step_name: STEP_1_ANALYTICS_ID,
      screener_step_number: 1,
      step_action: 'view',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createMenuItems = (optionList: Record<string, string>, disabledFMId: string, disabledFMDefault: string) => {
    const disabledSelectMenuItem = (
      <MenuItem value="disabled-select" key="disabled-select" disabled>
        <FormattedMessage id={disabledFMId} defaultMessage={disabledFMDefault} />
      </MenuItem>
    );
    const menuItemKeyLabelPairArr = Object.entries(optionList);

    const dropdownMenuItems = menuItemKeyLabelPairArr.map((key) => {
      return (
        <MenuItem value={key[0]} key={key[0]}>
          {key[1]}
        </MenuItem>
      );
    });

    return [disabledSelectMenuItem, dropdownMenuItems];
  };

  useEffect(() => {
    const continueOnEnter = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        handleSubmit(event);
      }
    };
    document.addEventListener('keyup', continueOnEnter);
    return () => {
      document.removeEventListener('keyup', continueOnEnter); // remove event listener on unmount
    };
  });

  const updateWhiteLabelAndNavigate = useUpdateWhiteLabelAndNavigate();

  const handleSubmit = (event: { preventDefault: () => void }) => {
    event.preventDefault();

    track('screener_form_step', {
      screener_step_name: STEP_1_ANALYTICS_ID,
      screener_step_number: 1,
      step_action: 'complete',
    });

    if (uuid !== undefined) {
      navigate(`/${whiteLabel}/${uuid}/step-2${queryString}`);
      return;
    }

    if (whiteLabel !== undefined) {
      navigate(`/${whiteLabel}/step-2${queryString}`);
      return;
    }

    const stateCodes = Object.keys(STATES);

    if (stateCodes.length > 1) {
      navigate(`/select-state${queryString}`);
      return;
    }

    updateWhiteLabelAndNavigate(stateCodes[0], `/${stateCodes[0]}/step-2${queryString}`);
    // wait for the new config to be loaded
    const interval = setInterval(() => {
      if (!configLoading) {
        navigate(`/${stateCodes[0]}/step-2${queryString}`);
        clearInterval(interval);
      }
    }, 1);
  };

  return (
    <main className="benefits-form" data-step-id="language">
      <QuestionHeader>
        <FormattedMessage id="selectLanguage.header" defaultMessage="Before you begin..." />
      </QuestionHeader>
      <QuestionQuestion>
        <FormattedMessage id="selectLanguage.subHeader" defaultMessage="What is your preferred language?" />
      </QuestionQuestion>
      <form onSubmit={handleSubmit}>
        <FormControl sx={{ mt: 1, mb: 2, minWidth: 210, maxWidth: '100%' }}>
          <InputLabel id="language-select-label">
            <FormattedMessage id="selectLang.text" defaultMessage="Language" />
          </InputLabel>
          <Select
            labelId="language-select-label"
            id="language-select"
            value={locale}
            label={<FormattedMessage id="selectLang.text" defaultMessage="Language" />}
            onChange={(event) => selectLanguage(event.target.value)}
          >
            {createMenuItems(languageOptions, 'selectLang.disabledSelectMenuItemText', 'Select a language')}
          </Select>
        </FormControl>
        <div style={{ marginTop: '1rem' }}>
          <FormContinueButton>
            <FormattedMessage id="continueButton-getStarted" defaultMessage="Get Started" />
          </FormContinueButton>
        </div>
      </form>
    </main>
  );
};

export default SelectLanguagePage;
