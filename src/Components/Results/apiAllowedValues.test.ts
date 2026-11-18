/**
 * The screener and benefits-api each keep a list of legal statuses: the screener because it holds
 * the logic that gives each one meaning, the API because it stores them on programs. The API's
 * lists live in benefits-api `programs/allowed_values.py` (`LegalStatusLabel`,
 * `USER_SELECTED_LEGAL_STATUSES`), and its database refuses anything else. The API also serves
 * each status's button label and tooltip, and each navigator language's badge, so those have no
 * copy here.
 *
 * These tests pin the screener's lists to copies of the API's, and benefits-api's
 * `ScreenerParityTests` (programs/test_allowed_values.py) pins its lists to copies of these, so a
 * value added in one repo only fails CI in one or the other: a label the API stores with no
 * screener logic matches no household. Change both repos together.
 */
import { CITIZEN_LABEL_OPTIONS, calculatedCitizenshipFilters } from './Filter/citizenshipFilterConfig';

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

const sorted = (values: string[]) => [...values].sort();

describe("the screener's lists match benefits-api's", () => {
  it('has a filter option for every user-selected legal status, and no others', () => {
    expect(sorted([...CITIZEN_LABEL_OPTIONS])).toEqual(sorted(API_USER_SELECTED_LEGAL_STATUSES));
  });

  it('has logic for every calculated legal status, and no others', () => {
    expect(sorted(Object.keys(calculatedCitizenshipFilters))).toEqual(sorted(API_CALCULATED_LEGAL_STATUSES));
  });
});
