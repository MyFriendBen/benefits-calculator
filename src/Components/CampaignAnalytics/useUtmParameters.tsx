import { useSearchParams } from 'react-router-dom';

export type UtmParameters = {
  id: string | null;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  content: string | null;
  term: string | null;
};

export const UtmKeys = ['utm_id', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

export default function useUtmParameters(): UtmParameters | null {
  const [searchParams] = useSearchParams();

  const params = UtmKeys.reduce((utms, param) => {
    const key = param.replace('utm_', '') as keyof UtmParameters;
    utms[key] = searchParams.get(param);
    return utms;
  }, {} as UtmParameters);

  const hasUtmParams = Object.values(params).some((value) => value !== null);

  return hasUtmParams ? params : null;
}
