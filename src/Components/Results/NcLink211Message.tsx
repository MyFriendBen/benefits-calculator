import { FormattedMessage } from 'react-intl';

export default function NcLink211Message() {
  return (
    <div>
      <p>
        <FormattedMessage id="link211.message" defaultMessage="For more local resources please visit " />
        <a href="https://nc211.org/" target="_blank" rel="noopener noreferrer">
          <FormattedMessage id="link211.clickHere" defaultMessage="NC 211's website." />
        </a>
      </p>
    </div>
  );
}
