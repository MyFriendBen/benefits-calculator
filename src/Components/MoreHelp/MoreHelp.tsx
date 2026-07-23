import { FormattedMessage } from 'react-intl';
import { useConfig } from '../Config/configHook';
import { useTrackEvent } from '../../Assets/analytics';
import './MoreHelp.css';

type Resource = {
  name: JSX.Element;
  description?: JSX.Element;
  link?: string;
  phone?: JSX.Element;
  label?: string;
};

const MoreHelp = () => {
  const { moreHelpOptions } = useConfig<{ moreHelpOptions: Resource[] }>('more_help_options');
  const resources: Resource[] = moreHelpOptions;
  const track = useTrackEvent();

  const displayResources = (resources: Resource[]) => {
    return resources.map((resource, index) => {
      return (
        <article key={index} className="resource-card-article">
          <h1 className="resource-header" key={index}>
            {resource.name}
          </h1>
          {resource.description && <p className="resource-desc">{resource.description}</p>}
          {resource.phone && <p className="resource-phone">{resource.phone}</p>}
          <div className="resource-link-container">
            {resource.link && (
              <a
                href={resource.link}
                className="visit-website-btn"
                target="_blank"
                onClick={() =>
                  // gap #7: this link was previously untracked. `name` is a
                  // JSX.Element, so use the config `label` (a plain string) as the
                  // PII-free id; resource_index carries the ordinal independently
                  // (label may be undefined; the two are separate params).
                  track('screener_more_help_resource_click', {
                    resource_name: resource.label,
                    resource_index: index,
                    url: resource.link,
                  })
                }
              >
                <FormattedMessage id="visit-website-btn" defaultMessage="Visit Website" />
              </a>
            )}
          </div>
        </article>
      );
    });
  };

  return (
    <div className="more-help-container">
      <div className="underline-header-container">
        <h1 className="more-help-header">
          <FormattedMessage id="moreHelp.header" defaultMessage="Other Resources Near You" />
        </h1>
      </div>
      {displayResources(resources)}
    </div>
  );
};

export default MoreHelp;
