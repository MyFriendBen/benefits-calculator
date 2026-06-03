import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
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
  TextField,
  Typography,
} from '@mui/material';
import LeftArrowIcon from '@mui/icons-material/KeyboardArrowLeft';
import { Alert, CircularProgress } from '@mui/material';
import { TrackedOutboundLink } from '../../../Common/TrackedOutboundLink';
import { usePageTitle } from '../../../Common/usePageTitle';
import { OTHER_PAGE_TITLES } from '../../../../Assets/pageTitleTags';
import { useFeatureFlag } from '../../../Config/configHook';
import {
  type CalculateImpactHouseholdType,
  type CalculateImpactUpgradeChoice,
  type RemFuelType,
  type RemImpactApiResponse,
  type CalculateImpactFormValues,
} from './remCalculateImpactTypes';
import { fetchRemImpact } from './fetchRemImpact';
import { buildCalculateImpactPayload } from './remCalculateImpactTypes';
import CalculateImpactResults from './CalculateImpactResults';
import { ReactComponent as Coin } from '../../Icons/Coin.svg';
import './CalculateImpactPage.css';

function addAdminToLink(link: string, isAdmin: boolean) {
  if (isAdmin) {
    return `${link}?admin=true`;
  }
  return link;
}

const HOUSEHOLD_TYPE_OPTIONS: { value: CalculateImpactHouseholdType; messageId: string; defaultMessage: string }[] =
  [
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
  { value: 'electricity', messageId: 'energyCalculator.calculateImpact.fuel.electricity', defaultMessage: 'Electricity' },
  { value: 'natural_gas', messageId: 'energyCalculator.calculateImpact.fuel.naturalGas', defaultMessage: 'Natural gas' },
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
      'A heat pump is a single appliance with two modes, heating and cooling. By transferring heat (instead of creating it), heat pumps use less energy, making them more efficient than traditional systems.',
  },
  {
    value: 'weatherization',
    messageId: 'energyCalculator.calculateImpact.upgrade.weatherization',
    defaultMessage: 'Weatherization',
    descriptionId: 'energyCalculator.calculateImpact.upgrade.weatherization.description',
    descriptionDefault:
      'Weatherization includes insulation, air sealing, and other improvements that reduce energy waste and make your home more comfortable year-round.',
  },
  {
    value: 'heat_pump_weatherization',
    messageId: 'energyCalculator.calculateImpact.upgrade.heatPumpWeatherization',
    defaultMessage: 'Heat pump + weatherization',
    descriptionId: 'energyCalculator.calculateImpact.upgrade.heatPumpWeatherization.description',
    descriptionDefault:
      'Combining a heat pump with weatherization maximizes energy savings by pairing efficient heating and cooling with a well-sealed, insulated home.',
  },
  {
    value: 'heat_pump_water_heater',
    messageId: 'energyCalculator.calculateImpact.upgrade.heatPumpWaterHeater',
    defaultMessage: 'Heat pump water heater',
    descriptionId: 'energyCalculator.calculateImpact.upgrade.heatPumpWaterHeater.description',
    descriptionDefault:
      'A heat pump water heater uses electricity to move heat from the surrounding air to heat water, using significantly less energy than traditional electric or gas water heaters.',
  },
];

const HOUSEHOLD_TYPE_VALUES: [CalculateImpactHouseholdType, ...CalculateImpactHouseholdType[]] = [
  'single_family_detached',
  'single_family_attached',
  'apartment_condo',
  'mobile_home',
];

const FUEL_TYPE_VALUES: [RemFuelType, ...RemFuelType[]] = ['natural_gas', 'propane', 'electricity', 'fuel_oil'];

const UPGRADE_CHOICE_VALUES: [CalculateImpactUpgradeChoice, ...CalculateImpactUpgradeChoice[]] = [
  'heat_pump',
  'weatherization',
  'heat_pump_weatherization',
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
    waterHeatingFuel: z.enum(FUEL_TYPE_VALUES).optional(),
    upgradeChoice: z.enum(UPGRADE_CHOICE_VALUES, {
      required_error: 'Please select an upgrade option.',
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
  | { status: 'error'; message: string };

export default function CalculateImpactPage() {
  const intl = useIntl();
  const navigate = useNavigate();
  const { whiteLabel, uuid } = useParams();
  const [searchParams] = useSearchParams();
  const isAdminView = useMemo(() => searchParams.get('admin') === 'true', [searchParams]);
  const showCalculateImpact = useFeatureFlag('cesn_heat_pump_journey');
  const [submitState, setSubmitState] = useState<SubmitState>({ status: 'idle' });

  const backLink = addAdminToLink(
    `/${whiteLabel}/${uuid}/results/energy-rebates/hvac`,
    isAdminView,
  );

  const {
    control,
    handleSubmit,
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
    fetchRemImpact(whiteLabel, payload.remAddressQuery)
      .then((result) =>
        setSubmitState({ status: 'success', result, formValues: data }),
      )
      .catch((err: Error) =>
        setSubmitState({ status: 'error', message: err.message }),
      );
  };

  if (submitState.status === 'success') {
    return (
      <main className="benefits-form calculate-impact-page">
        <div className="calculate-impact-back-row results-back-save-btn-container">
          <button
            data-testid="back-to-results-button"
            className="results-back-save-buttons"
            onClick={() => navigate(backLink)}
            aria-label={intl.formatMessage({ id: 'backAndSaveBtns.backBtnAL', defaultMessage: 'back' })}
          >
            <div className="btn-icon-text-container padding-right">
              <LeftArrowIcon />
              <FormattedMessage
                id="energyCalculator.calculateImpact.backToResults"
                defaultMessage="BACK TO RESULTS"
              />
            </div>
          </button>
        </div>

        <header className="calculate-impact-header">
          <Coin aria-hidden="true" className="calculate-impact-icon" />
          <div className="calculate-impact-header-text">
            <span className="calculate-impact-title-text">
              <FormattedMessage
                id="energyCalculator.calculateImpact.titleLabel"
                defaultMessage="Bill Impact Calculator"
              />
            </span>
            <hr className="calculate-impact-separator" />
            <h1 className="calculate-impact-subtitle">
              <FormattedMessage
                id="energyCalculator.calculateImpact.subtitle"
                defaultMessage="Estimated Savings"
              />
            </h1>
          </div>
        </header>

        <Typography variant="body1" className="calculate-impact-intro energy-calculator-body-text">
          <FormattedMessage
            id="energyCalculator.calculateImpact.intro"
            defaultMessage="This data modeling is by {rewiringAmerica}, an independent nonprofit that supports customers accessing electrification rebates and home energy upgrades provides a range of the impact of your selected upgrade on your energy bill, and emissions reductions estimates for your project."
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
          aria-label={intl.formatMessage({ id: 'backAndSaveBtns.backBtnAL', defaultMessage: 'back' })}
        >
          <div className="btn-icon-text-container padding-right">
            <LeftArrowIcon />
            <FormattedMessage
              id="energyCalculator.calculateImpact.backToResults"
              defaultMessage="BACK TO RESULTS"
            />
          </div>
        </button>
      </div>

      <header className="calculate-impact-header">
        <Coin aria-hidden="true" className="calculate-impact-icon" />
        <div className="calculate-impact-header-text">
          <span className="calculate-impact-title-text">
            <FormattedMessage
              id="energyCalculator.calculateImpact.titleLabel"
              defaultMessage="Bill Impact Calculator"
            />
          </span>
          <hr className="calculate-impact-separator" />
          <h1 className="calculate-impact-subtitle">
            <FormattedMessage
              id="energyCalculator.calculateImpact.subtitle"
              defaultMessage="Estimated Savings"
            />
          </h1>
        </div>
      </header>

      <Typography variant="body1" className="calculate-impact-intro energy-calculator-body-text">
        <FormattedMessage
          id="energyCalculator.calculateImpact.intro"
          defaultMessage="This data modeling is by {rewiringAmerica}, an independent nonprofit that supports customers accessing electrification rebates and home energy upgrades provides a range of the impact of your selected upgrade on your energy bill, and emissions reductions estimates for your project."
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
          <CircularProgress size={28} aria-label={intl.formatMessage({ id: 'general.loading', defaultMessage: 'Loading' })} />
        </div>
      )}
      {submitState.status === 'error' && (
        <Alert severity="error" className="calculate-impact-error">
          <FormattedMessage
            id="energyCalculator.calculateImpact.error"
            defaultMessage="Something went wrong calculating your impact. Please try again."
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
              defaultMessage="Enter your household information to see potential energy bill changes and emissions reductions by upgrade type."
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
                {errors.householdType && (
                  <FormHelperText>{errors.householdType.message}</FormHelperText>
                )}
              </FormControl>
            </div>

            <div className="calculate-impact-field">
              <label htmlFor="calculate-impact-address" className="calculate-impact-field-label">
                <FormattedMessage
                  id="energyCalculator.calculateImpact.field.address"
                  defaultMessage="Address"
                />
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
                  <TextField
                    {...field}
                    fullWidth
                    id="calculate-impact-address"
                    error={!!errors.address}
                    inputProps={{
                      autoComplete: 'street-address',
                      'aria-describedby': 'calculate-impact-address-helper',
                    }}
                    helperText={errors.address?.message}
                    placeholder={intl.formatMessage({
                      id: 'energyCalculator.calculateImpact.field.addressPlaceholder',
                      defaultMessage: '1234 Main St, Denver, CO 80014',
                    })}
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
                {errors.heatingFuel && (
                  <FormHelperText>{errors.heatingFuel.message}</FormHelperText>
                )}
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
                {errors.waterHeatingFuel && (
                  <FormHelperText>{errors.waterHeatingFuel.message}</FormHelperText>
                )}
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

          <FormControl component="fieldset" fullWidth error={!!errors.upgradeChoice} aria-labelledby="calculate-impact-upgrade-heading">
            <Controller
              name="upgradeChoice"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  {...field}
                  value={field.value ?? ''}
                >
                  {UPGRADE_OPTIONS.map((opt) => {
                    const isSelected = field.value === opt.value;
                    const isAvailable = opt.value === 'heat_pump_water_heater';
                    return (
                      <div
                        key={opt.value}
                        className="calculate-impact-radio-option"
                        data-selected={isSelected ? 'true' : 'false'}
                        data-disabled={!isAvailable ? 'true' : 'false'}
                      >
                        <FormControlLabel
                          value={opt.value}
                          disabled={!isAvailable}
                          control={<Radio />}
                          label={
                            <span className="calculate-impact-radio-label">
                              <FormattedMessage id={opt.messageId} defaultMessage={opt.defaultMessage} />
                              {!isAvailable && (
                                <span className="calculate-impact-coming-soon">
                                  <FormattedMessage
                                    id="energyCalculator.calculateImpact.comingSoon"
                                    defaultMessage="Coming soon"
                                  />
                                </span>
                              )}
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
              <FormHelperText>{errors.upgradeChoice.message}</FormHelperText>
            )}
          </FormControl>

          <Button type="submit" variant="contained" color="primary" size="medium" className="calculate-impact-submit" disabled={submitState.status === 'loading'} aria-busy={submitState.status === 'loading'}>
            <FormattedMessage id="energyCalculator.calculateImpact.submit" defaultMessage="Calculate impact" />
          </Button>
        </section>
      </Box>
    </main>
  );
}
