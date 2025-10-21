import { ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useResultsContext } from '../Results';
import { Button, Popover, Checkbox, Typography } from '@mui/material';
import {
  CalculatedCitizenLabel,
  calculatedCitizenshipFilters,
  CitizenLabelOptions,
  filterNestedMap,
} from '../../../Assets/citizenshipFilterFormControlLabels';
import citizenshipFilterFormControlLabels from '../../../Assets/citizenshipFilterFormControlLabels';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import FormControlLabel from '@mui/material/FormControlLabel';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import './Filter.css';
import '../../QuestionComponentContainer/QuestionComponentContainer.css';
import { Context } from '../../Wrapper/Wrapper';

export const Filter = () => {
  const [citizenshipFilterIsOpen, setCitizenshipFilterIsOpen] = useState(false);
  const [citizenshipPopoverAnchor, setCitizenshipPopoverAnchor] = useState<null | Element>(null);
  const { filtersChecked, setFiltersChecked } = useResultsContext();
  const { formData } = useContext(Context);
  const [citButtonClass, setCitButtonClass] = useState('citizenship-button');
  const intl = useIntl();
  const [choosenFilters, setChoosenFilters] = useState(filtersChecked);
  const filterRef = useRef<HTMLDivElement>(null);
  const [filterHeight, setFilterHeight] = useState<number | undefined>(0);

  useEffect(() => {
    if (citizenshipFilterIsOpen && citizenshipPopoverAnchor) {
      setCitButtonClass(citButtonClass + ' flat-white-border-bottom');
      setTimeout(() => {
        const buttonRect = citizenshipPopoverAnchor?.getBoundingClientRect();
        setFilterHeight(filterRef.current?.offsetHeight);

        if (filterHeight && buttonRect) {
          const spaceBelowButton = window.innerHeight - buttonRect.bottom;
          if (spaceBelowButton < filterHeight) {
            const scrollDistance = filterHeight - spaceBelowButton + 55;
            if (scrollDistance > 10) {
              window.scrollTo({
                top: scrollDistance,
                behavior: 'smooth',
              });
            }
          }
        }
      }, 300);
    }
  }, [citizenshipFilterIsOpen, citizenshipPopoverAnchor, filterHeight]);

  const handleCitizenshipBtnClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    setCitizenshipFilterIsOpen(!citizenshipFilterIsOpen);
    setCitizenshipPopoverAnchor(event.currentTarget);
  };

  const handleFilterSelect = (selectedFilterStr: CitizenLabelOptions) => {
    const newFiltersChecked = { ...choosenFilters };

    const newSelected = !newFiltersChecked[selectedFilterStr];

    newFiltersChecked[selectedFilterStr] = newSelected;

    // select or deselect all subfilters when main filter is selected
    const subFilters = filterNestedMap.get(selectedFilterStr);
    if (subFilters !== undefined) {
      for (const subFilter of subFilters) {
        newFiltersChecked[subFilter] = newSelected;
      }
    }

    // if all subfilters are unchecked, uncheck the main filter
    filterNestedMap.forEach((subFilters, mainFilter) => {
      if (!subFilters.includes(selectedFilterStr)) {
        return;
      }

      const allSubFiltersDeselected = subFilters.every((subFilter) => !newFiltersChecked[subFilter]);

      if (allSubFiltersDeselected) {
        newFiltersChecked[mainFilter] = false;
      }
    });

    // if all filters are unchecked set citizenship to false
    let isCitizen = true;
    for (const filter in citizenshipFilterFormControlLabels) {
      if (newFiltersChecked[filter as CitizenLabelOptions]) {
        isCitizen = false;

        break;
      }
    }
    newFiltersChecked.citizen = isCitizen;

    // calculate hidden filters if the user is not a citizen
    Object.entries(calculatedCitizenshipFilters).map(([filterName, calculator]) => {
      if (!calculator.linkedFilters.some((linkedFilter) => newFiltersChecked[linkedFilter])) {
        newFiltersChecked[filterName as CalculatedCitizenLabel] = false;
        return;
      }

      newFiltersChecked[filterName as CalculatedCitizenLabel] = formData.householdData.some(calculator.func);
    });

    setChoosenFilters(newFiltersChecked);
  };

  const renderCitizenshipFilters = () => {
    const filters: ReactNode[] = [];
    filterNestedMap.forEach((subFilters, mainFilter) => {
      const mainFilterIsChecked = choosenFilters[mainFilter];

      filters.push(
        <FormControlLabel
          key={mainFilter}
          label={citizenshipFilterFormControlLabels[mainFilter]}
          control={<Checkbox checked={mainFilterIsChecked} onChange={() => handleFilterSelect(mainFilter)} />}
          className="vertical-align"
        />,
      );

      if (!mainFilterIsChecked) {
        return;
      }

      for (const subFilter of subFilters) {
        filters.push(
          <FormControlLabel
            key={subFilter}
            label={citizenshipFilterFormControlLabels[subFilter]}
            control={<Checkbox checked={choosenFilters[subFilter]} onChange={() => handleFilterSelect(subFilter)} />}
            className="subcategory-indentation vertical-align"
            sx={{ padding: '.5rem 0' }}
          />,
        );
      }
    });

    return <section className="filters-container">{filters}</section>;
  };

  const handleFilterClose = () => {
    setFiltersChecked(choosenFilters);
    setCitizenshipPopoverAnchor(null);
    setCitizenshipFilterIsOpen(false);
    setCitButtonClass('citizenship-button');
    setFilterHeight(0);
  };

  const citizenshipFiltersModalALProps = {
    id: 'filter.citFilterModalAL',
    defaultMessage: 'citizenship filters modal',
  };
  const closeCitFiltersALProps = {
    id: 'filter.closeCitFilterAL',
    defaultMessage: 'close citizenship filters modal',
  };
  const citFiltersALProps = {
    id: 'filter.citFiltersAL',
    defaultMessage: 'citizenship filters',
  };

  const displayCitizenshipPopover = () => {
    return (
      <section>
        <Popover
          id="citizenshipPopover"
          open={Boolean(citizenshipPopoverAnchor)}
          onClose={handleFilterClose}
          anchorEl={citizenshipPopoverAnchor}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{ vertical: 2, horizontal: 0 }}
          aria-label={intl.formatMessage(citizenshipFiltersModalALProps)}
        >
          <div className="filters-close-button">
            <IconButton
              size="small"
              aria-label={intl.formatMessage(closeCitFiltersALProps)}
              color="inherit"
              onClick={handleFilterClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </div>
          <div className="filter-ref-container" ref={filterRef}>
            {renderCitizenshipFilters()}
          </div>
        </Popover>
      </section>
    );
  };

  const displayCitizenshipButton = () => {
    return (
      <section>
        <Button
          className={citButtonClass}
          variant="contained"
          onClick={(event) => handleCitizenshipBtnClick(event)}
          aria-label={intl.formatMessage(citFiltersALProps)}
        >
          <FormattedMessage id="filterSection.citizenship" defaultMessage="CITIZENSHIP" />
          {citizenshipFilterIsOpen ? (
            <KeyboardArrowDownIcon className="arrow-margin" />
          ) : (
            <KeyboardArrowRightIcon className="arrow-margin" />
          )}
        </Button>
        {displayCitizenshipPopover()}
      </section>
    );
  };

  const resetFilters = () => {
    setFiltersChecked({
      citizen: true,
      non_citizen: false,
      green_card: false,
      refugee: false,
      gc_5plus: false,
      gc_5less: false,
      gc_18plus_no5: false,
      gc_under18_no5: false,
      otherWithWorkPermission: false,
      otherHealthCareUnder19: false,
      otherHealthCarePregnant: false,
      notPregnantOrUnder19ForOmniSalud: false,
      notPregnantOrUnder19ForEmergencyMedicaid: false,
      notPregnantForMassHealthLimited: false,
      notPregnantOrChildForMassHealthLimited: false,
      otherHealthCareUnder21: false,
    });

    setCitButtonClass('citizenship-button');
    setFilterHeight(0);
  };

  const displayResetFiltersButton = () => {
    return (
      <Button className="reset-button" variant="contained" onClick={resetFilters}>
        <FormattedMessage id="filterSection.reset" defaultMessage="RESET FILTERS" />
      </Button>
    );
  };

  return (
    <div className="filter-section-container">
      <h2 className="results-section-header">
        <FormattedMessage id="filterSection.header" defaultMessage="Filter Results by Citizenship" />
      </h2>
      <div className="filter-description">
        <Typography variant="body2" color="text.secondary" className="help-text">
          <FormattedMessage
            id="filterSection.citizenHelpText"
            defaultMessage="Household members may have mixed immigration status. This means that some people in your home may qualify for benefits even if others do not. Use this filter to see how a person's status affects their ability to qualify. If you sign up for a public benefit or file a tax return, your family’s information may be shared with immigration officials."
          />
        </Typography>
      </div>
      <div className="flex-direction-row">
        {displayCitizenshipButton()}
        {displayResetFiltersButton()}
      </div>
    </div>
  );
};

export default Filter;
