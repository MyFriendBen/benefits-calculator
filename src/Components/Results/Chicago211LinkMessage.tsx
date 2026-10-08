import { FormattedMessage } from 'react-intl';
import Link211Message from './Link211Message';

// 211 Metro Chicago's resource search takes a single `external_category` code.
//
// Only the housing code is confirmed. The rest of Illinois' acute_condition_options
// keys are deliberately absent until 211 Metro Chicago supplies their full category
// list: an unmapped key renders no link rather than a guessed one, so a household
// that selected only unmapped needs falls through to the fallback below.
const NEEDS_MAPPING: Record<string, string> = {
  housing: 'HOU',
};

const BASE_URL = 'https://211metrochicago.org/search-for-resources/';
const HOME_URL = 'https://211metrochicago.org/';

// Their search does not document a ZIP or radius parameter, so the household's
// zipcode is not used yet. Confirming that is what would make these links
// location-aware the way NC211's are.
const buildQueryURL = (externalCategory: string) => `${BASE_URL}?external_category=${externalCategory}`;

export default function Chicago211LinkMessage() {
  return (
    <Link211Message
      mapping={NEEDS_MAPPING}
      buildUrl={buildQueryURL}
      intro={
        <FormattedMessage
          id="link211chicago.resources"
          defaultMessage="More local resources from 211 Metro Chicago: "
        />
      }
      fallback={
        <div>
          <p>
            <FormattedMessage id="link211.message" defaultMessage="For more local resources please visit " />
            <a href={HOME_URL} target="_blank" rel="noopener noreferrer">
              <FormattedMessage id="link211chicago.clickHere" defaultMessage="211 Metro Chicago's website." />
            </a>
          </p>
        </div>
      }
    />
  );
}
