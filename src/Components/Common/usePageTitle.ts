import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getAppPrefixedTitle, OTHER_PAGE_TITLES, QUESTION_TITLES } from '../../Assets/pageTitleTags';

type PageTitle =
  | (typeof QUESTION_TITLES)[keyof typeof QUESTION_TITLES]
  | (typeof OTHER_PAGE_TITLES)[keyof typeof OTHER_PAGE_TITLES];

export const usePageTitle = (pageTitle: PageTitle, overrideWhiteLabel?: string) => {
  const { whiteLabel } = useParams();
  const effectiveWhiteLabel = overrideWhiteLabel ?? whiteLabel;

  useEffect(() => {
    if (typeof document === 'undefined') return;

    // Skip prefix for the default title
    if (pageTitle === OTHER_PAGE_TITLES.default) {
      document.title = OTHER_PAGE_TITLES.default;
      return;
    }

    document.title = getAppPrefixedTitle(effectiveWhiteLabel, pageTitle);
  }, [effectiveWhiteLabel, pageTitle]);
};
