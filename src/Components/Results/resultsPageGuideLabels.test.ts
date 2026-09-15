/**
 * Drift guard for Benji's description of this page (MFB-1872).
 *
 * `_RESULTS_PAGE_GUIDE` in ai-service (`app/prompts.py`) tells Benji, in the same
 * closed-world terms as the program list, that it knows every control the results page
 * has. That description is a hand-written string in a DIFFERENT REPO, so nothing keeps
 * it honest when this page changes — and the failure is invisible in code review and
 * silent at runtime: Benji confidently sends people to click something that no longer
 * exists.
 *
 * This is the cheapest real enforcement available from inside this repo. It asserts the
 * controls the guide names still exist here, by reading the source rather than
 * rendering, because rendering each surface would need the whole results context and
 * would test far more than the labels.
 *
 * WHEN THIS FAILS, the fix is usually in ai-service, not here: update
 * `_RESULTS_PAGE_GUIDE`, bump `PROMPT_VERSION`, then update the expectation below.
 * Do NOT simply delete the expectation.
 *
 * It is a floor, not a ceiling. It cannot tell you the guide is *complete* — a control
 * added here and never described to Benji passes silently. The negative cases below are
 * the ones that have already caught something real.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const read = (relativePath: string) => readFileSync(join(__dirname, relativePath), 'utf8');

/** The `defaultMessage` literals in a component — i.e. the words the user reads. */
const userFacingCopy = (source: string): string[] =>
  [...source.matchAll(/defaultMessage[=:]\s*['"`]([^'"`]*)['"`]/g)].map((m) => m[1]);

// Each entry: the file that must contain it, and the literal the guide relies on.
const REQUIRED: ReadonlyArray<[label: string, file: string]> = [
  // Two tabs, each with a count.
  ['Long-Term Benefits', 'Tabs/Tabs.tsx'],
  ['Additional Resources', 'Tabs/Tabs.tsx'],

  // Citizenship filter: the header and all six options the guide enumerates.
  ['Filter Results by Citizenship', 'Filter/Filter.tsx'],
  ['U.S. Citizen', 'Filter/citizenshipFilterConfig.tsx'],
  ['Green Card 5+', 'Filter/citizenshipFilterConfig.tsx'],
  ['Green Card <5', 'Filter/citizenshipFilterConfig.tsx'],
  ['Refugee/Asylee', 'Filter/citizenshipFilterConfig.tsx'],
  ['Other Lawful', 'Filter/citizenshipFilterConfig.tsx'],
  ['Undocumented', 'Filter/citizenshipFilterConfig.tsx'],

  // Program card: the three things the guide says a card shows, plus the way in.
  ['Application Time: ', 'Programs/ProgramCard.tsx'],
  ['Estimated Savings: ', 'Programs/ProgramCard.tsx'],
  ['More Info', 'Programs/ProgramCard.tsx'],

  // The program's own page — where the guide says applying happens.
  ['Apply Online', 'ProgramPage/ProgramPage.tsx'],
  ['Get Help Applying', 'ProgramPage/ProgramPage.tsx'],
  ['Required Key Documents Checklist', 'ProgramPage/ProgramPage.tsx'],
  ['Estimated Time to Apply', 'ProgramPage/ProgramPage.tsx'],

  // Save My Results: the button, the modal, and exactly the three channels.
  ['SAVE MY RESULTS', 'BackAndSaveButtons/BackAndSaveButtons.tsx'],
  ['Save My Results', 'SaveMyResultsModal/SaveMyResultsModal.tsx'],
  ['Email a link to your results', 'SaveMyResultsModal/SaveMyResultsModal.tsx'],
  ['Text a link to your results', 'SaveMyResultsModal/SaveMyResultsModal.tsx'],
  ['Copy to Clipboard', 'SaveMyResultsModal/SaveMyResultsModal.tsx'],

  // Navigation out of the results, and the 211 escape hatch.
  ['BACK TO SCREENER', 'ResultsHeader/ResultsHeader.tsx'],
  ['BACK TO RESULTS', 'ProgramPage/ProgramPage.tsx'],
  ['More Help', '211Button/211Button.tsx'],

  // Additional-resources cards: collapsed, then a website link.
  ['More Info', 'Needs/NeedCard.tsx'],
  ['Visit Website', 'Needs/NeedCard.tsx'],
];

describe('controls named in Benji\'s results-page guide', () => {
  it.each(REQUIRED)('still renders %s (%s)', (label, file) => {
    expect(read(file)).toContain(label);
  });
});

describe('controls the guide tells Benji do NOT exist', () => {
  /**
   * The one that has already bitten. MFB-1872's own description of the modal listed
   * WhatsApp alongside email and SMS; `SaveViaWhatsAppForm.tsx` does exist, but nothing
   * imports it, so the option is not on the page. Writing it into the guide would have
   * shipped a fabricated control — the exact failure the guide exists to prevent.
   *
   * Asserted against the modal that actually renders the choices, not the repo as a
   * whole, so the dead form file can stay or go without changing the answer.
   */
  it('offers no WhatsApp channel in Save My Results', () => {
    expect(read('SaveMyResultsModal/SaveMyResultsModal.tsx')).not.toMatch(/whats\s?app/i);
  });

  /**
   * The guide states flatly that results cannot be downloaded, printed or exported,
   * and that there is no sort control. Each is an explicit trap in ai-service's
   * trap suite; if one of these ever ships, those traps start scoring the truth as a
   * fabrication.
   */
  it('offers no download, print or export of results', () => {
    const surfaces = [
      'SaveMyResultsModal/SaveMyResultsModal.tsx',
      'BackAndSaveButtons/BackAndSaveButtons.tsx',
    ];
    for (const file of surfaces) {
      // Only the copy the user actually sees. Scanning whole source matches the
      // `export default` on the last line of every component, which says nothing
      // about what the page offers.
      for (const copy of userFacingCopy(read(file))) {
        expect(copy).not.toMatch(/\b(download|print|printable|export|pdf)\b/i);
      }
    }
  });

  it('offers no control for sorting or reordering the program list', () => {
    expect(read('Programs/Programs.tsx')).not.toMatch(/onClick|<Select|<Button/);
  });
});
