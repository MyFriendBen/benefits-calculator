import { useEffect, useContext } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { Context } from '../Components/Wrapper/Wrapper';

/**
 * Initializes URL parameters on mount only.
 * Parses referrer, utm_source, test, externalid, and path from URL query params
 * and merges them with existing form data.
 *
 * Referrer priority: stored referrer -> referrer param -> utm_source param -> ''
 */
export const useUrlParametersInit = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { formData, setFormData } = useContext(Context);
  const urlSearchParams = location.search;

  useEffect(() => {
    const referrerParam = searchParams.get('referrer');
    const utmParam = searchParams.get('utm_source');
    const testParam = searchParams.get('test') === 'true';
    const externalIdParam = searchParams.get('externalid');
    const pathParam = searchParams.get('path') ?? 'default';

    // referrer priority = stored referrer -> referrer param -> utm_source param -> ''
    const referrer = formData.immutableReferrer ?? referrerParam ?? utmParam ?? '';
    const referrerSource = formData.referralSource || referrer;
    const isTest = formData.isTest || testParam;
    const externalId = formData.externalID ?? externalIdParam ?? undefined;
    const path = formData.path ?? pathParam;

    setFormData({
      ...formData,
      isTest: isTest,
      externalID: externalId,
      referralSource: referrerSource,
      immutableReferrer: referrer,
      path: path,
      urlSearchParams: urlSearchParams,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount
};
