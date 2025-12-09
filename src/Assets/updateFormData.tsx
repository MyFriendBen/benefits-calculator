import { useContext } from 'react';
import { EnergyCalculatorMember, FormData } from '../Types/FormData';
import { Context } from '../Components/Wrapper/Wrapper';
import { ScreenApiResponse } from '../apiCalls';

// Hook to update the context's form data from an api response
export function useUpdateFormData() {
  const { formData, setFormData } = useContext(Context);
  return (response: ScreenApiResponse) => {
    const updatedFormData: FormData = {
      ...formData,
      isTest: response.is_test ?? false,
      isTestData: response.is_test_data ?? false,
      frozen: response.frozen,
      externalID: response.external_id ?? undefined,
      agreeToTermsOfService: response.agree_to_tos ?? false,
      is13OrOlder: response.is_13_or_older ?? false,
      zipcode: response.zipcode ?? '',
      county: response.county ?? '',
      startTime: response.start_date ?? formData.startTime,
      hasExpenses: response.expenses.length ? 'true' : 'false',
      expenses: [],
      householdSize: Number(response.household_size ?? 0),
      householdData: [],
      householdAssets: Math.round(response.household_assets ?? 0),
      hasBenefits: response.has_benefits ?? 'preferNotToAnswer',
      benefits: {
        acp: response.has_acp ?? false,
        andcs: response.has_andcs ?? false,
        cccap: response.has_cccap ?? false,
        coeitc: response.has_coeitc ?? false,
        coheadstart: response.has_chs ?? false,
        coPropTaxRentHeatCreditRebate: response.has_cpcr ?? false,
        ctc: response.has_ctc ?? false,
        dentallowincseniors: response.has_cdhcs ?? false,
        denverpresc: response.has_dpp ?? false,
        ede: response.has_ede ?? false,
        eitc: response.has_eitc ?? false,
        il_eitc: response.has_il_eitc ?? false,
        il_ctc: response.has_il_ctc ?? false,
        il_transit_reduced_fare: response.has_il_transit_reduced_fare ?? false,
        il_bap: response.has_il_bap ?? false,
        il_hbwd: response.has_il_hbwd ?? false,
        il_liheap: response.has_il_liheap ?? false,
        lifeline: response.has_lifeline ?? false,
        leap: response.has_leap ?? false,
        nc_lieap: response.has_nc_lieap ?? false,
        nccip: response.has_nccip ?? false,
        mydenver: response.has_mydenver ?? false,
        nslp: response.has_nslp ?? false,
        oap: response.has_oap ?? false,
        pell: response.has_pell_grant ?? false,
        rtdlive: response.has_rtdlive ?? false,
        snap: response.has_snap ?? false,
        sunbucks: response.has_sunbucks ?? false,
        ssdi: response.has_ssdi ?? false,
        ssi: response.has_ssi ?? false,
        tanf: response.has_tanf ?? false,
        wic: response.has_wic ?? false,
        upk: response.has_upk ?? false,
        coctc: response.has_coctc ?? false,
        cowap: response.has_cowap ?? false,
        ncwap: response.has_ncwap ?? false,
        ubp: response.has_ubp ?? false,
        nfp: response.has_nfp ?? false,
        fatc: response.has_fatc ?? false,
        section_8: response.has_section_8 ?? false,
        chp: response.has_chp ?? false,
        medicaid: response.has_medicaid ?? false,
        csfp: response.has_csfp ?? false,
        ccdf: response.has_ccdf ?? false,
        aca: response.has_aca ?? false,
        nc_medicare_savings: response.has_nc_medicare_savings ?? false,
        ma_eaedc: response.has_ma_eaedc ?? false,
        ma_ssp: response.has_ma_ssp ?? false,
        ma_mbta: response.has_ma_mbta ?? false,
        ma_maeitc: response.has_ma_maeitc ?? false,
        ma_macfc: response.has_ma_macfc ?? false,
        co_andso: response.has_co_andso ?? false,
        co_care: response.has_co_care ?? false,
        project_cope: response.has_project_cope ?? false,
        cesn_heap: response.has_cesn_heap ?? false,
        cfhc: response.has_cfhc ?? false,
        shitc: response.has_shitc ?? false,
      },
      referralSource: response.referral_source ?? undefined,
      immutableReferrer: response.referrer_code ?? undefined,
      path: response.path ?? undefined,
      acuteHHConditions: {
        food: response.needs_food ?? false,
        babySupplies: response.needs_baby_supplies ?? false,
        housing: response.needs_housing_help ?? false,
        support: response.needs_mental_health_help ?? false,
        childDevelopment: response.needs_child_dev_help ?? false,
        familyPlanning: response.needs_family_planning_help ?? false,
        jobResources: response.needs_job_resources ?? false,
        dentalCare: response.needs_dental_care ?? false,
        legalServices: response.needs_legal_services ?? false,
        savings: response.needs_college_savings ?? false,
        veteranServices: response.needs_veteran_services ?? false,
      },
      signUpInfo: {
        email: '',
        phone: '',
        firstName: '',
        lastName: '',
        hasUser: Boolean(response.user),
        sendOffers: response.user?.send_offers ?? false,
        sendUpdates: response.user?.send_updates ?? false,
        emailConsent: false,
        commConsent: false,
      },
    };

    if (response.energy_calculator !== null) {
      updatedFormData.energyCalculator = {
        isHomeOwner: response.energy_calculator.is_home_owner,
        isRenter: response.energy_calculator.is_renter,
        electricProvider: response.energy_calculator.electric_provider,
        electricProviderName: response.energy_calculator.electric_provider_name,
        gasProvider: response.energy_calculator.gas_provider,
        gasProviderName: response.energy_calculator.gas_provider_name,
        electricityIsDisconnected: response.energy_calculator.electricity_is_disconnected,
        hasPastDueEnergyBills: response.energy_calculator.has_past_due_energy_bills,
        hasOldCar: response.energy_calculator.has_old_car,
        needsWaterHeater: response.energy_calculator.needs_water_heater,
        needsHvac: response.energy_calculator.needs_hvac,
        needsStove: response.energy_calculator.needs_stove,
      };
    }

    let defaultRelationship = 'headOfHousehold';
    const initialHHMHealthInsurance = {
      none: false,
      employer: false,
      private: false,
      medicaid: false,
      medicare: false,
      chp: false,
      emergency_medicaid: false,
      family_planning: false,
      dont_know: false,
    };

    for (const member of response.household_members) {
      const incomes = [];
      for (const income of member.income_streams) {
        incomes.push({
          incomeStreamName: income.type ?? '',
          incomeAmount: String(income.amount) ?? '',
          incomeFrequency: income.frequency ?? '',
          hoursPerWeek: String(income.hours_worked) ?? '',
        });
      }

      let energyCalculator: EnergyCalculatorMember | undefined = undefined;
      if (member.energy_calculator !== null) {
        energyCalculator = {
          survivingSpouse: member.energy_calculator.surviving_spouse,
          receivesSsi: member.energy_calculator.receives_ssi,
          medicalEquipment: member.energy_calculator.medical_equipment,
        };
      }

      updatedFormData.householdData.push({
        id: member.id,
        frontendId: member.frontend_id,
        age: member.age ?? undefined,
        birthYear: member.birth_year ?? undefined,
        birthMonth: member.birth_month ?? undefined,
        relationshipToHH: member.relationship ? member.relationship : defaultRelationship,
        conditions: {
          student: member.student ?? false,
          pregnant: member.pregnant ?? false,
          blindOrVisuallyImpaired: member.visually_impaired ?? false,
          disabled: member.disabled ?? false,
          longTermDisability: member.long_term_disability ?? false,
        },
        hasIncome: member.has_income ?? false,
        incomeStreams: incomes,
        energyCalculator: energyCalculator,
        healthInsurance: member.insurance ?? initialHHMHealthInsurance,
      });
      defaultRelationship = '';
    }

    for (const expense of response.expenses) {
      updatedFormData.expenses.push({
        expenseSourceName: expense.type ?? '',
        expenseAmount: expense.amount ? String(Math.round(expense.amount)) : '',
      });
    }

    setFormData(updatedFormData);
  };
}
