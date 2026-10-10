import { FormattedMessage } from 'react-intl';
import { Translation } from '../../../Types/Results';

type TranslateProps = {
  translation: Translation;
  values?: Record<string, string>;
};

const ResultsTranslate = ({ translation, values }: TranslateProps) => {
  return <FormattedMessage id={translation.label} defaultMessage={translation.default_message} values={values} />;
};

export default ResultsTranslate;
