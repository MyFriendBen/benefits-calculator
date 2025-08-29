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
  // Sort rebates within HVAC category by: 1) authority_type, 2) authority, 3) amount.number
  rebateCategories.forEach(category => {
    if (category.type === 'hvac') {
      category.rebates.sort((a, b) => {
        // First priority: authority_type (state comes before other)
        const authorityTypeA = a.authority_type || '';
        const authorityTypeB = b.authority_type || '';
        
        // Define priority order for authority types
        const getAuthorityTypePriority = (type: string) => {
          switch (type) {
            case 'state': return 1;
            case 'federal': return 2;
            case 'utility': return 3;
            case 'other': return 4;
            case 'gas_utility': return 5;
            case 'county': return 6;
            case 'city': return 7;
            default: return 8;
          }
        };
        

        const priorityA = getAuthorityTypePriority(authorityTypeA);
        const priorityB = getAuthorityTypePriority(authorityTypeB);
        
        if (priorityA !== priorityB) {
          return priorityA - priorityB; // Sort by authority type priority
        }
        
        // Second priority: authority name (alphabetical)
        const authorityA = a.authority_name || '';
        const authorityB = b.authority_name || '';
        const authorityComparison = authorityA.localeCompare(authorityB);
        
        if (authorityComparison !== 0) {
          return authorityComparison; // Sort alphabetically by authority
        }
        
        // Third priority: amount.number (ascending - lowest first)
        const amountA = a.amount?.number || 0;
        const amountB = b.amount?.number || 0;
        return amountA - amountB; // Sort ascending by amount
      });
    }
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
