import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { useResultsContext, useResultsLink } from '../Results';
import NeedCard from './NeedCard';
import { ResultsMessageForNeeds } from '../../Referrer/Referrer';
import InformationalText from '../../Common/InformationalText/InformationalText';
import { useTrackEvent } from '../../../Assets/analytics';

const Needs = () => {
  const { needs } = useResultsContext();
  const track = useTrackEvent();
  const needsSortedByCategory = needs.sort((a, b) => {
    if (a.category_type.default_message > b.category_type.default_message) {
      return 1;
    } else if (a.category_type.default_message < b.category_type.default_message) {
      return -1;
    }

    return 0;
  });

  // One impression event listing every resource shown, fired once per mount
  // (ref-guarded). A single event rather than one per resource, since GA4 drops
  // same-name events fired together in a tick.
  const hasTrackedResourcesShown = useRef(false);
  useEffect(() => {
    if (hasTrackedResourcesShown.current || needs.length === 0) {
      return;
    }
    hasTrackedResourcesShown.current = true;
    track('screener_resources_shown', {
      resource_names: needs.map((need) => need.name.default_message),
      resource_count: needs.length,
    });
  }, [needs, track]);

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
              <Link
                to={immediateNeedsLink}
                state={{ routeBackToResults: true }}
                onClick={() =>
                  track('screener_link_click', {
                    link_name: 'Additional Resources — Edit Step',
                    url: immediateNeedsLink,
                    link_location: 'results_needs',
                  })
                }
              >
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
