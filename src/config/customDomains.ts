type CustomDomainConfig = {
  whiteLabel: string;
  defaultPath: string;
};

const CUSTOM_DOMAINS: Record<string, CustomDomainConfig> = {
  'energysavings.colorado.gov': {
    whiteLabel: 'cesn',
    defaultPath: '',
  },
};

export function handleCustomDomainRedirect(): void {
  const config = CUSTOM_DOMAINS[window.location.hostname];

  if (!config) return;

  const path = window.location.pathname;
  const search = window.location.search;
  const hash = window.location.hash;
  const basePath = `/${config.whiteLabel}`;
  const isUnderWhiteLabel = path === basePath || path.startsWith(`${basePath}/`);

  if (!isUnderWhiteLabel) {
    const targetPath = path === '/' ? config.defaultPath : path;
    window.location.replace(`${basePath}${targetPath}${search}${hash}`);
  }
}
