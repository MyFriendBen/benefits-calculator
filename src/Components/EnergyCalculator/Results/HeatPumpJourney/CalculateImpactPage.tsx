import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FormattedMessage, useIntl } from 'react-intl';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormHelperText,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Typography,
} from '@mui/material';
import LeftArrowIcon from '@mui/icons-material/KeyboardArrowLeft';
import { Alert, CircularProgress } from '@mui/material';
import { TrackedOutboundLink } from '../../../Common/TrackedOutboundLink';
import { usePageTitle } from '../../../Common/usePageTitle';
import { OTHER_PAGE_TITLES } from '../../../../Assets/pageTitleTags';
import { addAdminToLink } from '../../../../Assets/adminLink';
import { useFeatureFlag } from '../../../Config/configHook';
import {
  type CalculateImpactHouseholdType,
  type CalculateImpactUpgradeChoice,
  type RemFuelType,
  type RemImpactApiResponse,
  type CalculateImpactFormValues,
  isValidRemImpactApiResponse,
} from './remCalculateImpactTypes';
import { fetchRemImpact, RemAddressNotSupportedError } from './fetchRemImpact';
import { buildCalculateImpactPayload } from './remCalculateImpactTypes';
import CalculateImpactResults from './CalculateImpactResults';
import { GooglePlacesAddressInput } from '../../../Common/GooglePlacesAddressInput';
import { Icon } from '../../../Icon/Icon';
import './CalculateImpactPage.css';

const HOUSEHOLD_TYPE_OPTIONS: { value: CalculateImpactHouseholdType; messageId: string; defaultMessage: string }[] = [
  {
    value: 'single_family_detached',
    messageId: 'energyCalculator.calculateImpact.householdType.singleFamilyDetached',
    defaultMessage: 'House',
  },
  {
    value: 'apartment_condo',
    messageId: 'energyCalculator.calculateImpact.householdType.apartmentCondo',
    defaultMessage: 'Apartment',
  },
  {
    value: 'mobile_home',
    messageId: 'energyCalculator.calculateImpact.householdType.mobileHome',
    defaultMessage: 'Mobile home',
  },
  {
    value: 'single_family_attached',
    messageId: 'energyCalculator.calculateImpact.householdType.singleFamilyAttached',
    defaultMessage: 'Townhome',
  },
];

const FUEL_OPTIONS: { value: RemFuelType; messageId: string; defaultMessage: string }[] = [
  {
    value: 'electricity',
    messageId: 'energyCalculator.calculateImpact.fuel.electricity',
    defaultMessage: 'Electricity',
  },
  {
    value: 'natural_gas',
    messageId: 'energyCalculator.calculateImpact.fuel.naturalGas',
    defaultMessage: 'Natural gas',
  },
  { value: 'fuel_oil', messageId: 'energyCalculator.calculateImpact.fuel.fuelOil', defaultMessage: 'Fuel oil' },
  { value: 'propane', messageId: 'energyCalculator.calculateImpact.fuel.propane', defaultMessage: 'Propane' },
];

const UPGRADE_OPTIONS: {
  value: CalculateImpactUpgradeChoice;
  messageId: string;
  defaultMessage: string;
  descriptionId: string;
  descriptionDefault: string;
}[] = [
  {
    value: 'heat_pump',
    messageId: 'energyCalculator.calculateImpact.upgrade.heatPump',
    defaultMessage: 'Heat pump',
    descriptionId: 'energyCalculator.calculateImpact.upgrade.heatPump.description',
    descriptionDefault:
      'A heat pump is an appliance that works in two modes, heating and cooling. By moving heat from the surrounding air (instead of creating it), heat pumps use less energy, making them more efficient than traditional systems.',
  },
  {
    value: 'heat_pump_water_heater',
    messageId: 'energyCalculator.calculateImpact.upgrade.heatPumpWaterHeater',
    defaultMessage: 'Heat pump water heater',
    descriptionId: 'energyCalculator.calculateImpact.upgrade.heatPumpWaterHeater.description',
    descriptionDefault:
      'A heat pump water heater moves heat from the surrounding air to the water tank to heat the water. Because of this, it uses significantly less energy than traditional electric or gas water heaters.',
  },
];

const HOUSEHOLD_TYPE_VALUES: [CalculateImpactHouseholdType, ...CalculateImpactHouseholdType[]] = [
  'single_family_detached',
  'single_family_attached',
  'apartment_condo',
  'mobile_home',
];

const FUEL_TYPE_VALUES: [RemFuelType, ...RemFuelType[]] = ['natural_gas', 'propane', 'electricity', 'fuel_oil'];

// Weatherization-based upgrades are intentionally excluded: per CESN SME guidance,
// their bill impact can't be modeled reliably without knowing the home's current
// condition. The potential impact is surfaced as a note in the results instead.
const UPGRADE_CHOICE_VALUES: [CalculateImpactUpgradeChoice, ...CalculateImpactUpgradeChoice[]] = [
  'heat_pump',
  'heat_pump_water_heater',
];

const calculateImpactSchema = z
  .object({
    householdType: z.enum(HOUSEHOLD_TYPE_VALUES, {
      required_error: 'Please select a household type.',
    }),
    address: z
      .string()
      .min(1, 'Please enter a valid street address.')
      .transform((val) => val.trim())
      .refine((val) => val.length > 0, { message: 'Please enter a valid street address.' }),
    heatingFuel: z.enum(FUEL_TYPE_VALUES, {
      required_error: 'Please select a heating fuel.',
    }),
    waterHeatingFuel: z.preprocess((val) => (val === '' ? undefined : val), z.enum(FUEL_TYPE_VALUES).optional()),
    upgradeChoice: z.enum(UPGRADE_CHOICE_VALUES, {
      required_error: 'Please select one upgrade option.',
    }),
  })
  .superRefine((data, ctx) => {
    if (data.upgradeChoice === 'heat_pump_water_heater' && !data.waterHeatingFuel) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['waterHeatingFuel'],
        message: 'Please select a water heating fuel for this upgrade.',
      });
    }
  });

type CalculateImpactFormData = z.infer<typeof calculateImpactSchema>;

type SubmitState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; result: RemImpactApiResponse; formValues: CalculateImpactFormValues }
  | { status: 'error'; message: string }
  | { status: 'address_not_supported' };

export default function CalculateImpactPage() {
  const intl = useIntl();
  const navigate = useNavigate();
  const { whiteLabel, uuid } = useParams();
  const [searchParams] = useSearchParams();
  const isAdminView = useMemo(() => searchParams.get('admin') === 'true', [searchParams]);
  const showCalculateImpact = useFeatureFlag('cesn_heat_pump_journey');
  const [submitState, setSubmitState] = useState<SubmitState>({ status: 'idle' });

  const backLink = addAdminToLink(`/${whiteLabel}/${uuid}/results/energy-rebates/hvac`, isAdminView);

  const {
    control,
    handleSubmit,
    resetField,
    formState: { errors },
  } = useForm<CalculateImpactFormData>({
    resolver: zodResolver(calculateImpactSchema),
    defaultValues: {
      householdType: undefined,
      address: '',
      heatingFuel: undefined,
      waterHeatingFuel: undefined,
      upgradeChoice: undefined,
    },
  });

  usePageTitle(OTHER_PAGE_TITLES.energyCalculatorCalculateImpact);

  const watchedWaterHeatingFuel = useWatch({ control, name: 'waterHeatingFuel' });
  const watchedUpgradeChoice = useWatch({ control, name: 'upgradeChoice' });
  const isHpwhEnabled = !!watchedWaterHeatingFuel;

  useEffect(() => {
    if (!watchedWaterHeatingFuel && watchedUpgradeChoice === 'heat_pump_water_heater') {
      resetField('upgradeChoice');
    }
  }, [watchedWaterHeatingFuel, watchedUpgradeChoice, resetField]);

  if (!showCalculateImpact) return null;

  const onSubmit = (data: CalculateImpactFormData) => {
    if (!whiteLabel) return;
    if (submitState.status === 'loading') return;
    const payload = buildCalculateImpactPayload({
      upgradeChoice: data.upgradeChoice,
      address: data.address,
      heatingFuel: data.heatingFuel,
      waterHeatingFuel: data.waterHeatingFuel ?? '',
      householdType: data.householdType,
    });
    setSubmitState({ status: 'loading' });
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
    fetchRemImpact(whiteLabel, payload.remAddressQuery)
      .then((result) => {
        if (!isValidRemImpactApiResponse(result)) {
          setSubmitState({ status: 'error', message: 'Unexpected response from Rewiring America.' });
          return;
        }
        setSubmitState({ status: 'success', result, formValues: data });
      })
      .catch((err: Error) => {
        if (err instanceof RemAddressNotSupportedError) {
          setSubmitState({ status: 'address_not_supported' });
        } else {
          setSubmitState({ status: 'error', message: err.message });
        }
      });
  };

  if (submitState.status === 'success') {
    return (
      <main className="benefits-form calculate-impact-page">
        <div className="calculate-impact-back-row results-back-save-btn-container">
          <button
            data-testid="back-to-results-button"
            className="results-back-save-buttons"
            onClick={() => navigate(backLink)}
            aria-label={intl.formatMessage({
              id: 'energyCalculator.calculateImpact.backToResults',
              defaultMessage: 'BACK TO RESULTS',
            })}
          >
            <div className="btn-icon-text-container padding-right">
              <LeftArrowIcon />
              <FormattedMessage id="energyCalculator.calculateImpact.backToResults" defaultMessage="BACK TO RESULTS" />
            </div>
          </button>
        </div>

        <header className="calculate-impact-header">
          <Icon name="circle-dollar-sign" aria-hidden="true" className="calculate-impact-icon" />
          <div className="calculate-impact-header-text">
            <span className="calculate-impact-title-text">
              <FormattedMessage
                id="energyCalculator.calculateImpact.titleLabel"
                defaultMessage="Bill Impact Calculator"
              />
            </span>
            <hr className="calculate-impact-separator" />
            <h1 className="calculate-impact-subtitle">
              <FormattedMessage id="energyCalculator.calculateImpact.subtitle" defaultMessage="Estimated Savings" />
            </h1>
          </div>
        </header>

        <Typography variant="body1" className="calculate-impact-intro energy-calculator-body-text">
          <FormattedMessage
            id="energyCalculator.calculateImpact.intro"
            defaultMessage="This data modeling is by {rewiringAmerica}, an independent nonprofit that supports customers accessing electrification rebates and home energy upgrades. It provides a range of the impact of your selected upgrade on your energy bill, and emissions reductions estimates for your project."
            values={{
              rewiringAmerica: (
                <TrackedOutboundLink
                  href="https://www.rewiringamerica.org"
                  className="link-color"
                  action="calculate_impact_rewiring_america"
                  label="Rewiring America"
                  category="energy_rebate"
                >
                  <FormattedMessage id="co.energy.rewiring_america_link" defaultMessage="Rewiring America" />
                </TrackedOutboundLink>
              ),
            }}
          />
        </Typography>

        <CalculateImpactResults
          result={submitState.result}
          formValues={submitState.formValues}
          onEdit={() => setSubmitState({ status: 'idle' })}
        />
      </main>
    );
  }

  return (
    <main className="benefits-form calculate-impact-page">
      <div className="calculate-impact-back-row results-back-save-btn-container">
        <button
          data-testid="back-to-results-button"
          className="results-back-save-buttons"
          onClick={() => navigate(backLink)}
          aria-label={intl.formatMessage({
            id: 'energyCalculator.calculateImpact.backToResults',
            defaultMessage: 'BACK TO RESULTS',
          })}
        >
          <div className="btn-icon-text-container padding-right">
            <LeftArrowIcon />
            <FormattedMessage id="energyCalculator.calculateImpact.backToResults" defaultMessage="BACK TO RESULTS" />
          </div>
        </button>
      </div>

      <header className="calculate-impact-header">
        <Icon name="circle-dollar-sign" aria-hidden="true" className="calculate-impact-icon" />
        <div className="calculate-impact-header-text">
          <span className="calculate-impact-title-text">
            <FormattedMessage
              id="energyCalculator.calculateImpact.titleLabel"
              defaultMessage="Bill Impact Calculator"
            />
          </span>
          <hr className="calculate-impact-separator" />
          <h1 className="calculate-impact-subtitle">
            <FormattedMessage id="energyCalculator.calculateImpact.subtitle" defaultMessage="Estimated Savings" />
          </h1>
        </div>
      </header>

      <Typography variant="body1" className="calculate-impact-intro energy-calculator-body-text">
        <FormattedMessage
          id="energyCalculator.calculateImpact.intro"
          defaultMessage="This data modeling is by {rewiringAmerica}, an independent nonprofit that supports customers accessing electrification rebates and home energy upgrades. It provides a range of the impact of your selected upgrade on your energy bill, and emissions reductions estimates for your project."
          values={{
            rewiringAmerica: (
              <TrackedOutboundLink
                href="https://www.rewiringamerica.org"
                className="link-color"
                action="calculate_impact_rewiring_america"
                label="Rewiring America"
                category="energy_rebate"
              >
                <FormattedMessage id="co.energy.rewiring_america_link" defaultMessage="Rewiring America" />
              </TrackedOutboundLink>
            ),
          }}
        />
      </Typography>

      {submitState.status === 'loading' && (
        <div className="calculate-impact-loading">
          <CircularProgress
            size={28}
            aria-label={intl.formatMessage({ id: 'general.loading', defaultMessage: 'Loading' })}
          />
        </div>
      )}
      {submitState.status === 'error' && (
        <Alert severity="error" className="calculate-impact-error">
          <FormattedMessage
            id="energyCalculator.calculateImpact.error"
            defaultMessage="Something went wrong calculating your impact. Please try selecting a different heating fuel type."
          />
        </Alert>
      )}
      {submitState.status === 'address_not_supported' && (
        <Alert severity="error" className="calculate-impact-error">
          <FormattedMessage
            id="energyCalculator.calculateImpact.error.addressNotSupported"
            defaultMessage="We're unable to calculate the impact for this address at this time. Please try entering a different address."
          />
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <section className="calculate-impact-card" aria-labelledby="calculate-impact-household-heading">
          <h2 id="calculate-impact-household-heading" className="calculate-impact-section-title">
            <FormattedMessage
              id="energyCalculator.calculateImpact.section.household"
              defaultMessage="Your household info"
            />
          </h2>
          <p className="calculate-impact-section-description">
            <FormattedMessage
              id="energyCalculator.calculateImpact.section.household.description"
              defaultMessage="Enter your household information to see potential energy bill changes and emissions reductions by upgrade type. (Your information will not be saved.)"
            />
          </p>

          <div className="calculate-impact-fields-grid">
            <div className="calculate-impact-field">
              <label htmlFor="calculate-impact-household-type" className="calculate-impact-field-label">
                <FormattedMessage
                  id="energyCalculator.calculateImpact.field.householdType"
                  defaultMessage="Household Type"
                />
              </label>
              <FormControl fullWidth error={!!errors.householdType}>
                <Controller
                  name="householdType"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      id="calculate-impact-household-type"
                      value={field.value ?? ''}
                      displayEmpty
                      inputProps={{
                        'aria-label': intl.formatMessage({
                          id: 'energyCalculator.calculateImpact.field.householdType',
                          defaultMessage: 'Household Type',
                        }),
                      }}
                      renderValue={(value) => {
                        if (!value) {
                          return (
                            <span className="calculate-impact-select-placeholder">
                              {intl.formatMessage({
                                id: 'energyCalculator.calculateImpact.field.householdTypePlaceholder',
                                defaultMessage: 'Select household type...',
                              })}
                            </span>
                          );
                        }
                        const opt = HOUSEHOLD_TYPE_OPTIONS.find((o) => o.value === value);
                        return opt ? intl.formatMessage({ id: opt.messageId, defaultMessage: opt.defaultMessage }) : '';
                      }}
                    >
                      {HOUSEHOLD_TYPE_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          <FormattedMessage id={opt.messageId} defaultMessage={opt.defaultMessage} />
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
                {errors.householdType && <FormHelperText>{errors.householdType.message}</FormHelperText>}
              </FormControl>
            </div>

            <div className="calculate-impact-field">
              <label htmlFor="calculate-impact-address" className="calculate-impact-field-label">
                <FormattedMessage id="energyCalculator.calculateImpact.field.address" defaultMessage="Address" />
              </label>
              <p id="calculate-impact-address-helper" className="calculate-impact-field-helper">
                <FormattedMessage
                  id="energyCalculator.calculateImpact.field.address.helper"
                  defaultMessage="Enter your street address, city, state, and ZIP code."
                />
              </p>
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <GooglePlacesAddressInput
                    fullWidth
                    id="calculate-impact-address"
                    value={field.value}
                    onChange={field.onChange}
                    error={!!errors.address}
                    helperText={errors.address?.message}
                    placeholder={intl.formatMessage({
                      id: 'energyCalculator.calculateImpact.field.addressPlaceholder',
                      defaultMessage: '1234 Main St, Denver, CO 80014',
                    })}
                    inputProps={{
                      autoComplete: 'street-address',
                      'aria-describedby': 'calculate-impact-address-helper',
                    }}
                  />
                )}
              />
            </div>

            <div className="calculate-impact-field">
              <label htmlFor="calculate-impact-heating-fuel" className="calculate-impact-field-label">
                <FormattedMessage
                  id="energyCalculator.calculateImpact.field.heatingFuel"
                  defaultMessage="Heating Fuel"
                />
              </label>
              <FormControl fullWidth error={!!errors.heatingFuel}>
                <Controller
                  name="heatingFuel"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      id="calculate-impact-heating-fuel"
                      value={field.value ?? ''}
                      displayEmpty
                      inputProps={{
                        'aria-label': intl.formatMessage({
                          id: 'energyCalculator.calculateImpact.field.heatingFuel',
                          defaultMessage: 'Heating Fuel',
                        }),
                      }}
                      renderValue={(value) => {
                        if (!value) {
                          return (
                            <span className="calculate-impact-select-placeholder">
                              {intl.formatMessage({
                                id: 'energyCalculator.calculateImpact.field.heatingFuelPlaceholder',
                                defaultMessage: 'Select heating fuel...',
                              })}
                            </span>
                          );
                        }
                        const opt = FUEL_OPTIONS.find((o) => o.value === value);
                        return opt ? intl.formatMessage({ id: opt.messageId, defaultMessage: opt.defaultMessage }) : '';
                      }}
                    >
                      {FUEL_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          <FormattedMessage id={opt.messageId} defaultMessage={opt.defaultMessage} />
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
                {errors.heatingFuel && <FormHelperText>{errors.heatingFuel.message}</FormHelperText>}
              </FormControl>
            </div>

            <div className="calculate-impact-field">
              <label htmlFor="calculate-impact-water-heating-fuel" className="calculate-impact-field-label">
                <FormattedMessage
                  id="energyCalculator.calculateImpact.field.waterHeatingFuel"
                  defaultMessage="Water Heating Type (optional)"
                />
              </label>
              <p id="calculate-impact-water-heating-helper" className="calculate-impact-field-helper">
                <FormattedMessage
                  id="energyCalculator.calculateImpact.field.waterHeatingFuel.helper"
                  defaultMessage="Select your water heating fuel to see the impact of a water heater upgrade."
                />
              </p>
              <FormControl fullWidth error={!!errors.waterHeatingFuel}>
                <Controller
                  name="waterHeatingFuel"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      id="calculate-impact-water-heating-fuel"
                      value={field.value ?? ''}
                      displayEmpty
                      inputProps={{
                        'aria-label': intl.formatMessage({
                          id: 'energyCalculator.calculateImpact.field.waterHeatingFuel',
                          defaultMessage: 'Water Heating Type',
                        }),
                        'aria-describedby': 'calculate-impact-water-heating-helper',
                      }}
                      renderValue={(value) => {
                        if (!value) {
                          return (
                            <span className="calculate-impact-select-placeholder">
                              {intl.formatMessage({
                                id: 'energyCalculator.calculateImpact.field.waterHeatingFuelPlaceholder',
                                defaultMessage: 'Select water heating fuel...',
                              })}
                            </span>
                          );
                        }
                        const opt = FUEL_OPTIONS.find((o) => o.value === value);
                        return opt ? intl.formatMessage({ id: opt.messageId, defaultMessage: opt.defaultMessage }) : '';
                      }}
                    >
                      <MenuItem value="">
                        <FormattedMessage
                          id="energyCalculator.calculateImpact.field.waterHeatingFuelNone"
                          defaultMessage="No selection"
                        />
                      </MenuItem>
                      {FUEL_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          <FormattedMessage id={opt.messageId} defaultMessage={opt.defaultMessage} />
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
                {errors.waterHeatingFuel && <FormHelperText>{errors.waterHeatingFuel.message}</FormHelperText>}
              </FormControl>
            </div>
          </div>

          <h2 id="calculate-impact-upgrade-heading" className="calculate-impact-section-title">
            <FormattedMessage id="energyCalculator.calculateImpact.section.upgrade" defaultMessage="Select upgrade" />
          </h2>
          <p className="calculate-impact-section-description">
            <FormattedMessage
              id="energyCalculator.calculateImpact.section.upgrade.description"
              defaultMessage="Select an upgrade option to learn more about how it works within a household."
            />
          </p>

          <FormControl
            component="fieldset"
            fullWidth
            error={!!errors.upgradeChoice}
            aria-labelledby="calculate-impact-upgrade-heading"
          >
            <Controller
              name="upgradeChoice"
              control={control}
              render={({ field }) => (
                <RadioGroup {...field} value={field.value ?? ''}>
                  {UPGRADE_OPTIONS.map((opt) => {
                    const isSelected = field.value === opt.value;
                    const isDisabled = opt.value === 'heat_pump_water_heater' && !isHpwhEnabled;
                    return (
                      <div
                        key={opt.value}
                        className="calculate-impact-radio-option"
                        data-selected={isSelected ? 'true' : 'false'}
                        data-disabled={isDisabled ? 'true' : 'false'}
                      >
                        <FormControlLabel
                          value={opt.value}
                          disabled={isDisabled}
                          control={<Radio />}
                          label={
                            <span className="calculate-impact-radio-label">
                              <FormattedMessage id={opt.messageId} defaultMessage={opt.defaultMessage} />
                            </span>
                          }
                        />
                        <p className="calculate-impact-radio-description">
                          <FormattedMessage id={opt.descriptionId} defaultMessage={opt.descriptionDefault} />
                        </p>
                      </div>
                    );
                  })}
                </RadioGroup>
              )}
            />
            {errors.upgradeChoice && (
              <FormHelperText>
                {intl.formatMessage({
                  id: 'energyCalculator.calculateImpact.upgrade.selectOne',
                  defaultMessage: 'Please select one upgrade option.',
                })}
              </FormHelperText>
            )}
          </FormControl>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="medium"
            className="calculate-impact-submit"
            disabled={submitState.status === 'loading'}
            aria-busy={submitState.status === 'loading'}
          >
            <FormattedMessage id="energyCalculator.calculateImpact.submit" defaultMessage="Calculate impact" />
          </Button>
        </section>
      </Box>
    </main>
  );
}
