import {
  ApiEnergyCalculatorFormData,
  ApiEnergyCalculatorMember,
  ApiExpense,
  ApiFormData,
  ApiHouseholdMember,
  ApiIncome,
  ApiUser,
  ApiUserWriteOnly,
} from '../Types/ApiFormData.js';
import { EnergyCalculatorFormData, EnergyCalculatorMember, FormData, HouseholdData } from '../Types/FormData';
import { putScreen, postScreen, putUser, getScreen } from '../apiCalls';
import { Language } from './languageOptions';
import { useContext } from 'react';
import { Context } from '../Components/Wrapper/Wrapper';
import { useParams } from 'react-router-dom';
import { useUpdateFormData } from './updateFormData';
import { getCampaign } from '../Components/CampaignAnalytics/campaign';

const getScreensBody = (formData: FormData, languageCode: Language, whiteLabel: string) => {
  const householdMembers = getHouseholdMembersBodies(formData);
  const expenses = getExpensesBodies(formData);

  const screenBody: ApiFormData = {
    white_label: whiteLabel,
    is_test: formData.isTest ?? false,
    external_id: formData.externalID ?? null,
    agree_to_tos: formData.agreeToTermsOfService,
    is_13_or_older: formData.is13OrOlder,
    zipcode: formData.zipcode,
    county: formData.county,
    start_date: formData.startTime,
    household_size: formData.householdSize === 0 ? null : Number(formData.householdSize),
    household_members: householdMembers,
    expenses: expenses,
    household_assets: formData.householdAssets || 0,
    request_language_code: languageCode,
    energy_calculator: getEnergyCalculatorFormDataBody(formData.energyCalculator),
    has_benefits: formData.hasBenefits,
    has_acp: formData.benefits.acp ?? null,
    has_andcs: formData.benefits.andcs ?? null,
    has_cccap: formData.benefits.cccap ?? null,
    has_coeitc: formData.benefits.coeitc ?? null,
    has_chs: formData.benefits.coheadstart ?? null,
    has_cpcr: formData.benefits.coPropTaxRentHeatCreditRebate ?? null,
    has_ctc: formData.benefits.ctc ?? null,
    has_cdhcs: formData.benefits.dentallowincseniors ?? null,
    has_dpp: formData.benefits.denverpresc ?? null,
    has_ede: formData.benefits.ede ?? null,
    has_eitc: formData.benefits.eitc ?? null,
    has_erc: null,
    has_lifeline: formData.benefits.lifeline ?? null,
    has_leap: formData.benefits.leap ?? null,
    has_mydenver: formData.benefits.mydenver ?? null,
    has_nslp: formData.benefits.nslp ?? null,
    has_oap: formData.benefits.oap ?? null,
    has_pell_grant: formData.benefits.pell ?? null,
    has_nfp: formData.benefits.nfp ?? null,
    has_rtdlive: formData.benefits.rtdlive ?? null,
    has_snap: formData.benefits.snap ?? null,
    has_sunbucks: formData.benefits.sunbucks ?? null,
    has_ssdi: formData.benefits.ssdi ?? null,
    has_ssi: formData.benefits.ssi ?? null,
    has_cowap: formData.benefits.cowap ?? null,
    has_ubp: formData.benefits.ubp ?? null,
    has_tanf: formData.benefits.tanf ?? null,
    has_wic: formData.benefits.wic ?? null,
    has_upk: formData.benefits.upk ?? null,
    has_coctc: formData.benefits.coctc ?? null,
    has_fatc: formData.benefits.fatc ?? null,
    has_section_8: formData.benefits.section_8 ?? null,
    has_chp: formData.benefits.chp ?? null,
    has_medicaid: formData.benefits.medicaid ?? null,
    has_nc_lieap: formData.benefits.nc_lieap ?? null,
    has_ncwap: formData.benefits.ncwap ?? null,
    has_nccip: formData.benefits.nccip ?? null,
    has_csfp: formData.benefits.csfp ?? null,
    has_ccdf: formData.benefits.ccdf ?? null,
    has_aca: formData.benefits.aca ?? null,
    has_ma_eaedc: formData.benefits.ma_eaedc ?? null,
    has_ma_ssp: formData.benefits.ma_ssp ?? null,
    has_ma_mbta: formData.benefits.ma_mbta ?? null,
    has_ma_maeitc: formData.benefits.ma_maeitc ?? null,
    has_ma_macfc: formData.benefits.ma_macfc ?? null,
    has_co_andso: formData.benefits.co_andso ?? null,
    has_co_care: formData.benefits.co_care ?? null,
    has_cfhc: formData.benefits.cfhc ?? null,
    has_shitc: formData.benefits.shitc ?? null,
    referral_source: formData.referralSource ?? null,
    referrer_code: formData.immutableReferrer ?? null,
    path: formData.path ?? null,
    needs_food: formData.acuteHHConditions.food ?? null,
    needs_baby_supplies: formData.acuteHHConditions.babySupplies ?? null,
    needs_housing_help: formData.acuteHHConditions.housing ?? null,
    needs_mental_health_help: formData.acuteHHConditions.support ?? null,
    needs_child_dev_help: formData.acuteHHConditions.childDevelopment ?? null,
    needs_family_planning_help: formData.acuteHHConditions.familyPlanning ?? null,
    needs_job_resources: formData.acuteHHConditions.jobResources ?? null,
    needs_dental_care: formData.acuteHHConditions.dentalCare ?? null,
    needs_legal_services: formData.acuteHHConditions.legalServices ?? null,
    needs_veteran_services: formData.acuteHHConditions.veteranServices ?? null,
    utm_id: formData.utm?.id ?? null,
    utm_source: formData.utm?.source ?? null,
    utm_medium: formData.utm?.medium ?? null,
    utm_campaign: formData.utm?.campaign ?? null,
    utm_content: formData.utm?.content ?? null,
    utm_term: formData.utm?.term ?? null,
  };

  return screenBody;
};

const getHouseholdMembersBodies = (formData: FormData): ApiHouseholdMember[] => {
  const householdMembers = formData.householdData.map((householdMember) => {
    return getHouseholdMemberBody(householdMember);
  });
  return householdMembers;
};

const getEnergyCalculatorMemberBody = (
  energyCalculatorMember: EnergyCalculatorMember | undefined,
): ApiEnergyCalculatorMember | null => {
  if (energyCalculatorMember === undefined) {
    return null;
  }

  return {
    surviving_spouse: energyCalculatorMember.survivingSpouse,
    receives_ssi: energyCalculatorMember.receivesSsi,
    medical_equipment: energyCalculatorMember.medicalEquipment,
  };
};

const getEnergyCalculatorFormDataBody = (
  energyCalculatorFormData: EnergyCalculatorFormData | undefined,
): ApiEnergyCalculatorFormData | null => {
  if (energyCalculatorFormData === undefined) {
    return null;
  }

  return {
    is_home_owner: energyCalculatorFormData.isHomeOwner,
    is_renter: energyCalculatorFormData.isRenter,
    electric_provider: energyCalculatorFormData.electricProvider,
    electric_provider_name: energyCalculatorFormData.electricProviderName,
    gas_provider: energyCalculatorFormData.gasProvider,
    gas_provider_name: energyCalculatorFormData.gasProviderName,
    electricity_is_disconnected: energyCalculatorFormData.electricityIsDisconnected,
    has_past_due_energy_bills: energyCalculatorFormData.hasPastDueEnergyBills,
    has_old_car: energyCalculatorFormData.hasOldCar,
    needs_water_heater: energyCalculatorFormData.needsWaterHeater,
    needs_hvac: energyCalculatorFormData.needsHvac,
    needs_stove: energyCalculatorFormData.needsStove,
  };
};

const getHouseholdMemberBody = (householdMemberData: HouseholdData): ApiHouseholdMember => {
  const incomes = getIncomeStreamsBodies(householdMemberData);

  return {
    frontend_id: householdMemberData.frontendId,
    age: householdMemberData.age ?? null,
    birth_year: householdMemberData.birthYear ?? null,
    birth_month: householdMemberData.birthMonth ?? null,
    relationship: householdMemberData.relationshipToHH,
    student: householdMemberData.conditions.student ?? null,
    pregnant: householdMemberData.conditions.pregnant ?? null,
    visually_impaired: householdMemberData.conditions.blindOrVisuallyImpaired ?? null,
    disabled: householdMemberData.conditions.disabled ?? null,
    long_term_disability: householdMemberData.conditions.longTermDisability ?? null,
    has_income: householdMemberData.hasIncome,
    income_streams: incomes,
    energy_calculator: getEnergyCalculatorMemberBody(householdMemberData.energyCalculator),
    insurance: householdMemberData.healthInsurance ?? null,
  };
};

const getIncomeStreamsBodies = (householdMemberData: HouseholdData): ApiIncome[] => {
  return householdMemberData.incomeStreams.map((incomeStream) => {
    return {
      type: incomeStream.incomeStreamName,
      amount: Number(incomeStream.incomeAmount),
      frequency: incomeStream.incomeFrequency,
      hours_worked: Number(incomeStream.hoursPerWeek) ?? null,
    };
  });
};

const getExpensesBodies = (formData: FormData): ApiExpense[] => {
  return formData.expenses.map((expense) => {
    return {
      type: expense.expenseSourceName,
      amount: expense.expenseAmount === '' ? 0 : Number(expense.expenseAmount),
      frequency: 'monthly',
    };
  });
};

type ApiUserBody = ApiUser & ApiUserWriteOnly;

const getUserBody = (formData: FormData, languageCode: Language): ApiUserBody => {
  const { email, phone, firstName, lastName, sendUpdates, sendOffers, commConsent } = formData.signUpInfo;
  const phoneNumber = '+1' + phone;

  const user: ApiUserBody = {
    email_or_cell: email ? email : phoneNumber,
    cell: phone ? phoneNumber : null,
    email: email ? email : null,
    first_name: firstName,
    last_name: lastName,
    explicit_tcpa_consent: commConsent,
    language_code: languageCode,
    send_offers: sendOffers,
    send_updates: sendUpdates,
  };

  return user;
};

export default function useScreenApi() {
  const { whiteLabel, locale } = useContext(Context);
  const { uuid } = useParams();
  const updateFormData = useUpdateFormData();

  return {
    fetchScreen: async () => {
      if (uuid === undefined) {
        return;
      }
      const response = await getScreen(uuid);
      updateFormData(response);
      return response;
    },
    updateScreen: async (formData: FormData) => {
      if (uuid === undefined) {
        return;
      }
      const updatedFormData = await putScreen(getScreensBody(formData, locale, whiteLabel), uuid);
      updateFormData(updatedFormData);
    },
    createScreen: async (formData: FormData) => {
      const extendedFormData = {
        ...formData,
        utm: getCampaign(),
      };
      const newFormData = await postScreen(getScreensBody(extendedFormData, locale, whiteLabel));
      updateFormData(newFormData);
      return newFormData;
    },
    updateUser: async (formData: FormData) => {
      const userBody = getUserBody(formData, locale);
      if (!formData.signUpInfo.hasUser && userBody.email_or_cell === '+1') {
        return;
      }

      if (uuid === undefined) {
        return;
      }

      await putUser(userBody, uuid);
    },
  };
}
