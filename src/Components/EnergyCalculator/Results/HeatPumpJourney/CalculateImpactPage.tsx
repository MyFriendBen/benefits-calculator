import { FormEvent, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  type SelectChangeEvent,
  TextField,
  Typography,
} from '@mui/material';
import BackAndSaveButtons from '../../../Results/BackAndSaveButtons/BackAndSaveButtons';
import { TrackedOutboundLink } from '../../../Common/TrackedOutboundLink';
import { usePageTitle } from '../../../Common/usePageTitle';
import { OTHER_PAGE_TITLES } from '../../../../Assets/pageTitleTags';
import {
  type CalculateImpactHouseholdType,
  type CalculateImpactUpgradeChoice,
  type RemFuelType,
  buildCalculateImpactPayload,
} from './remCalculateImpactTypes';
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
      defaultMessage: 'Single-family detached home',
    },
    {
      value: 'single_family_attached',
      messageId: 'energyCalculator.calculateImpact.householdType.singleFamilyAttached',
      defaultMessage: 'Single-family attached home (townhouse / duplex)',
    },
    {
      value: 'apartment_condo',
      messageId: 'energyCalculator.calculateImpact.householdType.apartmentCondo',
      defaultMessage: 'Apartment or condominium',
    },
    {
      value: 'mobile_home',
      messageId: 'energyCalculator.calculateImpact.householdType.mobileHome',
      defaultMessage: 'Mobile home',
    },
  ];

const FUEL_OPTIONS: { value: RemFuelType; messageId: string; defaultMessage: string }[] = [
  { value: 'natural_gas', messageId: 'energyCalculator.calculateImpact.fuel.naturalGas', defaultMessage: 'Natural gas' },
  { value: 'propane', messageId: 'energyCalculator.calculateImpact.fuel.propane', defaultMessage: 'Propane' },
  { value: 'electricity', messageId: 'energyCalculator.calculateImpact.fuel.electricity', defaultMessage: 'Electricity' },
  { value: 'fuel_oil', messageId: 'energyCalculator.calculateImpact.fuel.fuelOil', defaultMessage: 'Heating oil' },
];

const UPGRADE_OPTIONS: {
  value: CalculateImpactUpgradeChoice;
  messageId: string;
  defaultMessage: string;
}[] = [
  {
    value: 'heat_pump',
    messageId: 'energyCalculator.calculateImpact.upgrade.heatPump',
    defaultMessage: 'Heat pump (HVAC)',
  },
  {
    value: 'weatherization',
    messageId: 'energyCalculator.calculateImpact.upgrade.weatherization',
    defaultMessage: 'Weatherization',
  },
  {
    value: 'heat_pump_weatherization',
    messageId: 'energyCalculator.calculateImpact.upgrade.heatPumpWeatherization',
    defaultMessage: 'Heat pump + weatherization',
  },
  {
    value: 'heat_pump_water_heater',
    messageId: 'energyCalculator.calculateImpact.upgrade.heatPumpWaterHeater',
    defaultMessage: 'Heat pump water heater',
  },
];

export default function CalculateImpactPage() {
  const intl = useIntl();
  const { whiteLabel, uuid } = useParams();
  const [searchParams] = useSearchParams();
  const isAdminView = useMemo(() => searchParams.get('admin') === 'true', [searchParams]);

  const backLink = addAdminToLink(
    `/${whiteLabel}/${uuid}/results/energy-rebates/waterHeater`,
    isAdminView,
  );

  usePageTitle(OTHER_PAGE_TITLES.energyCalculatorCalculateImpact);

  const [householdType, setHouseholdType] = useState<CalculateImpactHouseholdType>('single_family_detached');
  const [address, setAddress] = useState('');
  const [heatingFuel, setHeatingFuel] = useState<RemFuelType>('natural_gas');
  const [waterHeatingFuel, setWaterHeatingFuel] = useState<RemFuelType | ''>('');
  const [upgradeChoice, setUpgradeChoice] = useState<CalculateImpactUpgradeChoice>('heat_pump_water_heater');
  const [addressError, setAddressError] = useState(false);

  const handleHouseholdTypeChange = (e: SelectChangeEvent<CalculateImpactHouseholdType>) => {
    setHouseholdType(e.target.value as CalculateImpactHouseholdType);
  };

  const handleHeatingFuelChange = (e: SelectChangeEvent<RemFuelType>) => {
    setHeatingFuel(e.target.value as RemFuelType);
  };

  const handleWaterHeatingFuelChange = (e: SelectChangeEvent<RemFuelType | ''>) => {
    setWaterHeatingFuel(e.target.value as RemFuelType | '');
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedAddress = address.trim();
    if (!trimmedAddress) {
      setAddressError(true);
      return;
    }
    setAddressError(false);

    const payload = buildCalculateImpactPayload({
      upgradeChoice,
      address: trimmedAddress,
      heatingFuel,
      waterHeatingFuel,
      householdType,
    });
    // Step 3: call REM /api/v1/rem/address with payload.remAddressQuery
    const payloadPreview = {
      ...payload,
      remAddressQuery: { ...payload.remAddressQuery, address: '[redacted]' },
    };
    // eslint-disable-next-line no-console -- MFB-979 placeholder until Step 3 API integration
    console.log('[CalculateImpact] submit payload (MFB-979 placeholder)', payloadPreview);
  };

  return (
    <main className="benefits-form calculate-impact-page">
      <section className="back-to-results-button-container">
        <BackAndSaveButtons
          navigateToLink={backLink}
          BackToThisPageText={
            <FormattedMessage
              id="energyCalculator.calculateImpact.backToWaterHeater"
              defaultMessage="BACK TO WATER HEATER REBATES"
            />
          }
        />
      </section>

      <header className="calculate-impact-header">
        <Typography variant="h1" component="h1" sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' }, fontWeight: 600 }}>
          <FormattedMessage
            id="energyCalculator.calculateImpact.title"
            defaultMessage="Bill Impact Calculator / Estimated Savings"
          />
        </Typography>
        <Typography variant="body1" className="calculate-impact-intro energy-calculator-body-text" sx={{ mt: 1 }}>
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
      </header>

      <Box component="form" onSubmit={handleSubmit}>
        <section className="calculate-impact-section" aria-labelledby="calculate-impact-household-heading">
          <Typography
            id="calculate-impact-household-heading"
            variant="h2"
            component="h2"
            className="calculate-impact-section-title"
            sx={{ fontSize: '1.25rem', fontWeight: 600 }}
          >
            <FormattedMessage
              id="energyCalculator.calculateImpact.section.household"
              defaultMessage="Your household info"
            />
          </Typography>

          <FormControl fullWidth margin="normal" required>
            <InputLabel id="calculate-impact-household-type-label">
              <FormattedMessage
                id="energyCalculator.calculateImpact.field.householdType"
                defaultMessage="Household / building type"
              />
            </InputLabel>
            <Select<CalculateImpactHouseholdType>
              labelId="calculate-impact-household-type-label"
              id="calculate-impact-household-type"
              value={householdType}
              label={intl.formatMessage({
                id: 'energyCalculator.calculateImpact.field.householdType',
                defaultMessage: 'Household / building type',
              })}
              onChange={handleHouseholdTypeChange}
            >
              {HOUSEHOLD_TYPE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  <FormattedMessage id={opt.messageId} defaultMessage={opt.defaultMessage} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            required
            margin="normal"
            id="calculate-impact-address"
            name="address"
            label={intl.formatMessage({
              id: 'energyCalculator.calculateImpact.field.address',
              defaultMessage: 'Street address',
            })}
            value={address}
            onChange={(ev) => {
              setAddress(ev.target.value);
              if (addressError) setAddressError(false);
            }}
            error={addressError}
            helperText={
              addressError
                ? intl.formatMessage({
                    id: 'energyCalculator.calculateImpact.field.addressRequired',
                    defaultMessage: 'Please enter a valid street address.',
                  })
                : undefined
            }
            placeholder={intl.formatMessage({
              id: 'energyCalculator.calculateImpact.field.addressPlaceholder',
              defaultMessage: 'e.g. 123 Main St, Denver, CO 80202',
            })}
          />

          <FormControl fullWidth margin="normal" required>
            <InputLabel id="calculate-impact-heating-fuel-label">
              <FormattedMessage
                id="energyCalculator.calculateImpact.field.heatingFuel"
                defaultMessage="Primary heating fuel"
              />
            </InputLabel>
            <Select<RemFuelType>
              labelId="calculate-impact-heating-fuel-label"
              id="calculate-impact-heating-fuel"
              value={heatingFuel}
              label={intl.formatMessage({
                id: 'energyCalculator.calculateImpact.field.heatingFuel',
                defaultMessage: 'Primary heating fuel',
              })}
              onChange={handleHeatingFuelChange}
            >
              {FUEL_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  <FormattedMessage id={opt.messageId} defaultMessage={opt.defaultMessage} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel id="calculate-impact-water-fuel-label">
              <FormattedMessage
                id="energyCalculator.calculateImpact.field.waterHeatingFuel"
                defaultMessage="Water heating fuel (optional)"
              />
            </InputLabel>
            <Select<RemFuelType | ''>
              labelId="calculate-impact-water-fuel-label"
              id="calculate-impact-water-heating-fuel"
              value={waterHeatingFuel}
              label={intl.formatMessage({
                id: 'energyCalculator.calculateImpact.field.waterHeatingFuel',
                defaultMessage: 'Water heating fuel (optional)',
              })}
              onChange={handleWaterHeatingFuelChange}
            >
              <MenuItem value="">
                <FormattedMessage
                  id="energyCalculator.calculateImpact.field.waterHeatingFuelNone"
                  defaultMessage="No answer / same as heating"
                />
              </MenuItem>
              {FUEL_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  <FormattedMessage id={opt.messageId} defaultMessage={opt.defaultMessage} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </section>

        <section className="calculate-impact-section" aria-labelledby="calculate-impact-upgrade-heading">
          <FormControl component="fieldset" fullWidth>
            <FormLabel id="calculate-impact-upgrade-heading" component="legend" sx={{ fontWeight: 600, mb: 1 }}>
              <FormattedMessage id="energyCalculator.calculateImpact.section.upgrade" defaultMessage="Select upgrade" />
            </FormLabel>
            <RadioGroup
              name="upgradeChoice"
              value={upgradeChoice}
              onChange={(ev) => setUpgradeChoice(ev.target.value as CalculateImpactUpgradeChoice)}
            >
              {UPGRADE_OPTIONS.map((opt) => (
                <FormControlLabel
                  key={opt.value}
                  value={opt.value}
                  control={<Radio />}
                  label={<FormattedMessage id={opt.messageId} defaultMessage={opt.defaultMessage} />}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </section>

        <Button type="submit" variant="contained" color="primary" size="large" className="calculate-impact-submit">
          <FormattedMessage id="energyCalculator.calculateImpact.submit" defaultMessage="Calculate impact" />
        </Button>
      </Box>
    </main>
  );
}
