export const ALL_VALID_WHITE_LABELS = ['co', 'nc', 'cesn', 'ma', 'il', 'tx'] as const;

type ValueOf<T extends readonly any[]> = T[number];
export type WhiteLabel = ValueOf<typeof ALL_VALID_WHITE_LABELS>;

// Default landing path for each white label (defaults to 'step-1' if not specified)
export const WHITE_LABEL_DEFAULT_PATH: Partial<Record<WhiteLabel, string>> = {
  cesn: 'landing-page',
};
