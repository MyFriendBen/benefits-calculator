import { useContext, useState, useCallback, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useResultsContext } from '../Results';
import { Button, Typography, Select, MenuItem, FormControl, useMediaQuery, Tooltip } from '@mui/material';
import {
  calculatedCitizenshipFilters,
  CitizenLabelOptions,
  CitizenLabels,
  citizenshipFilterConfig,
} from '../../../Assets/citizenshipFilterFormControlLabels';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import './Filter.css';
import '../../QuestionComponentContainer/QuestionComponentContainer.css';
import { Context } from '../../Wrapper/Wrapper';
import { BREAKPOINTS } from '../../../utils/breakpoints';

// Define the order of citizenship options
const CITIZENSHIP_OPTIONS: CitizenLabelOptions[] = [
  'citizen',
  'gc_5plus',
  'gc_5less',
  'refugee',
  'otherWithWorkPermission',
  'non_citizen',
];

export const Filter = () => {
  const { filtersChecked, setFiltersChecked } = useResultsContext();
  const { formData } = useContext(Context);
  const intl = useIntl();
  const isMobile = useMediaQuery(`(max-width: ${BREAKPOINTS.desktop - 1}px)`);
  const collapseDescription = useMediaQuery('(max-width: 730px)');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Derive selected citizenship from filtersChecked (exactly one is always true)
  // Using find() is more efficient than a loop since we know exactly one will match
  const selectedCitizenship =
    CITIZENSHIP_OPTIONS.find((option) => filtersChecked[option]) ?? 'citizen';

  const handleCitizenshipChange = useCallback((newStatus: CitizenLabelOptions) => {
    // Build the new filter state with type safety
    const citizenshipFilters: Partial<Record<CitizenLabelOptions, boolean>> = {};
    CITIZENSHIP_OPTIONS.forEach((option) => {
      citizenshipFilters[option] = option === newStatus;
    });

    // Calculate derived filters for the selected status
    const calculatedFilters: Record<string, boolean> = {};
    Object.entries(calculatedCitizenshipFilters).forEach(([filterName, calculator]) => {
      calculatedFilters[filterName] =
        calculator.linkedFilters.includes(newStatus) && formData.householdData.some(calculator.func);
    });

    const newFiltersChecked = {
      ...citizenshipFilters,
      ...calculatedFilters,
    };

    // Type guard to ensure all required keys are present
    const isValidFilterState = (filters: unknown): filters is Record<CitizenLabels, boolean> => {
      if (!filters || typeof filters !== 'object') return false;

      // Check all citizenship options are present
      const hasAllCitizenshipOptions = CITIZENSHIP_OPTIONS.every(
        (option) => option in filters && typeof (filters as Record<string, unknown>)[option] === 'boolean'
      );

      // Check all calculated filters are present
      const hasAllCalculatedFilters = Object.keys(calculatedCitizenshipFilters).every(
        (key) => key in filters && typeof (filters as Record<string, unknown>)[key] === 'boolean'
      );

      return hasAllCitizenshipOptions && hasAllCalculatedFilters;
    };

    if (isValidFilterState(newFiltersChecked)) {
      setFiltersChecked(newFiltersChecked);
    } else {
      console.error('Invalid filter state generated:', newFiltersChecked);
    }
  }, [formData.householdData, setFiltersChecked]);

  const renderDesktopButtons = () => {
    return (
      <div className="citizenship-buttons-container">
        {CITIZENSHIP_OPTIONS.map((option) => {
          const isSelected = selectedCitizenship === option;
          return (
            <Tooltip
              key={option}
              title={
                <Typography variant="body2" className="citizenship-tooltip-text">
                  {citizenshipFilterConfig[option].tooltip}
                </Typography>
              }
              placement="top"
              arrow
              componentsProps={{
                tooltip: {
                  className: 'citizenship-tooltip-card',
                },
              }}
            >
              <Button
                className={`citizenship-option-button ${isSelected ? 'selected' : ''}`}
                onClick={() => handleCitizenshipChange(option)}
                variant={isSelected ? 'contained' : 'outlined'}
                aria-label={intl.formatMessage({
                  id: `citizenshipButton-${option}-aria`,
                  defaultMessage: `Select ${option} citizenship status`,
                })}
              >
                {citizenshipFilterConfig[option].label}
                <InfoOutlinedIcon className="info-icon" fontSize="small" />
              </Button>
            </Tooltip>
          );
        })}
      </div>
    );
  };

  const renderMobileDropdown = () => {
    return (
      <FormControl fullWidth className="citizenship-dropdown">
        <Select
          value={selectedCitizenship}
          onChange={(e) => handleCitizenshipChange(e.target.value as CitizenLabelOptions)}
          variant="outlined"
          aria-label={intl.formatMessage({
            id: 'citizenshipDropdown-aria',
            defaultMessage: 'Select citizenship status',
          })}
        >
          {CITIZENSHIP_OPTIONS.map((option) => (
            <MenuItem key={option} value={option} selected={selectedCitizenship === option}>
              <div className="dropdown-menu-item">
                <Typography variant="body1" className="dropdown-label">
                  {citizenshipFilterConfig[option].label}
                </Typography>
                <Typography variant="body2" color="text.secondary" className="dropdown-description">
                  {citizenshipFilterConfig[option].tooltip}
                </Typography>
              </div>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  };

  return (
    <div className="filter-section-container">
      <h2 className="results-section-header">
        <FormattedMessage id="filterSection.header" defaultMessage="Filter Results by Citizenship" />
      </h2>
      <div className="filter-description">
        <div
          className={collapseDescription && !isDescriptionExpanded ? 'collapsed' : ''}
          aria-live="polite"
        >
          <Typography variant="body2" color="text.secondary" className="help-text">
            <FormattedMessage
              id="filterSection.citizenHelpText"
              defaultMessage="Select a citizenship status to see which benefits that person may qualify for. If your household has members with different statuses, you can check each one separately to see their options. This tool is completely private—we do not store or share any information about your selections."
            />
          </Typography>
        </div>
        {collapseDescription && (
          <Button
            className="show-more-button"
            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
            aria-label={isDescriptionExpanded ? 'Show less' : 'Show more'}
          >
            <FormattedMessage
              id={isDescriptionExpanded ? 'filterSection.showLess' : 'filterSection.showMore'}
              defaultMessage={isDescriptionExpanded ? 'Show less' : 'Show more'}
            />
          </Button>
        )}
      </div>
      <div className="filter-controls">
        {isMobile ? renderMobileDropdown() : renderDesktopButtons()}
      </div>
      <div className="current-selection">
        <Typography variant="body2" color="text.secondary">
          <FormattedMessage id="filterSection.currentSelection" defaultMessage="Current selection:" />{' '}
          <strong>{citizenshipFilterConfig[selectedCitizenship].label}</strong>
        </Typography>
      </div>
    </div>
  );
};

export default Filter;
