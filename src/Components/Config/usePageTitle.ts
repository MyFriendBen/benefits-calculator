import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getAppPrefixedTitle, OTHER_PAGE_TITLES } from '../../Assets/pageTitleTags';

export const usePageTitle = (pageTitle: string, overrideWhiteLabel?: string) => {
  const { whiteLabel } = useParams();
  const effectiveWhiteLabel = overrideWhiteLabel ?? whiteLabel;

  useEffect(() => {
    // Skip prefix for the default title
    if (pageTitle === OTHER_PAGE_TITLES.default) {
      document.title = OTHER_PAGE_TITLES.default;
      return;
    }

    document.title = getAppPrefixedTitle(effectiveWhiteLabel, pageTitle);
  }, [effectiveWhiteLabel, pageTitle]);
};
