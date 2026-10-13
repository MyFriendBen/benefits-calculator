/**
 * Guards the icon-name maps against typos: every value in OPTION_CARD_ICON_MAP and
 * ICON_NAME_MAP must resolve to a real Lucide icon. A bad name renders nothing and
 * only console.warns at runtime (see Icon.tsx), so this catches it at test time.
 * This is the same class of bug that the `house-roof` correction fixed during development.
 */
import { render } from '@testing-library/react';
import { Icon } from './Icon';
import { ICON_NAME_MAP } from '../Results/helpers';
import { OPTION_CARD_ICON_MAP } from '../Config/configHook';

type Entry = [map: string, key: string, name: string];

const entriesFor = (map: string, record: Record<string, string>): Entry[] =>
  Object.entries(record).map(([key, name]) => [map, key, name]);

const cases: Entry[] = [
  ...entriesFor('OPTION_CARD_ICON_MAP', OPTION_CARD_ICON_MAP),
  ...entriesFor('ICON_NAME_MAP', ICON_NAME_MAP),
];

describe('icon name maps resolve to real Lucide icons', () => {
  let warn: jest.SpyInstance;

  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it.each(cases)('%s["%s"] = "%s" renders a Lucide svg', (_map, _key, name) => {
    const { container } = render(<Icon name={name} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(warn).not.toHaveBeenCalled();
  });

  it('maps the Aging and Youth_development option cards to non-placeholder icons', () => {
    expect(OPTION_CARD_ICON_MAP['Aging']).toBe('tree-deciduous');
    expect(OPTION_CARD_ICON_MAP['Youth_development']).toBe('shapes');
  });

  it('keeps the results-side aging/youth_development icons in sync with the option cards', () => {
    expect(ICON_NAME_MAP['aging']).toBe('tree-deciduous');
    expect(ICON_NAME_MAP['youth_development']).toBe('shapes');
  });
});
