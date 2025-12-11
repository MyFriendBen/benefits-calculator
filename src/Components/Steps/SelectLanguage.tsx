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
import { OTHER_PAGE_TITLES, getAppPrefixedTitle } from '../../Assets/pageTitleTags';
import { useUpdateWhiteLabelAndNavigate } from '../RouterUtil/RedirectToWhiteLabel';

const SelectLanguagePage = () => {
  const { locale, selectLanguage, configLoading } = useContext(Context);
  const languageOptions = useConfig<{ [key: string]: string }>('language_options');
  const { whiteLabel, uuid } = useParams();

  const queryString = useQueryString();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = getAppPrefixedTitle(whiteLabel, OTHER_PAGE_TITLES.language);
  }, [whiteLabel]);

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
    <main className="benefits-form">
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
