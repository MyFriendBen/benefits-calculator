/**
 * Lists the screener keeps in code because it holds logic for each value, pinned to copies of
 * benefits-api's. benefits-api's `configuration/test_served_lists.py` pins its lists to copies of
 * these, so a value added in one repo only fails CI in one or the other. Change both repos together.
 */
import { ALL_VALID_WHITE_LABELS } from '../../Types/WhiteLabel';
import { UI_OPTIONS } from '../Referrer/uiOptions';
import { VALUE_FORMATS } from '../Results/FormattedValue';
import { ENERGY_CALCULATOR_ICON_MAP, OPTION_CARD_ICON_MAP } from './configHook';

// benefits-api `white_label_config` keys other than `_default` (configuration/white_labels/__init__.py)
const API_WHITE_LABELS = ['co', 'nc', 'cesn', 'ma', 'il', 'ks', 'mo', 'nj', 'tx', 'wa'];

// benefits-api: every `uiOptions` flag a white label's `referrer_data` sets (configuration/white_labels/)
const API_UI_OPTIONS = [
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
  'small_header_language_dropdown',
  'white_header',
];

// benefits-api: every `_icon` name a white label config uses (configuration/white_labels/)
const API_ICONS = [
  'Aging',
  'Baby_supplies',
  'BlindOrVisuallyImpaired',
  'Child_development',
  'Cooling',
  'Chp',
  'Dental_care',
  'Disabled',
  'Drug_alcohol_use',
  'Electricity',
  'Employer',
  'Family_planning',
  'Food',
  'FosterCare',
  'Health_care',
  'Heating',
  'HeartRate',
  'Homeless_services',
  'Housing',
  'Job_resources',
  'Legal_services',
  'LongTermDisability',
  'Medicaid',
  'Medical_expenses_and_debt',
  'Medicare',
  'Military',
  'None',
  'Pregnant',
  'PrivateInsurance',
  'Savings',
  'Student',
  'Support',
  'SurvivingSpouse',
  'Transportation',
  'VA',
  'Wheelchair',
  'Youth_development',
];

// benefits-api `Program.VALUE_FORMAT_CHOICES`, less the default (programs/models.py)
const API_VALUE_FORMATS = ['lump_sum', 'estimated_annual'];

const sorted = (values: readonly string[]) => [...values].sort();

describe("the screener's lists match benefits-api's", () => {
  it('routes every white label the API configures, and no others', () => {
    expect(sorted(ALL_VALID_WHITE_LABELS)).toEqual(sorted(API_WHITE_LABELS));
  });

  it('acts on every UI option a white label sets', () => {
    expect(API_UI_OPTIONS.filter((flag) => !(UI_OPTIONS as readonly string[]).includes(flag))).toEqual([]);
  });

  it('draws every icon a white label config names, and no others', () => {
    const drawn = [...Object.keys(OPTION_CARD_ICON_MAP), ...Object.keys(ENERGY_CALCULATOR_ICON_MAP)];
    expect(sorted(drawn)).toEqual(sorted(API_ICONS));
  });

  it('formats every program value format', () => {
    expect(sorted(VALUE_FORMATS)).toEqual(sorted(API_VALUE_FORMATS));
  });
});
