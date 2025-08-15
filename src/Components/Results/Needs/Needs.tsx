import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { useResultsContext, useResultsLink } from '../Results';
import NeedCard from './NeedCard';
import { ResultsMessageForNeeds } from '../../Referrer/Referrer';
import InformationalText from '../../Common/InformationalText/InformationalText';

const Needs = () => {
  const { needs } = useResultsContext();
  const needsSortedByCategory = needs.sort((a, b) => {
    if (a.category_type.default_message > b.category_type.default_message) {
      return 1;
    } else if (a.category_type.default_message < b.category_type.default_message) {
      return -1;
    }

    return 0;
  });

  const immediateNeedsLink = useResultsLink('step-9');

  return (
    <div data-testid="needs-section">
      <ResultsMessageForNeeds />
      <InformationalText>
        <FormattedMessage
          id="nearTermBenefits.editSelections"
          defaultMessage="If you would like to see additional types of resources, please edit your selections in <link>this step</link>."
          values={{
            link: (chunks) => (
              <Link to={immediateNeedsLink} state={{ routeBackToResults: true }}>
                {chunks}
              </Link>
            ),
          }}
        />
      </InformationalText>
      {needsSortedByCategory.map((need, index) => {
        return <NeedCard need={need} key={index} />;
      })}
    </div>
  );
};

export default Needs;
