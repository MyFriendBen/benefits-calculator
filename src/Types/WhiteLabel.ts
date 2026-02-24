export const ALL_VALID_WHITE_LABELS = ['co', 'nc', 'cesn', 'ma', 'il', 'tx'] as const;

type ValueOf<T extends readonly any[]> = T[number];
export type WhiteLabel = ValueOf<typeof ALL_VALID_WHITE_LABELS>;

// Default landing path for each white label (defaults to 'step-1' if not specified)
export const WHITE_LABEL_DEFAULT_PATH: Partial<Record<WhiteLabel, string>> = {
  cesn: 'landing-page',
};

// Maps legacy white label URL slugs to their current equivalents.
// Used to redirect old paths without a full page reload (see ValidateWhiteLabel.tsx).
// Only add entries here when the legacy and target WLs share the same config —
// if they differ, a full reload is needed to reinitialize app config.
export const LEGACY_WHITE_LABEL_REDIRECTS: Record<string, string> = {
  co_energy_calculator: 'cesn',
};
