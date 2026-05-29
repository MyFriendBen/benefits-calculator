/**
 * Variant keys that share the same has_* column on the backend Screen model.
 *
 * Background: the backend stores one boolean per benefit (e.g. `has_snap`),
 * but the frontend `formData.benefits` map has multiple keys pointing at the
 * same column (e.g. `snap`, `co_snap`, `il_snap` all hydrate from
 * `response.has_snap` in updateFormData.tsx and all OR-merge into `has_snap`
 * in updateScreen.ts).
 *
 * Step 8 (AlreadyHasBenefits) only renders ONE tile per has_* column — the
 * white-label-specific variant returned by the hasBenefitsPrograms endpoint.
 * Without sibling tracking, toggling that one tile only flipped one key while
 * the stale sibling kept the OR-chain `true`, so deselect never persisted.
 * See MFB-1085 for the full bug trace.
 *
 * Each entry below is a sibling group: any key in the group, when toggled,
 * should toggle every other key in the group.
 *
 * Sourced from the OR-chains in `getScreensBody` (updateScreen.ts). If a new
 * variant is added there, add it here too.
 *
 * All of this disappears in MFB-720 when the join-table migration completes
 * and `formData.benefits` keys mirror `name_abbreviated` 1:1.
 */
export const BENEFIT_SIBLING_GROUPS: ReadonlyArray<ReadonlyArray<string>> = [
  ['ccap', 'il_ccap', 'nc_cccap'],
  ['leap', 'nc_leap'],
  ['oap', 'cesn_oap'],
  ['rtdlive', 'cesn_rtdlive'],
  ['snap', 'co_snap', 'il_snap', 'ma_snap', 'nc_snap', 'tx_snap', 'cesn_snap'],
  ['ssdi', 'tx_ssdi', 'cesn_ssdi', 'wa_ssdi'],
  ['ssi', 'tx_ssi', 'cesn_ssi', 'wa_ssi'],
  ['cowap', 'cesn_cowap'],
  ['tanf', 'co_tanf', 'il_tanf', 'nc_tanf', 'tx_tanf', 'cesn_tanf', 'wa_tanf'],
  ['wic', 'co_wic', 'il_wic', 'ma_wic', 'nc_wic', 'tx_wic', 'cesn_wic'],
  ['section_8', 'co_section_8', 'ma_section_8', 'cesn_section_8', 'wa_hcv'],
  ['aca', 'nc_aca'],
  ['co_andso', 'cesn_andso'],
  ['co_care', 'cesn_care'],
  ['eitc', 'wa_eitc'],
  ['nslp', 'wa_nslp'],
  ['head_start', 'wa_head_start'],
];

/**
 * Returns every key (including the input) that should be toggled together
 * with `key`. For keys not in any sibling group, returns `[key]`.
 */
export function getBenefitSiblings(key: string): readonly string[] {
  const group = BENEFIT_SIBLING_GROUPS.find((g) => g.includes(key));
  return group ?? [key];
}
