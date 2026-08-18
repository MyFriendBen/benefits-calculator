import { FormattedMessage } from 'react-intl';
import { useConfig } from '../Config/configHook';
import { useTrackEvent } from '../../Assets/analytics';
import './MoreHelp.css';

export type Resource = {
  name: JSX.Element;
  description?: JSX.Element;
  link?: string;
  phone?: JSX.Element;
  label?: string;
};

// The config transform turns each resource's `name` ({_label, _default_message})
// into a <FormattedMessage>, so its `props.id` is the stable translation label —
// a PII-free identifier we can use when a resource has no explicit `label`. Guard
// on the element type being FormattedMessage so a differently-shaped `name` (any
// element with an unrelated `id`) can't leak the wrong value.
export const resourceNameFromConfig = (resource: Resource): string | undefined => {
  if (resource.label) {
    return resource.label;
  }
  if (resource.name?.type === FormattedMessage) {
    return (resource.name.props as { id?: string }).id;
  }
  return undefined;
};

type MoreHelpProps = {
  // True only on CESN's standalone page (see Results.tsx), which has no other top-level
  // heading. Everywhere else this renders inside the Immediate Help tab, nested under
  // the results page's own heading structure, so "Other Resources Near You" is an h2.
  isStandalonePage?: boolean;
};

const MoreHelp = ({ isStandalonePage = false }: MoreHelpProps) => {
  // Defaulted rather than left to throw: this now renders inside the main results
  // route instead of a standalone page, and there is no ErrorBoundary in the app, so
  // a missing config key would blank the whole page rather than just this tab.
  const { moreHelpOptions } = useConfig<{ moreHelpOptions: Resource[] }>('more_help_options', {
    moreHelpOptions: [],
  });
  const resources: Resource[] = moreHelpOptions;
  const track = useTrackEvent();

  const displayResources = (resources: Resource[]) => {
    return resources.map((resource, index) => {
      return (
        <article key={index} className="resource-card-article">
          <h3 className="resource-header" key={index}>
            {resource.name}
          </h3>
          {resource.description && <p className="resource-desc">{resource.description}</p>}
          {resource.phone && <p className="resource-phone">{resource.phone}</p>}
          <div className="resource-link-container">
            {resource.link && (
              <a
                href={resource.link}
                className="visit-website-btn"
                target="_blank"
                onClick={() =>
                  // resource_name is the explicit config `label` if set, else the
                  // translation id behind `name` (both PII-free strings);
                  // resource_index carries the ordinal as a fallback.
                  track('screener_more_help_resource_click', {
                    resource_name: resourceNameFromConfig(resource),
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
        {isStandalonePage ? (
          <h1 className="more-help-header">
            <FormattedMessage id="moreHelp.header" defaultMessage="Other Resources Near You" />
          </h1>
        ) : (
          <h2 className="more-help-header">
            <FormattedMessage id="moreHelp.header" defaultMessage="Other Resources Near You" />
          </h2>
        )}
      </div>
      {displayResources(resources)}
    </div>
  );
};

export default MoreHelp;
