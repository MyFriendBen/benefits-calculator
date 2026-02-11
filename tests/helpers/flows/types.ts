/**
 * Flow Helper Types - Type definitions for flow helpers
 *
 * This file contains TypeScript interfaces and types used by flow helpers
 * to ensure type safety across the test suite.
 */

/**
 * User personal information
 */
export interface PersonInfo {
  birthMonth: string;
  birthYear: string;
}

/**
 * Income information
 */
export interface IncomeInfo {
  type: string;
  frequency: string;
  amount: string;
}

/**
 * Primary user information
 */
export interface PrimaryUserInfo extends PersonInfo {
  hasIncome: boolean;
  income?: IncomeInfo;
}

/**
 * Household member information
 */
export interface HouseholdMemberInfo extends PersonInfo {
  relationship: string;
  hasIncome?: boolean;
  income?: IncomeInfo;
}

/**
 * Expense information
 */
export interface ExpenseInfo {
  hasExpenses: boolean;
  type: string;
  amount: string;
}

/**
 * Application data for a complete test flow
 */
export interface ApplicationData {
  zipCode: string;
  county: string;
  householdSize: string;
  primaryUser: PrimaryUserInfo;
  householdMember: HouseholdMemberInfo;
  expenses: ExpenseInfo;
  assets: string;
  needs: string[];
  referralSource: string;
}

/**
 * White label identifiers as union type for type safety
 */
export type WhiteLabel = 'nc' | 'co' | 'ma' | 'cesn';

/**
 * Referrer identifiers as union type for type safety
 */
export type Referrer = 'jeffco' | '211co' | '211nc';

/**
 * Flow result status
 */
export interface FlowResult {
  success: boolean;
  step: string;
  error?: Error;
}
