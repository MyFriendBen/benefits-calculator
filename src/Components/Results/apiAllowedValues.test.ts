/**
 * The screener and benefits-api each keep a list of these values: the screener because it holds
 * the logic that gives each one meaning, the API because it stores them on programs and navigators.
 * The API's lists live in benefits-api `programs/allowed_values.py` (`LegalStatusLabel`,
 * `USER_SELECTED_LEGAL_STATUSES`, `NavigatorLanguageCode`), and its database refuses anything else.
 *
 * These tests pin the screener's lists to the API's. A value added on one side only fails here:
 * a label the API stores with no screener logic matches no household, and a language code the
 * screener knows but the API refuses can never be set. Change both lists together.
 */
import { calculatedCitizenshipFilters, citizenshipFilterConfig } from './Filter/citizenshipFilterConfig';
import { allNavigatorLanguages } from './ProgramPage/NavigatorLanguages';

// benefits-api `USER_SELECTED_LEGAL_STATUSES`
const API_USER_SELECTED_LEGAL_STATUSES = [
  'citizen',
  'non_citizen',
  'gc_5plus',
  'gc_5less',
  'refugee',
  'otherWithWorkPermission',
];

// benefits-api `LegalStatusLabel`, less the user-selected ones above
const API_CALCULATED_LEGAL_STATUSES = [
  'gc_18plus_no5',
  'gc_under18_no5',
  'otherHealthCareUnder19',
  'otherHealthCarePregnant',
  'notPregnantOrUnder19ForOmniSalud',
  'notPregnantOrUnder19ForEmergencyMedicaid',
  'notPregnantForMassHealthLimited',
  'notPregnantOrChildForMassHealthLimited',
  'otherHealthCareUnder21',
  'lawfulHealthCarePregnant',
  'lawfulHealthCareUnder19',
];

// benefits-api `NavigatorLanguageCode`
const API_NAVIGATOR_LANGUAGE_CODES = [
  'en-us',
  'es',
  'vi',
  'fr',
  'am',
  'so',
  'ru',
  'ne',
  'my',
  'zh',
  'ar',
  'sw',
  'pl',
  'tl',
  'ko',
  'ur',
  'pt-br',
  'ht',
  'ALL',
];

const sorted = (values: string[]) => [...values].sort();

describe("the screener's lists match benefits-api's", () => {
  it('has a filter option for every user-selected legal status, and no others', () => {
    expect(sorted(Object.keys(citizenshipFilterConfig))).toEqual(sorted(API_USER_SELECTED_LEGAL_STATUSES));
  });

  it('has logic for every calculated legal status, and no others', () => {
    expect(sorted(Object.keys(calculatedCitizenshipFilters))).toEqual(sorted(API_CALCULATED_LEGAL_STATUSES));
  });

  it('has a badge for every navigator language code, and no others', () => {
    expect(sorted(Object.keys(allNavigatorLanguages))).toEqual(sorted(API_NAVIGATOR_LANGUAGE_CODES));
  });
});
