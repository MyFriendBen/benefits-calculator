import { useContext, useEffect, useState } from 'react';
import { calcTotalIncome } from '../../../Assets/income';
import { Language } from '../../../Assets/languageOptions';
import { FormData } from '../../../Types/FormData';
import { Context } from '../../Wrapper/Wrapper';
import { useIsEnergyCalculator } from '../hooks';
import { OTHER_ELECTRIC_PROVIDERS, OTHER_GAS_PROVIDERS } from '../providers';
import {
  EnergyCalculatorAPIResponse,
  EnergyCalculatorRebateCategory,
  EnergyCalculatorRebateCategoryType,
  ENERGY_CALCULATOR_CATEGORY_MAP,
  ENERGY_CALCULATOR_CATEGORY_TITLE_MAP,
  ENERGY_CALCULATOR_ITEMS,
  EnergyCalculatorRebate
} from './rebateTypes';
import { sortRebateCategories } from './sortRebates';

const API_KEY = `Bearer ${process.env.REACT_APP_ENERGY_CALCULATOR_REWIRING_AMERICA_API_KEY}`;

function calcFilingStatus(formData: FormData) {
  // no children or spouse
  let filingStatus = 'single';

  for (const member of formData.householdData) {
    if (member.relationshipToHH === 'headOfHousehold') {
      continue;
    }

    if (member.relationshipToHH === 'spouse') {
      // has a spouse
      filingStatus = 'joint';
    } else if (filingStatus !== 'joint') {
      // has dependents but no spouse
      filingStatus = 'hoh';
    }
  }

  return filingStatus;
}

function createQueryString(formData: FormData, lang: Language) {
  const query = new URLSearchParams();

  query.append('zip', formData.zipcode);

  let ownerStatus = 'homeowner';
  if (formData.energyCalculator?.isRenter) {
    ownerStatus = 'renter';
  }
  query.append('owner_status', ownerStatus);

  const income = calcTotalIncome(formData);
  query.append('household_income', String(Math.round(income)));

  let filingStatus = calcFilingStatus(formData);
  query.append('tax_filing', filingStatus);

  query.append('household_size', String(formData.householdSize));

  const electricityProvider = formData.energyCalculator?.electricProvider;
  if (electricityProvider !== undefined && !(electricityProvider in OTHER_ELECTRIC_PROVIDERS)) {
    query.append('utility', formData.energyCalculator?.electricProvider ?? '');
  }

  const gasProvider = formData.energyCalculator?.gasProvider;
  if (gasProvider !== undefined && !(gasProvider in OTHER_GAS_PROVIDERS)) {
    query.append('gas_utility', formData.energyCalculator?.gasProvider ?? '');
  }

  let reqLang = 'en';
  if (lang === 'es') {
    reqLang = 'es';
  }
  query.append('language', reqLang);

  for (const item of ENERGY_CALCULATOR_ITEMS) {
    query.append('items', item);
  }

  return `?${query.toString()}`;
}

function isActiveRebate(rebate: EnergyCalculatorRebate) {
  const today = new Date();
  const todayDateOnly = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

  if (rebate.end_date) {
    let rebateEndDate: Date | null = null;

    // Preferred strict YYYY-MM-DD parsing
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(rebate.end_date);
    if (match) {
      const [, year, month, day] = match;
      rebateEndDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    } else {
      // Fallback for ISO-like or other valid date formats
      const parsed = new Date(rebate.end_date);
      if (!Number.isNaN(parsed.getTime())) {
        rebateEndDate = parsed;
      } else {
        // Log parsing failure for debugging
        console.warn(
          `Failed to parse end_date for rebate: ${rebate.short_description || 'unknown'}`,
          `Raw end_date: "${rebate.end_date}"`,
        );
        // Treat unparseable dates as expired for safety
        return false;
      }
    }
    // Expired rebates -> hide
    if (rebateEndDate && rebateEndDate < todayDateOnly) return false;
  }

  // Paused rebates -> hide
  if (rebate.ira_status === 'paused') return false;

  return true;
}

async function getRebates(formData: FormData, lang: Language) {
  const queryString = createQueryString(formData, lang);
  const apiUrl = `https://api.rewiringamerica.org/api/v1/calculator${queryString}`;

  const res = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      Authorization: API_KEY,
    },
  });

  const data = (await res.json()) as EnergyCalculatorAPIResponse;

  const rebateCategories: EnergyCalculatorRebateCategory[] = [];

  // Active rebates filter
  const activeRebates = data.incentives.filter(isActiveRebate);

  for (const rebate of activeRebates) {
    const categories = new Set<EnergyCalculatorRebateCategoryType>();

    for (const item of rebate.items) {
      const category = ENERGY_CALCULATOR_CATEGORY_MAP[item];

      if (category === undefined) {
        // skip if uncategorized
        continue
      }

      categories.add(category);
    }

    for (const categoryName of categories) {
      const rebateCategory = categoryName;
      const rebateCategoryName = ENERGY_CALCULATOR_CATEGORY_TITLE_MAP[categoryName];
      let category = rebateCategories.find((category) => category.type === rebateCategory);

      if (category === undefined) {
        category = {
          type: rebateCategory,
          name: rebateCategoryName,
          rebates: [],
        };
        rebateCategories.push(category);
      }

      category.rebates.push(rebate);
    }
  }
    
  // Sort rebates within all categories using the sorting function
  sortRebateCategories(rebateCategories);  
  
  return rebateCategories;
}

export default function useFetchEnergyCalculatorRebates() {
  const { formData, locale } = useContext(Context);
  const [rebates, setRebates] = useState<EnergyCalculatorRebateCategory[] | undefined>(undefined);
  const isEnergyCalculator = useIsEnergyCalculator();

  useEffect(() => {
    if (!isEnergyCalculator || (!formData.energyCalculator?.isHomeOwner && !formData.energyCalculator?.isRenter)) {
      setRebates([]);
      return;
    }

    getRebates(formData, locale).then((rebates) => {
      setRebates(rebates);
    });
  }, [isEnergyCalculator, formData.energyCalculator, locale]);

  return rebates;
}
