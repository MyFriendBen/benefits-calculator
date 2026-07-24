import { ReactNode } from 'react';
import { useConfig, useFeatureFlag } from '../../Config/configHook';
import { TrackedOutboundLink } from '../../Common/TrackedOutboundLink';
import './ResultsSurvey.css';

// `results_survey` config (benefits-api). intro/button arrive as <FormattedMessage> nodes.
type ResultsSurveyConfig = {
  link: string;
  intro: ReactNode;
  button: ReactNode;
};

const EMPTY_SURVEY: ResultsSurveyConfig = { link: '', intro: null, button: null };

export default function ResultsSurvey() {
  const isResultsSurveyEnabled = useFeatureFlag('nc_results_survey');
  const survey = useConfig<ResultsSurveyConfig>('results_survey', EMPTY_SURVEY);

  // Hidden unless the flag is on and both link + button are set (config is admin-editable — avoid a nameless link).
  if (!isResultsSurveyEnabled || !survey.link || !survey.button) {
    return null;
  }

  return (
    <div className="results-survey">
      <p className="results-survey-intro">{survey.intro}</p>
      <TrackedOutboundLink
        href={survey.link}
        action="nc_results_survey_click"
        label="NC Results Survey"
        category="results_survey"
        className="results-survey-btn"
      >
        {survey.button}
      </TrackedOutboundLink>
    </div>
  );
}
