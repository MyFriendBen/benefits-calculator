import { buildTabs, getNextTabIndex } from './buildTabs';

const args = {
  benefitsLink: '/co/uuid/results/benefits',
  needsLink: '/co/uuid/results/near-term-needs',
  helpLink: '/co/uuid/results/more-help',
  programCount: 4,
  needCount: 2,
  immediateHelpSuppressed: false,
};

describe('buildTabs', () => {
  it('builds all three tabs in order by default', () => {
    expect(buildTabs(args).map((tab) => tab.id)).toEqual(['program', 'need', 'help']);
  });

  it('omits the Immediate Help tab when the referrer suppresses it', () => {
    const tabs = buildTabs({ ...args, immediateHelpSuppressed: true });

    expect(tabs.map((tab) => tab.id)).toEqual(['program', 'need']);
    expect(tabs.find((tab) => tab.id === 'help')).toBeUndefined();
  });

  it('puts the result counts on the two result tabs', () => {
    const tabs = buildTabs(args);

    expect(tabs.find((tab) => tab.id === 'program')?.count).toBe(4);
    expect(tabs.find((tab) => tab.id === 'need')?.count).toBe(2);
  });

  it('leaves Immediate Help without a count', () => {
    // Mirrors the no-count rationale in buildTabs.ts.
    expect(buildTabs(args).find((tab) => tab.id === 'help')?.count).toBeUndefined();
  });

  it('keeps the existing test ids so e2e selectors and aria wiring stay valid', () => {
    expect(buildTabs(args).map((tab) => tab.testId)).toEqual([
      'long-term-benefits-tab',
      'near-term-benefits-tab',
      'immediate-help-tab',
    ]);
  });

  it('gives every tab a distinct GA4 tab_name', () => {
    const trackNames = buildTabs(args).map((tab) => tab.trackName);

    expect(trackNames).toEqual(['long_term_benefits', 'additional_resources', 'immediate_help']);
    expect(new Set(trackNames).size).toBe(trackNames.length);
  });

  it('links each tab at its own route', () => {
    const tabs = buildTabs(args);

    expect(tabs.find((tab) => tab.id === 'program')?.to).toBe(args.benefitsLink);
    expect(tabs.find((tab) => tab.id === 'need')?.to).toBe(args.needsLink);
    expect(tabs.find((tab) => tab.id === 'help')?.to).toBe(args.helpLink);
  });
});

describe('getNextTabIndex', () => {
  it('moves forward and wraps at the end', () => {
    expect(getNextTabIndex('ArrowRight', 0, 3)).toBe(1);
    expect(getNextTabIndex('ArrowRight', 1, 3)).toBe(2);
    expect(getNextTabIndex('ArrowRight', 2, 3)).toBe(0);
    expect(getNextTabIndex('ArrowDown', 2, 3)).toBe(0);
  });

  it('moves backward and wraps at the start without going negative', () => {
    expect(getNextTabIndex('ArrowLeft', 2, 3)).toBe(1);
    expect(getNextTabIndex('ArrowLeft', 0, 3)).toBe(2);
    expect(getNextTabIndex('ArrowUp', 0, 3)).toBe(2);
  });

  it('jumps to the first and last tab', () => {
    expect(getNextTabIndex('Home', 2, 3)).toBe(0);
    // Regression guard: End must be tabCount - 1. Generalising the old hardcoded
    // `nextIndex = 1` to `tabs.length` would land out of bounds here.
    expect(getNextTabIndex('End', 0, 3)).toBe(2);
  });

  it('still works with two tabs, for referrers that suppress Immediate Help', () => {
    expect(getNextTabIndex('ArrowRight', 1, 2)).toBe(0);
    expect(getNextTabIndex('ArrowLeft', 0, 2)).toBe(1);
    expect(getNextTabIndex('End', 0, 2)).toBe(1);
    expect(getNextTabIndex('Home', 1, 2)).toBe(0);
  });

  it('never returns an out-of-range index', () => {
    for (const tabCount of [2, 3]) {
      for (const key of ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End']) {
        for (let current = 0; current < tabCount; current++) {
          const next = getNextTabIndex(key, current, tabCount);

          expect(next).not.toBeNull();
          expect(next).toBeGreaterThanOrEqual(0);
          expect(next).toBeLessThan(tabCount);
        }
      }
    }
  });

  it('ignores keys that should not move focus', () => {
    expect(getNextTabIndex('Enter', 0, 3)).toBeNull();
    expect(getNextTabIndex('Tab', 0, 3)).toBeNull();
    expect(getNextTabIndex('a', 0, 3)).toBeNull();
  });
});
