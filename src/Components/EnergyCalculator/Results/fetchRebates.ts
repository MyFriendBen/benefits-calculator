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
} from './rebateTypes';

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

async function getRebates(formData: FormData, lang: Language) {
  const queryString = createQueryString(formData, lang);
  const res = await fetch(`https://api.rewiringamerica.org/api/v1/calculator${queryString}`, {
    method: 'GET',
    headers: {
      Authorization: API_KEY,
    },
  });

  const data = (await res.json()) as EnergyCalculatorAPIResponse;

  const rebateCategories: EnergyCalculatorRebateCategory[] = [];

  for (const rebate of data.incentives) {
    const categories = new Set<EnergyCalculatorRebateCategoryType>();

    for (const item of rebate.items) {
      const category = ENERGY_CALCULATOR_CATEGORY_MAP[item];

      if (category === undefined) {
        continue;
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
  console.log("Recate categories data :", rebateCategories)
  
  // Helper function to determine heat pump type category from items array
  const getHeatPumpTypeCategory = (items: string[]): string => {
    // Air source heat pumps (should come first)
    if (items.some(item => ['ducted_heat_pump', 'ductless_heat_pump', 'air_to_water_heat_pump'].includes(item))) {
      return 'air_source';
    }
    // Ground/geothermal source heat pumps (should come second)
    if (items.some(item => ['geothermal_heating_installation'].includes(item))) {
      return 'ground_source';
    }
    // Other heat pumps
    if (items.some(item => ['other_heat_pump'].includes(item))) {
      return 'other_heat_pump';
    }
    // Central air conditioner
    if (items.some(item => ['central_air_conditioner'].includes(item))) {
      return 'central_air';
    }
    // For non-HVAC categories, return the first item or 'other'
    return items[0] || 'other';
  };

  // Sort rebates within all categories by: 1) item type category, 2) amount.number
  rebateCategories.forEach(category => {
    category.rebates.sort((a, b) => {
      // First priority: item type category (for HVAC: air source first, then ground source)
      if (category.type === 'hvac') {
        const categoryA = getHeatPumpTypeCategory(a.items || []);
        const categoryB = getHeatPumpTypeCategory(b.items || []);
        
        // Define priority order for HVAC item categories
        const getHvacCategoryPriority = (category: string): number => {
          switch (category) {
            case 'air_source': return 1;        // Air source heat pumps first
            case 'ground_source': return 2;     // Ground/geothermal second
            case 'other_heat_pump': return 3;   // Other heat pumps third
            case 'central_air': return 4;       // Central air last
            default: return 5;
          }
        };
        
        const priorityA = getHvacCategoryPriority(categoryA);
        const priorityB = getHvacCategoryPriority(categoryB);
        
        if (priorityA !== priorityB) {
          return priorityA - priorityB; // Sort by heat pump type priority
        }
      } else {
        // For non-HVAC categories, sort by first item alphabetically
        const firstItemA = (a.items && a.items[0]) || '';
        const firstItemB = (b.items && b.items[0]) || '';
        const itemComparison = firstItemA.localeCompare(firstItemB);
        
        if (itemComparison !== 0) {
          return itemComparison; // Sort alphabetically by first item
        }
      }
      
      // Second priority: amount.number (descending - highest first)
      const amountA = a.amount?.number || 0;
      const amountB = b.amount?.number || 0;
      return amountB - amountA; // Sort descending by amount
    });
  });
  return rebateCategories;
}

export default function useFetchEnergyCalculatorRebates() {
  const { formData, locale } = useContext(Context);
  const [rebates, setRebates] = useState<EnergyCalculatorRebateCategory[]>([]);
  const isEnergyCalculator = useIsEnergyCalculator();

  useEffect(() => {
    if (!isEnergyCalculator || (!formData.energyCalculator?.isHomeOwner && !formData.energyCalculator?.isRenter)) {
      setRebates([]);
      return;
    }

    getRebates(formData, locale).then((rebates) => {
      setRebates(rebates);
    });
  }, [isEnergyCalculator, locale]);

  return rebates;
}
