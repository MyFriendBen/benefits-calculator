export const ALL_VALID_WHITE_LABELS = ['co', 'nc', 'co_energy_calculator', 'ma', 'il', 'tx'] as const;

type ValueOf<T extends readonly any[]> = T[number];
export type WhiteLabel = ValueOf<typeof ALL_VALID_WHITE_LABELS>;
