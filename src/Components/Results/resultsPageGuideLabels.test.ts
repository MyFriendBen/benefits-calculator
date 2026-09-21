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

/**
 * The `defaultMessage` literals in a component — i.e. the words the user reads.
 *
 * Quote-aware on purpose. An earlier version closed the capture on ANY quote
 * character (`[^'"`]*`), so it stopped at the first apostrophe in the copy:
 * `defaultMessage="Don't wait — download a PDF"` extracted `Don`, and the negative
 * assertions below then passed on text that contained the very word they ban.
 * Apostrophes are common in this repo's copy, so that was not hypothetical.
 */
const userFacingCopy = (source: string): string[] =>
  [...source.matchAll(/defaultMessage[=:]\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g)].map((m) => m[2]);

// Each entry: the file that must contain it, and the literal the guide relies on.
const REQUIRED: ReadonlyArray<[label: string, file: string]> = [
  // Two tabs, each with a count. Labels moved into buildTabs.ts when the tab
  // metadata was extracted there; the words themselves are unchanged.
  ['Long-Term Benefits', 'Tabs/buildTabs.ts'],
  ['Additional Resources', 'Tabs/buildTabs.ts'],

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
  // This button's own text changed from "More Help" to "Immediate Help" (it
  // now shares the tab's translation key). Benji's guide in ai-service needs
  // the matching update — flagged in the PR description, not yet confirmed.
  ['Immediate Help', '211Button/211Button.tsx'],

  // Additional-resources cards: collapsed, then a website link.
  ['More Info', 'Needs/NeedCard.tsx'],
  ['Visit Website', 'Needs/NeedCard.tsx'],

  // The link back to the immediate-needs step. Benji is now told it may point someone
  // here when they raise a need no resource in their list covers, and may name the
  // category to add — so this is the one control in the guide Benji actively SENDS
  // people to rather than merely describes. If this copy goes, Benji starts directing
  // people to a link that isn't on the page.
  ['edit your selections in', 'Needs/Needs.tsx'],
];

describe("controls named in Benji's results-page guide", () => {
  it.each(REQUIRED)('still renders %s (%s)', (label, file) => {
    expect(read(file)).toContain(label);
  });
});

describe('the additional-resources tab, which Benji can now read from', () => {
  /**
   * Benji is given each resource's description, phone number and website, and told that
   * list is the complete set the person has. That claim is only true while this tab
   * renders every resource the API returns — the moment a filter lands here, Benji's
   * list and the user's screen diverge silently, in the direction the closed-world rule
   * cannot catch: it confidently offers an organization that is no longer on screen.
   *
   * The benefits tab has exactly this problem already, which is why `visible_programs`
   * exists (MFB-1427) — the client reports what survived its own filters and the server
   * intersects. Nothing equivalent exists for resources, deliberately, BECAUSE this tab
   * does no filtering. This test is what makes that "deliberately" true rather than
   * true-for-now.
   *
   * Asserted on the render, not on the component's whole source: sorting is fine (Benji
   * is told the order) and so is the existing category sort. What must not appear is a
   * predicate that drops resources.
   */
  it('renders every resource it is given, with no filtering', () => {
    const source = read('Needs/Needs.tsx');
    const rendered = source.slice(source.indexOf('return ('));

    expect(rendered).toContain('needsSortedByCategory.map');
    expect(rendered).not.toMatch(/\.filter\(/);
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
    const surfaces = ['SaveMyResultsModal/SaveMyResultsModal.tsx', 'BackAndSaveButtons/BackAndSaveButtons.tsx'];
    for (const file of surfaces) {
      // Only the copy the user actually sees. Scanning whole source matches the
      // `export default` on the last line of every component, which says nothing
      // about what the page offers.
      const copies = userFacingCopy(read(file));
      // Without this the assertion below is vacuous: move this copy into a
      // `defineMessages({...})` block in a sibling messages.ts and `copies` is
      // empty, so the loop never runs, the test stays green, and a "Download PDF"
      // control ships against a guide that promises there is none.
      expect(copies.length).toBeGreaterThan(0);
      for (const copy of copies) {
        expect(copy).not.toMatch(/\b(download|print|printable|export|pdf)\b/i);
      }
    }
  });

  /**
   * Asserted as a POSITIVE fact about the ordering, not as an absence of widgets.
   *
   * This started as `not.toMatch(/onClick|<Select|<Button/)` against Programs.tsx,
   * which was wrong both ways. Under-specified: Programs.tsx already delegates its
   * one filter control to a child (`<Filter />`), so a `<SortControl />` added the
   * same way contains none of those tokens and the guard stays green while the
   * guide's "THERE IS NO SORT CONTROL" goes false. Over-specified: any unrelated
   * interactive element — a "show more" toggle, a retry button — failed a test
   * about sorting, and this file's docstring would then send that author off to
   * edit an ai-service prompt.
   *
   * What the guide actually claims is that the order is automatic, so that is what
   * is asserted: the sort runs, unconditionally, over the rendered categories.
   */
  it('still orders the program list automatically', () => {
    const source = read('Programs/Programs.tsx');
    expect(source).toContain('function sortProgramsIntoCategories');
    expect(source).toMatch(/sortProgramsIntoCategories\(/);
    // Tax credits last (MFB-1185), then priority, then value — the specific order
    // the guide describes to the user.
    expect(source).toMatch(/tax_category/);
  });
});
