export const formatPhoneNumber = (phoneNumber: string): string => {
  if (phoneNumber.length !== 12) {
    return phoneNumber;
  }

  return `+${phoneNumber[1]}-${phoneNumber.slice(2, 5)}-${phoneNumber.slice(5, 8)}-${phoneNumber.slice(8)}`;
};

/**
 * Generates a consistent HTML ID for an urgent need based on its name
 * Used for URL anchoring and cross-component navigation between UrgentNeedBanner and NeedCard
 */
export const generateNeedId = (needName: string): string => {
  return `need-${encodeURIComponent(needName.toLowerCase())}`;
};
