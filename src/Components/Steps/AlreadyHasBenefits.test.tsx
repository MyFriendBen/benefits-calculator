import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { Context } from '../Wrapper/Wrapper';
import AlreadyHasBenefits from './AlreadyHasBenefits';
import type { FormData } from '../../Types/FormData';
import type { HasBenefitsProgram } from '../../Types/ApiCalls';

// ─── Mocks ───────────────────────────────────────────────────────────────────

// Stub nav chrome — submit button only; deep router deps aren't relevant here.
jest.mock('../PrevAndContinueButtons/PrevAndContinueButtons', () => ({
  __esModule: true,
  default: () => <button type="submit">Continue</button>,
}));

jest.mock('../QuestionComponents/questionHooks', () => ({
  useDefaultBackNavigationFunction: () => jest.fn(),
  useGoToNextStep: () => jest.fn(),
}));

jest.mock('../Config/configHook', () => ({
  useConfig: () => ({}),
}));

const mockUpdateScreen = jest.fn();
jest.mock('../../Assets/updateScreen', () => ({
  __esModule: true,
  default: () => ({ updateScreen: mockUpdateScreen }),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ uuid: 'test-uuid-123' }),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const program = (name_abbreviated: string, label: string): HasBenefitsProgram => ({
  name_abbreviated,
  name: { label: `program.${name_abbreviated}-name`, default_message: label },
  website_description: { label: `program.${name_abbreviated}-desc`, default_message: `${label} description` },
  category: null,
});

const PROGRAMS: HasBenefitsProgram[] = [program('snap', 'SNAP'), program('tanf', 'TANF')];

function renderStep(initialBenefits: Set<string> = new Set()) {
  const formData = { benefits: initialBenefits } as FormData;
  render(
    <IntlProvider locale="en">
      <Context.Provider
        value={
          {
            formData,
            hasBenefitsPrograms: PROGRAMS,
            hasBenefitsProgramsLoading: false,
            hasBenefitsProgramsError: false,
            setStepLoading: jest.fn(),
          } as any
        }
      >
        <AlreadyHasBenefits />
      </Context.Provider>
    </IntlProvider>,
  );
}

// aria-pressed reflects the tile's selected state (HasBenefitsTile).
const tile = (name: RegExp) => screen.getByRole('button', { name });

describe('AlreadyHasBenefits — Set toggle', () => {
  beforeEach(() => mockUpdateScreen.mockClear());

  it('renders a tile per program, unselected by default', () => {
    renderStep();
    expect(tile(/SNAP/)).toHaveAttribute('aria-pressed', 'false');
    expect(tile(/TANF/)).toHaveAttribute('aria-pressed', 'false');
  });

  it('pre-selects tiles present in the initial benefits Set', () => {
    renderStep(new Set(['snap']));
    expect(tile(/SNAP/)).toHaveAttribute('aria-pressed', 'true');
    expect(tile(/TANF/)).toHaveAttribute('aria-pressed', 'false');
  });

  it('adds a name to the Set when an unselected tile is clicked', () => {
    renderStep();
    fireEvent.click(tile(/SNAP/));
    expect(tile(/SNAP/)).toHaveAttribute('aria-pressed', 'true');
    // sibling untouched — one membership entry per tile, no fan-out
    expect(tile(/TANF/)).toHaveAttribute('aria-pressed', 'false');
  });

  it('deletes a name from the Set when a selected tile is clicked', () => {
    renderStep(new Set(['snap']));
    fireEvent.click(tile(/SNAP/));
    expect(tile(/SNAP/)).toHaveAttribute('aria-pressed', 'false');
  });

  it('submits current selections as a Set of name_abbreviated values', async () => {
    renderStep(new Set(['snap']));
    fireEvent.click(tile(/TANF/)); // add tanf
    fireEvent.click(tile(/SNAP/)); // remove snap
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => expect(mockUpdateScreen).toHaveBeenCalledTimes(1));
    const submitted = mockUpdateScreen.mock.calls[0][0];
    expect(submitted.benefits).toBeInstanceOf(Set);
    expect(Array.from(submitted.benefits)).toEqual(['tanf']);
    expect(submitted.hasBenefits).toBe('true');
  });

  it('submits hasBenefits=false when nothing is selected', async () => {
    renderStep(new Set(['snap']));
    fireEvent.click(tile(/SNAP/)); // deselect the only selection
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => expect(mockUpdateScreen).toHaveBeenCalledTimes(1));
    const submitted = mockUpdateScreen.mock.calls[0][0];
    expect(Array.from(submitted.benefits)).toEqual([]);
    expect(submitted.hasBenefits).toBe('false');
  });
});
