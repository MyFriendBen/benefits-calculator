export const ALL_VALID_WHITE_LABELS = ['co', 'nc', 'cesn', 'ma', 'il', 'tx'] as const;

type ValueOf<T extends readonly any[]> = T[number];
export type WhiteLabel = ValueOf<typeof ALL_VALID_WHITE_LABELS>;
