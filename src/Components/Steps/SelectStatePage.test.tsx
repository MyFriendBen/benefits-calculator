import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { Context } from '../Wrapper/Wrapper';
import SelectStatePage from './SelectStatePage';
import { createMockContextValue } from '../../test-utils/renderHelpers';

// ─── Mocks ───────────────────────────────────────────────────────────────────

// Stub nav chrome — the dropdown contents are what matter here.
jest.mock('../PrevAndContinueButtons/PrevAndContinueButtons', () => ({
  __esModule: true,
  default: () => <button type="submit">Continue</button>,
}));

jest.mock('../QuestionComponents/questionHooks', () => ({
  useQueryString: () => '',
}));

jest.mock('../Common/usePageTitle', () => ({
  usePageTitle: jest.fn(),
}));

jest.mock('../../Assets/analytics', () => ({
  useTrackEvent: () => jest.fn(),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CATALOG = [
  { code: 'co', name: 'Colorado', public: true },
  { code: 'ks', name: 'Kansas', public: false },
  { code: 'mo', name: 'Missouri', public: false },
  { code: 'wa', name: 'Washington', public: true },
];

function renderPage(referrerStates: string[]) {
  const contextValue = createMockContextValue({
    config: { state_options: CATALOG } as any,
    getReferrer: ((key: string, defaultValue: unknown) =>
      key === 'stateOptions' ? referrerStates : defaultValue) as any,
  });

  render(
    <IntlProvider locale="en">
      <Context.Provider value={contextValue}>
        <MemoryRouter>
          <SelectStatePage />
        </MemoryRouter>
      </Context.Provider>
    </IntlProvider>,
  );
}

function openStateDropdown() {
  // MUI v5 renders the Select trigger as a button with aria-haspopup=listbox, not a combobox.
  const trigger = screen.getAllByRole('button').find((el) => el.getAttribute('aria-haspopup') === 'listbox');
  fireEvent.mouseDown(trigger!);

  return screen
    .getAllByRole('option')
    .map((option) => option.textContent)
    .filter((text) => text !== 'Choose your state');
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('SelectStatePage', () => {
  it("offers the catalog's public states when the referrer sets no state options", () => {
    renderPage([]);

    const states = openStateDropdown();

    expect(states).toEqual(['Colorado', 'Washington']);
  });

  it('offers only Kansas and Missouri for a referrer scoped to those states', () => {
    renderPage(['ks', 'mo']);

    expect(openStateDropdown()).toEqual(['Kansas', 'Missouri']);
  });
});
