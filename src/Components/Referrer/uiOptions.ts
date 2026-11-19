/**
 * Every referrer `uiOptions` flag the screener acts on. A white label sets them per referrer in
 * benefits-api (`referrer_data` in configuration/white_labels/), and `getReferrer('uiOptions')` is
 * typed with this list, so checking a flag that isn't here fails to compile.
 * `Components/Config/apiServedLists.test.ts` pins it to the flags the API sets.
 */
export const UI_OPTIONS = [
  '211co',
  '211ks',
  '211mo',
  '211nc',
  'ccla',
  'dont_show_category_values',
  'hfed',
  'il_show_211_link',
  'lanc',
  'logo_landing_page_link',
  'nc_show_211_link',
  'no_confirmation_return_zipcode',
  'no_lets_get_started',
  'no_results_more_help',
  'no_zipcode_change_state',
  'powered_by_mfb_footer',
  'small_header_language_dropdown',
  'white_header',
] as const;
export type UiOption = (typeof UI_OPTIONS)[number];
