import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { useResultsContext, useResultsLink } from '../Results';
import { UrgentNeed } from '../../../Types/Results';
import NeedCard from './NeedCard';
import { ResultsMessageForNeeds } from '../../Referrer/Referrer';
import InformationalText from '../../Common/InformationalText/InformationalText';
import { useTrackEvent, useTrackItemList } from '../../../Assets/analytics';

// Category order for the resource list — shared by the render and the shown
// impression so item_list_index matches on-screen position.
const sortByCategory = (a: UrgentNeed, b: UrgentNeed) => {
  if (a.category_type.default_message > b.category_type.default_message) {
    return 1;
  } else if (a.category_type.default_message < b.category_type.default_message) {
    return -1;
  }

  return 0;
};

// BENJI READS THIS LIST TOO. `screener/assistant.py` builds its additional-resources
// context from the same server-side selection that produced `needs` here, and the prompt
// tells Benji that list is the COMPLETE set of resources this person has.
//
// So this component must keep rendering everything it is given. A filter added here —
// the way the benefits tab filters by citizenship — would diverge the two silently, and
// Benji would go on offering an organization that is no longer on screen. That is why
// there is no `visible_resources` counterpart to `visiblePrograms`: it isn't needed
// while this tab does no filtering, and `resultsPageGuideLabels.test.ts` is what keeps
// that true. If this tab ever needs to filter, Benji needs to be told what survived.
const Needs = () => {
  const { needs } = useResultsContext();
  const { uuid } = useParams();
  const track = useTrackEvent();
  const trackItemList = useTrackItemList();
  const needsSortedByCategory = [...needs].sort(sortByCategory);

  // Resources shown, as one view_item_list impression once the resources are on
  // screen. Keyed on the screening uuid in sessionStorage so it fires exactly
  // once per screening — not skipped when this tab mounts before needs load, and
  // not re-fired when the user switches tabs and comes back. Resources have no
  // stable id, so item_name is the key; item_list_index follows the on-screen
  // (category-sorted) order.
  useEffect(() => {
    if (needs.length === 0 || uuid === undefined) {
      return;
    }
    const key = `resources_shown_tracked:${uuid}`;
    if (sessionStorage.getItem(key)) {
      return;
    }
    sessionStorage.setItem(key, '1');
    const sorted = [...needs].sort(sortByCategory);
    trackItemList(
      'results_resources',
      sorted.map((need, index) => ({ item_name: need.name.default_message, item_list_index: index })),
    );
  }, [needs, uuid, trackItemList]);

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
      {/* Carries the divider above the cards. A wrapper rather than a sibling selector
          because the referrer message above renders for only some white labels. */}
      <div className="results-needs-list">
        {needsSortedByCategory.map((need, index) => {
          return <NeedCard need={need} key={index} />;
        })}
      </div>
    </div>
  );
};

export default Needs;
