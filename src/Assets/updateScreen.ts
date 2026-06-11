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
    // Sent as a list of `name_abbreviated` strings; the backend resolves each to
    // a Program in this white label.
    current_benefits: Array.from(formData.benefits),
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
    needs_college_savings: formData.acuteHHConditions.savings ?? null,
    needs_veteran_services: formData.acuteHHConditions.veteranServices ?? null,
    needs_disability_resources: formData.acuteHHConditions.disabilityResources ?? null,
    needs_aging_resources: formData.acuteHHConditions.agingResources ?? null,
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
    birth_year: householdMemberData.birthYear || null,
    birth_month: householdMemberData.birthMonth || null,
    relationship: householdMemberData.relationshipToHH,
    student: householdMemberData.conditions.student ?? null,
    student_full_time: householdMemberData.studentEligibility?.studentFullTime ?? null,
    student_job_training_program: householdMemberData.studentEligibility?.studentJobTrainingProgram ?? null,
    student_has_work_study: householdMemberData.studentEligibility?.studentHasWorkStudy ?? null,
    student_works_20_plus_hrs: householdMemberData.studentEligibility?.studentWorks20PlusHrs ?? null,
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
      category: incomeStream.incomeCategory,
      amount: incomeStream.incomeAmount,
      frequency: incomeStream.incomeFrequency,
      // 0 is the default for non-hourly streams; send null so the API ignores it
      hours_worked: incomeStream.hoursPerWeek === 0 ? null : incomeStream.hoursPerWeek,
    };
  });
};

const getExpensesBodies = (formData: FormData): ApiExpense[] => {
  return formData.expenses
    .filter((expense) => expense.expenseAmount > 0)
    .map((expense) => ({
      type: expense.expenseSourceName,
      amount: expense.expenseAmount,
      frequency: expense.expenseFrequency,
    }));
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
    fetchScreen: async (overrideUuid?: string) => {
      const targetUuid = overrideUuid ?? uuid;
      if (targetUuid === undefined) {
        return;
      }
      const response = await getScreen(targetUuid);
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
