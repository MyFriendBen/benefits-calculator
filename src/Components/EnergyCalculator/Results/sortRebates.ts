import { EnergyCalculatorRebateCategory } from './rebateTypes';

// Helper function to determine heat pump type category from items array
export const getHeatPumpTypeCategory = (items: string[]): string => {
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

// Sort rebates within all categories by: 1) authority type, 2) item type category, 3) amount
export const sortRebateCategories = (rebateCategories: EnergyCalculatorRebateCategory[]): void => {
  rebateCategories.forEach(category => {
    category.rebates.sort((a, b) => {
      // First priority: authority_type (federal first)
      const authorityTypeA = a.authority_type || '';
      const authorityTypeB = b.authority_type || '';
      
      // First priority: priority order for authority types 'federal' first
      const getAuthorityTypePriority = (type: string) => {
        switch (type) {
          case 'federal': return 1;
          case 'state':
          case 'utility':
          case 'other':
          case 'gas_utility':
          case 'county':
          case 'city':
            return 2;
          default: return 3;
        }
      };
      const priorityA = getAuthorityTypePriority(authorityTypeA);
      const priorityB = getAuthorityTypePriority(authorityTypeB);
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB; // Sort by authority type priority
      }

      // Second priority: item type category (for HVAC: air source first, then ground source)
      if (category.type === 'hvac') {
        const categoryA = getHeatPumpTypeCategory(a.items || []);
        const categoryB = getHeatPumpTypeCategory(b.items || []);
        
        // Define priority order for HVAC item categories
        const getHvacCategoryPriority = (category: string): number => {
          switch (category) {
            case 'air_source': return 1;        
            case 'ground_source': return 2;     
            case 'other_heat_pump': return 3;  
            case 'central_air': return 4;      
            default: return 5;
          }
        };
        
        const priorityA = getHvacCategoryPriority(categoryA);
        const priorityB = getHvacCategoryPriority(categoryB);
        
        if (priorityA !== priorityB) {
          return priorityA - priorityB; 
        }
      }      
      
      // Third priority: amount.number (descending - highest first)
      const amountA = a.amount?.number || 0;
      const amountB = b.amount?.number || 0;
      return amountB - amountA; 
    });
  });
};
