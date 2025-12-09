import { render, screen, fireEvent, within } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { Filter } from './Filter';
import { useResultsContext } from '../Results';
import { Context } from '../../Wrapper/Wrapper';
import { createFilterState, createFormData } from '../testHelpers';
import { calculateDerivedFilters } from './citizenshipFilterConfig';
import { useMediaQuery } from '@mui/material';
import { Language } from '../../../Assets/languageOptions';

// Mock dependencies
jest.mock('../Results', () => ({
  useResultsContext: jest.fn(),
}));

jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useMediaQuery: jest.fn(),
}));

jest.mock('./citizenshipFilterConfig', () => ({
  ...jest.requireActual('./citizenshipFilterConfig'),
  calculateDerivedFilters: jest.fn(),
}));

const mockUseMediaQuery = useMediaQuery as jest.MockedFunction<typeof useMediaQuery>;
const mockCalculateDerivedFilters = calculateDerivedFilters as jest.MockedFunction<typeof calculateDerivedFilters>;

describe('Filter Component', () => {
  const mockSetFilterState = jest.fn();
  const defaultFormData = createFormData();
  const defaultFilterState = createFilterState('citizen');

  const createContextValue = (formData = defaultFormData) => ({
    formData,
    setFormData: jest.fn(),
    locale: 'en-us' as Language,
    selectLanguage: jest.fn(),
    getReferrer: jest.fn((_key, defaultValue) => defaultValue ?? '') as any,
    config: undefined,
    configLoading: false,
    theme: {} as any,
    setTheme: jest.fn(),
    styleOverride: undefined,
    stepLoading: false,
    setStepLoading: jest.fn(),
    pageIsLoading: false,
    setScreenLoading: jest.fn(),
    staffToken: undefined,
    setStaffToken: jest.fn(),
    whiteLabel: '',
    setWhiteLabel: jest.fn(),
  });

  const renderFilter = (
    filterState = defaultFilterState,
    formData = defaultFormData,
    isMobile = false,
    collapseDescription = false
  ) => {
    (useResultsContext as jest.Mock).mockReturnValue({
      filterState,
      setFilterState: mockSetFilterState,
    });

    // First call is for isMobile, second is for collapseDescription
    mockUseMediaQuery
      .mockReturnValueOnce(isMobile)
      .mockReturnValueOnce(collapseDescription);

    mockCalculateDerivedFilters.mockReturnValue(new Set());

    return render(
      <IntlProvider locale="en" messages={{}}>
        <Context.Provider value={createContextValue(formData)}>
          <Filter />
        </Context.Provider>
      </IntlProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the filter section with header', () => {
      renderFilter();
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Filter Results by Citizenship');
    });

    it('should render help text description', () => {
      renderFilter();
      expect(screen.getByText(/Select a citizenship status to see which benefits/i)).toBeInTheDocument();
    });

    it('should display current selection', () => {
      renderFilter(createFilterState('citizen'));
      expect(screen.getByText(/Current selection:/i)).toBeInTheDocument();
      const currentSelection = screen.getByText(/Current selection:/i).parentElement;
      expect(within(currentSelection as HTMLElement).getByText(/U.S. Citizen/i)).toBeInTheDocument();
    });

    it('should render desktop buttons on desktop view', () => {
      renderFilter(defaultFilterState, defaultFormData, false);

      // Should render buttons
      expect(screen.getByRole('button', { name: /Select citizen citizenship status/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Select gc_5plus citizenship status/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Select gc_5less citizenship status/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Select refugee citizenship status/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Select otherWithWorkPermission citizenship status/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Select non_citizen citizenship status/i })).toBeInTheDocument();
    });

    it('should render mobile dropdown on mobile view', () => {
      renderFilter(defaultFilterState, defaultFormData, true);

      // Should render dropdown - MUI Select renders as button with aria-haspopup
      const dropdown = screen.getByRole('button', { hidden: false });
      expect(dropdown).toHaveAttribute('aria-haspopup', 'listbox');
      expect(dropdown).toHaveTextContent('U.S. Citizen');
    });

    it('should display selected citizenship option in current selection', () => {
      renderFilter(createFilterState('gc_5plus'));
      const currentSelection = screen.getByText(/Current selection:/i).parentElement;
      expect(within(currentSelection as HTMLElement).getByText(/Green Card 5\+/i)).toBeInTheDocument();
    });
  });

  describe('Desktop Button Interaction', () => {
    it('should call setFilterState when clicking a citizenship button', () => {
      renderFilter(defaultFilterState, defaultFormData, false);

      mockCalculateDerivedFilters.mockReturnValue(new Set(['otherHealthCareUnder19']));

      const gc5lessButton = screen.getByRole('button', { name: /Select gc_5less citizenship status/i });
      fireEvent.click(gc5lessButton);

      expect(mockCalculateDerivedFilters).toHaveBeenCalledWith('gc_5less', defaultFormData.householdData);
      expect(mockSetFilterState).toHaveBeenCalledWith({
        selectedCitizenship: 'gc_5less',
        calculatedFilters: new Set(['otherHealthCareUnder19']),
      });
    });

    it('should mark selected button with contained variant', () => {
      renderFilter(createFilterState('refugee'), defaultFormData, false);

      const refugeeButton = screen.getByRole('button', { name: /Select refugee citizenship status/i });
      expect(refugeeButton).toHaveClass('selected');
    });

    it('should mark non-selected buttons with outlined variant', () => {
      renderFilter(createFilterState('citizen'), defaultFormData, false);

      const refugeeButton = screen.getByRole('button', { name: /Select refugee citizenship status/i });
      expect(refugeeButton).not.toHaveClass('selected');
    });

    it('should render all 6 citizenship options in correct order', () => {
      renderFilter(defaultFilterState, defaultFormData, false);

      const buttons = screen.getAllByRole('button').filter(btn =>
        btn.getAttribute('aria-label')?.includes('citizenship status')
      );

      expect(buttons).toHaveLength(6);
      expect(buttons[0]).toHaveAccessibleName(/citizen/i);
      expect(buttons[1]).toHaveAccessibleName(/gc_5plus/i);
      expect(buttons[2]).toHaveAccessibleName(/gc_5less/i);
      expect(buttons[3]).toHaveAccessibleName(/refugee/i);
      expect(buttons[4]).toHaveAccessibleName(/otherWithWorkPermission/i);
      expect(buttons[5]).toHaveAccessibleName(/non_citizen/i);
    });

    it('should render InfoOutlinedIcon for each button', () => {
      renderFilter(defaultFilterState, defaultFormData, false);

      const buttons = screen.getAllByRole('button').filter(btn =>
        btn.getAttribute('aria-label')?.includes('citizenship status')
      );

      buttons.forEach(button => {
        const icon = within(button).getByTestId('InfoOutlinedIcon');
        expect(icon).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Dropdown Interaction', () => {
    it('should display current selection in dropdown', () => {
      renderFilter(createFilterState('non_citizen'), defaultFormData, true);

      const dropdown = screen.getByRole('button', { hidden: false });
      expect(dropdown).toHaveTextContent(/Undocumented/i);
    });

    it('should call setFilterState when selecting from dropdown', () => {
      renderFilter(defaultFilterState, defaultFormData, true);

      mockCalculateDerivedFilters.mockReturnValue(new Set());

      const dropdown = screen.getByRole('button', { hidden: false });

      // Open dropdown
      fireEvent.mouseDown(dropdown);

      // Select option - need to find by text content in the menu item
      const options = screen.getAllByRole('option');
      const gc5lessOption = options.find(opt => opt.textContent?.includes('Green Card <5'));
      fireEvent.click(gc5lessOption!);

      expect(mockCalculateDerivedFilters).toHaveBeenCalledWith('gc_5less', defaultFormData.householdData);
      expect(mockSetFilterState).toHaveBeenCalledWith({
        selectedCitizenship: 'gc_5less',
        calculatedFilters: new Set(),
      });
    });

    it('should render all citizenship options in dropdown menu', () => {
      renderFilter(defaultFilterState, defaultFormData, true);

      const dropdown = screen.getByRole('button', { hidden: false });
      fireEvent.mouseDown(dropdown);

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(6);

      // Check that all options are present by text content
      const optionTexts = options.map(opt => opt.textContent);
      expect(optionTexts.some(text => text?.includes('U.S. Citizen'))).toBe(true);
      expect(optionTexts.some(text => text?.includes('Green Card 5+'))).toBe(true);
      expect(optionTexts.some(text => text?.includes('Green Card <5'))).toBe(true);
      expect(optionTexts.some(text => text?.includes('Refugee/Asylee'))).toBe(true);
      expect(optionTexts.some(text => text?.includes('Other Lawful'))).toBe(true);
      expect(optionTexts.some(text => text?.includes('Undocumented'))).toBe(true);
    });
  });

  describe('Calculated Filters Integration', () => {
    it('should calculate derived filters based on household data when citizenship changes', () => {
      const formDataWithPregnant = createFormData({
        householdData: [
          {
            frontendId: 'member1',
            age: 25,
            conditions: { pregnant: true },
          } as any,
        ],
      });

      renderFilter(defaultFilterState, formDataWithPregnant, false);

      // Clear the initial mock calls from render
      mockCalculateDerivedFilters.mockClear();
      mockSetFilterState.mockClear();

      // Set the return value for the next call
      mockCalculateDerivedFilters.mockReturnValue(new Set(['otherHealthCarePregnant']));

      const nonCitizenButton = screen.getByRole('button', { name: /Select non_citizen citizenship status/i });
      fireEvent.click(nonCitizenButton);

      expect(mockCalculateDerivedFilters).toHaveBeenCalledWith('non_citizen', formDataWithPregnant.householdData);
      expect(mockSetFilterState).toHaveBeenCalledWith({
        selectedCitizenship: 'non_citizen',
        calculatedFilters: new Set(['otherHealthCarePregnant']),
      });
    });

    it('should pass empty set when no derived filters apply', () => {
      mockCalculateDerivedFilters.mockReturnValue(new Set());

      renderFilter(defaultFilterState, defaultFormData, false);

      const citizenButton = screen.getByRole('button', { name: /Select citizen citizenship status/i });
      fireEvent.click(citizenButton);

      expect(mockSetFilterState).toHaveBeenCalledWith({
        selectedCitizenship: 'citizen',
        calculatedFilters: new Set(),
      });
    });
  });

  describe('Description Collapse/Expand', () => {
    it('should show expand button when description should collapse', () => {
      renderFilter(defaultFilterState, defaultFormData, false, true);

      const expandButton = screen.getByRole('button', { name: /Show more/i });
      expect(expandButton).toBeInTheDocument();
    });

    it('should not show expand button when description should not collapse', () => {
      renderFilter(defaultFilterState, defaultFormData, false, false);

      expect(screen.queryByRole('button', { name: /Show more/i })).not.toBeInTheDocument();
    });

    it('should render expand button and allow clicking', () => {
      renderFilter(defaultFilterState, defaultFormData, false, true);

      const expandButton = screen.getByLabelText('Show more');
      expect(expandButton).toHaveTextContent('Show more');
      expect(expandButton).toBeInTheDocument();

      // Verify button is clickable (doesn't throw)
      expect(() => fireEvent.click(expandButton)).not.toThrow();
    });

    it('should have expand button that is clickable', () => {
      renderFilter(defaultFilterState, defaultFormData, false, true);

      const expandButton = screen.getByLabelText('Show more');
      expect(expandButton).toBeInTheDocument();

      // Button should be clickable
      fireEvent.click(expandButton);

      // Verify button was clicked without errors
      expect(expandButton).toBeDefined();
    });

    it('should add collapsed class when description is collapsed', () => {
      renderFilter(defaultFilterState, defaultFormData, false, true);

      const descriptionContainer = screen.getByText(/Select a citizenship status to see which benefits/i).parentElement;
      expect(descriptionContainer).toHaveClass('collapsed');
    });

    it('should remove collapsed class when description is expanded', () => {
      renderFilter(defaultFilterState, defaultFormData, false, true);

      const expandButton = screen.getByRole('button', { name: /Show more/i });
      fireEvent.click(expandButton);

      const descriptionContainer = screen.getByText(/Select a citizenship status to see which benefits/i).parentElement;
      expect(descriptionContainer).not.toHaveClass('collapsed');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for desktop buttons', () => {
      renderFilter(defaultFilterState, defaultFormData, false);

      expect(screen.getByRole('button', { name: /Select citizen citizenship status/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Select gc_5plus citizenship status/i })).toBeInTheDocument();
    });

    it('should have proper ARIA label for mobile dropdown', () => {
      renderFilter(defaultFilterState, defaultFormData, true);

      const dropdown = screen.getByRole('button', { hidden: false });
      expect(dropdown).toHaveAttribute('aria-haspopup', 'listbox');
    });

    it('should have aria-live region for description', () => {
      renderFilter(defaultFilterState, defaultFormData, false);

      const descriptionContainer = screen.getByText(/Select a citizenship status to see which benefits/i).parentElement;
      expect(descriptionContainer).toHaveAttribute('aria-live', 'polite');
    });

    it('should have proper aria-label for expand/collapse button', () => {
      renderFilter(defaultFilterState, defaultFormData, false, true);

      const expandButton = screen.getByLabelText('Show more');
      expect(expandButton).toHaveAttribute('aria-label', 'Show more');
      expect(expandButton).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should switch from desktop to mobile view based on media query', () => {
      const { rerender } = renderFilter(defaultFilterState, defaultFormData, false);

      // Desktop view - buttons should exist
      expect(screen.getByRole('button', { name: /Select citizen citizenship status/i })).toBeInTheDocument();

      // Simulate mobile view
      mockUseMediaQuery.mockReturnValueOnce(true).mockReturnValueOnce(false);

      rerender(
        <IntlProvider locale="en" messages={{}}>
          <Context.Provider value={createContextValue(defaultFormData)}>
            <Filter />
          </Context.Provider>
        </IntlProvider>
      );

      // Mobile view - dropdown should exist
      const dropdown = screen.getByRole('button', { hidden: false });
      expect(dropdown).toHaveAttribute('aria-haspopup', 'listbox');
    });
  });

  describe('Edge Cases', () => {
    it('should handle clicking the same citizenship option again', () => {
      renderFilter(createFilterState('citizen'), defaultFormData, false);

      mockCalculateDerivedFilters.mockReturnValue(new Set());

      const citizenButton = screen.getByRole('button', { name: /Select citizen citizenship status/i });
      fireEvent.click(citizenButton);

      expect(mockSetFilterState).toHaveBeenCalledWith({
        selectedCitizenship: 'citizen',
        calculatedFilters: new Set(),
      });
    });

    it('should handle empty household data', () => {
      const emptyFormData = createFormData({ householdData: [] });
      mockCalculateDerivedFilters.mockReturnValue(new Set());

      renderFilter(defaultFilterState, emptyFormData, false);

      const refugeeButton = screen.getByRole('button', { name: /Select refugee citizenship status/i });
      fireEvent.click(refugeeButton);

      expect(mockCalculateDerivedFilters).toHaveBeenCalledWith('refugee', []);
      expect(mockSetFilterState).toHaveBeenCalled();
    });

    it('should maintain filter state across re-renders', () => {
      const { rerender } = renderFilter(createFilterState('gc_5plus'), defaultFormData, false);

      const currentSelection1 = screen.getByText(/Current selection:/i).parentElement;
      expect(within(currentSelection1 as HTMLElement).getByText(/Green Card 5\+/i)).toBeInTheDocument();

      // Re-render with same state
      rerender(
        <IntlProvider locale="en" messages={{}}>
          <Context.Provider value={createContextValue(defaultFormData)}>
            <Filter />
          </Context.Provider>
        </IntlProvider>
      );

      const currentSelection2 = screen.getByText(/Current selection:/i).parentElement;
      expect(within(currentSelection2 as HTMLElement).getByText(/Green Card 5\+/i)).toBeInTheDocument();
    });
  });

  describe('Integration with FilterState', () => {
    it('should correctly display all citizenship options from config', () => {
      renderFilter(defaultFilterState, defaultFormData, false);

      // Verify all 6 options are rendered
      const citizenshipButtons = screen.getAllByRole('button').filter(btn =>
        btn.getAttribute('aria-label')?.includes('citizenship status')
      );

      expect(citizenshipButtons).toHaveLength(6);
    });

    it('should use calculateDerivedFilters for each citizenship change', () => {
      renderFilter(defaultFilterState, defaultFormData, false);

      mockCalculateDerivedFilters.mockClear();

      const gc5lessButton = screen.getByRole('button', { name: /Select gc_5less citizenship status/i });
      fireEvent.click(gc5lessButton);

      expect(mockCalculateDerivedFilters).toHaveBeenCalledTimes(1);
      expect(mockCalculateDerivedFilters).toHaveBeenCalledWith('gc_5less', defaultFormData.householdData);
    });
  });
});
