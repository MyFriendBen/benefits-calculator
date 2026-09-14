import { isValidTheme, themes, VALID_THEMES } from './styleController';

/** Relative luminance per WCAG 2.1, for contrast ratios. */
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastOnWhite(hex: string): number {
  return 1.05 / (luminance(hex) + 0.05);
}

describe('theme registry', () => {
  // The API sends a theme name as a plain string (referrer_data.theme). An unregistered name
  // fails isValidTheme and useThemeValidation silently swaps in 'default', so a referrer would
  // ship with generic branding and no error anywhere.
  it.each(['default', 'twoOneOne', 'twoOneOneNC', 'co_energy', 'nc_lanc', 'nc_ccla', 'cu_denver', 'uwgkc'])(
    'registers the "%s" theme the API can name',
    (name) => {
      expect(isValidTheme(name)).toBe(true);
      expect(VALID_THEMES).toContain(name);
    },
  );

  it('rejects a theme name that is not registered', () => {
    expect(isValidTheme('uwgkc_211')).toBe(false);
  });

  describe.each(VALID_THEMES)('%s', (name) => {
    const theme = themes[name];

    it('reads accessibly on white', () => {
      // Body and heading text sit on white, so --primary-color needs WCAG AA for normal text.
      expect(contrastOnWhite(theme.cssVariables['--primary-color'])).toBeGreaterThanOrEqual(4.5);
      // Icons are graphical objects, which WCAG 1.4.11 holds to 3:1.
      expect(contrastOnWhite(theme.cssVariables['--icon-color'])).toBeGreaterThanOrEqual(3);
    });

    it('declares both font families', () => {
      expect(theme.cssVariables['--font-heading']).toBeTruthy();
      expect(theme.cssVariables['--font-body']).toBeTruthy();
    });
  });
});
