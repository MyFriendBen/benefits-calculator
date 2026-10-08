import { ReactNode, useContext } from 'react';
import { Context } from '../../Components/Wrapper/Wrapper';
import { useConfig } from '../Config/configHook';
import { FormattedMessageType } from '../../Types/Questions';

type IconAndFormattedMessageMap = {
  [key: string]: {
    text: FormattedMessageType;
    icon: ReactNode;
  };
};

type Link211MessageProps<T> = {
  // Maps an acuteHHConditions key to whatever the 211's search URL needs. A key
  // with no entry produces no link, which is what lets a state launch with a
  // partial mapping instead of waiting for its 211's full taxonomy.
  mapping: Record<string, T>;
  buildUrl: (value: T, zipcode: string) => string;
  // Rendered above the links, e.g. "More local resources from NC211: ".
  intro: ReactNode;
  // Rendered instead of the links when the household selected no mapped need.
  fallback: ReactNode;
};

/**
 * Shared renderer for a 211's "search our directory" deep links on the
 * Additional Resources tab.
 *
 * One link per immediate need the household selected, labelled with the same
 * translated copy the needs step used (from acute_condition_options), so only
 * the URL values are state-specific. Placement and the referrer gate live in
 * Referrer.tsx; this component only decides what to render.
 */
export default function Link211Message<T>({ mapping, buildUrl, intro, fallback }: Link211MessageProps<T>) {
  const { formData } = useContext(Context);
  const acuteConditionOptions = useConfig<IconAndFormattedMessageMap>('acute_condition_options');
  const zipcode = formData.zipcode;

  const needsData = formData.acuteHHConditions;
  const householdNeeds: Record<string, T> = Object.fromEntries(
    Object.entries(needsData)
      .filter(([_, value]) => value === true) // keep only true
      .map(([key]) => [key, mapping[key]]) // map to the 211's taxonomy
      .filter(([, value]) => value !== undefined),
  );

  if (Object.keys(householdNeeds).length === 0) {
    return <>{fallback}</>;
  }

  return (
    <div>
      {intro}
      {Object.entries(householdNeeds).map(([key, value]) => {
        const option = acuteConditionOptions[key];
        if (!option) {
          return null;
        }

        return (
          <div
            key={key}
            style={{
              display: 'inline-block',
              fontWeight: '700',
              fontFamily: 'Open Sans, sans-serif',
              marginBottom: '0.5rem',
              marginRight: '0.5rem',
            }}
          >
            <a
              href={buildUrl(value, zipcode)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: '#e6e7e8',
                borderRadius: '9999rem',
                padding: '0.125rem 0.5rem',
                textDecoration: 'underline',
                color: '#264D91',
              }}
            >
              {option.text}
            </a>
          </div>
        );
      })}
    </div>
  );
}
