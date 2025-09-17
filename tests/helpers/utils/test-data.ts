/**
 * Test Data - Reusable test data for all tests
 *
 * This file contains predefined test data that can be used
 * across different tests to ensure consistency.
 */

import { WHITE_LABELS, REFERRERS, STATES } from './constants';

/**
 * Test user data by white label and referrer
 */
export const testUsers = {
  [WHITE_LABELS.NC]: {
    zipCode: '27704',
    county: 'Durham County',
    householdSize: '2',
    primaryUser: {
      birthMonth: 'March',
      birthYear: '1990',
      hasIncome: true,
      income: {
        type: 'Wages, salaries, tips',
        frequency: 'every month',
        amount: '2200',
      },
    },
    householdMember: {
      birthMonth: 'February',
      birthYear: '2020',
      relationship: 'Child', // Using exact matching to avoid selecting similar options like 'Foster Child', 'Step-Child', etc.
    },
    expenses: {
      hasExpenses: true,
      type: 'Rent',
      amount: '2500',
    },
    assets: '1000',
    needs: ['Food or groceries', "Concern about your child's", 'Free or low-cost help with'],
    referralSource: 'Test / Prospective Partner',
  },

  // Template for CO white label
  [WHITE_LABELS.CO]: {
    zipCode: '80401',
    county: 'Jefferson County',
    householdSize: '2',
    primaryUser: {
      birthMonth: 'March',
      birthYear: '1990',
      hasIncome: true,
      income: {
        type: 'Wages, salaries, tips',
        frequency: 'every month',
        amount: '2400',
      },
    },
    householdMember: {
      birthMonth: 'February',
      birthYear: '2020',
      relationship: 'Child',
    },
    expenses: {
      hasExpenses: true,
      type: 'Rent',
      amount: '2500',
    },
    assets: '1000',
    needs: ['Food or groceries', 'Health insurance'],
    referralSource: 'Test / Prospective Partner',
  },

  // NC 211 referrer - same data as NC white label since information collected is identical
  [REFERRERS.NC_211]: {
    zipCode: '27704',
    county: 'Durham County',
    householdSize: '2',
    primaryUser: {
      birthMonth: 'March',
      birthYear: '1990',
      hasIncome: true,
      income: {
        type: 'Wages, salaries, tips',
        frequency: 'every month',
        amount: '2200',
      },
    },
    householdMember: {
      birthMonth: 'February',
      birthYear: '2020',
      relationship: 'Child',
    },
    expenses: {
      hasExpenses: true,
      type: 'Rent',
      amount: '2500',
    },
    assets: '1000',
    needs: ['Food or groceries', "Concern about your child's", 'Free or low-cost help with'],
    referralSource: 'Test / Prospective Partner',
  },

  // Templates for other white labels/referrers, to be expanded as needed
  [REFERRERS.JEFFERSON_COUNTY]: {
    zipCode: '80401',
    county: 'Jefferson County',
    householdSize: '3',
    primaryUser: {
      birthMonth: 'April',
      birthYear: '1985',
      hasIncome: true,
      income: {
        type: 'Wages, salaries, tips',
        frequency: 'every month',
        amount: '3000',
      },
    },
    householdMember: {
      birthMonth: 'January',
      birthYear: '2018',
      relationship: 'Child',
    },
    expenses: {
      hasExpenses: true,
      type: 'Rent',
      amount: '2800',
    },
    assets: '2000',
    needs: ['Food or groceries', 'Health insurance'],
    referralSource: 'Test / Prospective Partner',
  },
};

/**
 * Default test selection options
 */
export const defaultSelections = {
  state: STATES.NORTH_CAROLINA,
  incomeTypes: ['Wages, salaries, tips', 'Self-employment income', 'Unemployment', 'Social Security', 'Child support'],
  expenseTypes: ['Rent', 'Mortgage', 'Utilities', 'Childcare'],
  frequencies: ['every week', 'every two weeks', 'twice a month', 'every month', 'every year'],
};
