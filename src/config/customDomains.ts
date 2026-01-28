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

  if (!path.startsWith(`/${config.whiteLabel}`)) {
    const targetPath = path === '/' ? config.defaultPath : path;
    window.location.replace(`/${config.whiteLabel}${targetPath}`);
  }
}
