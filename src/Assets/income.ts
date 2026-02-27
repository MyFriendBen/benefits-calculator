import { FormData, HouseholdData, IncomeStream } from '../Types/FormData';

export function calcIncomeStreamAmount(incomeStream: IncomeStream) {
  let num = 0;

  switch (incomeStream.incomeFrequency) {
    case 'weekly':
      num = incomeStream.incomeAmount * 52;
      break;
    case 'biweekly':
      num = incomeStream.incomeAmount * 26;
      break;
    case 'semimonthly':
      num = incomeStream.incomeAmount * 24;
      break;
    case 'monthly':
      num = incomeStream.incomeAmount * 12;
      break;
    case 'yearly':
      num = incomeStream.incomeAmount;
      break;
    case 'hourly':
      num = incomeStream.incomeAmount * incomeStream.hoursPerWeek * 52;
      break;
  }

  return num;
}

export function calcMemberYearlyIncome(member: HouseholdData) {
  let total = 0;

  for (const incomeStream of member.incomeStreams) {
    total += calcIncomeStreamAmount(incomeStream);
  }

  return total;
}

export function calcTotalIncome(formData: FormData) {
  let total = 0;

  for (const member of formData.householdData) {
    total += calcMemberYearlyIncome(member);
  }

  return total;
}
