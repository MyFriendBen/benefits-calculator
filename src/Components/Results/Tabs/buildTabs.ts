export type ResultsTabId = 'program' | 'need' | 'help';

export type TabDescriptor = {
  id: ResultsTabId;
  to: string;
  testId: string;
  labelId: string;
  defaultMessage: string;
  // undefined => no "(n)" suffix. Immediate Help opts out this way.
  count?: number;
  // GA4 `tab_name`; single source of truth so the literal isn't copy-pasted per tab.
  trackName: string;
};

type BuildTabsArgs = {
  benefitsLink: string;
  needsLink: string;
  helpLink: string;
  programCount: number;
  needCount: number;
  immediateHelpSuppressed: boolean;
};

// Pure so the tab set can be tested without Router/Intl/Context providers.
export function buildTabs({
  benefitsLink,
  needsLink,
  helpLink,
  programCount,
  needCount,
  immediateHelpSuppressed,
}: BuildTabsArgs): TabDescriptor[] {
  const tabs: TabDescriptor[] = [
    {
      id: 'program',
      to: benefitsLink,
      testId: 'long-term-benefits-tab',
      labelId: 'resultsOptions.longTermBenefits',
      defaultMessage: 'Long-Term Benefits ',
      count: programCount,
      trackName: 'long_term_benefits',
    },
    {
      id: 'need',
      to: needsLink,
      testId: 'near-term-benefits-tab',
      labelId: 'resultsOptions.nearTermBenefits',
      defaultMessage: 'Additional Resources ',
      count: needCount,
      trackName: 'additional_resources',
    },
  ];

  // No count: the resource list is fixed per-tenant config, not household-specific,
  // so a count would falsely imply personalization.
  if (!immediateHelpSuppressed) {
    tabs.push({
      id: 'help',
      to: helpLink,
      testId: 'immediate-help-tab',
      labelId: 'resultsOptions.immediateHelp',
      defaultMessage: 'Immediate Help',
      trackName: 'immediate_help',
    });
  }

  return tabs;
}

// Roving-tabindex arithmetic, extracted so it's testable without rendering.
// Returns null for keys that shouldn't move focus. `tabCount` varies (2 or 3),
// so nothing here may assume 3.
export function getNextTabIndex(key: string, currentIndex: number, tabCount: number): number | null {
  if (key === 'ArrowRight' || key === 'ArrowDown') {
    return (currentIndex + 1) % tabCount;
  }

  if (key === 'ArrowLeft' || key === 'ArrowUp') {
    return (currentIndex - 1 + tabCount) % tabCount;
  }

  if (key === 'Home') {
    return 0;
  }

  if (key === 'End') {
    return tabCount - 1;
  }

  return null;
}
