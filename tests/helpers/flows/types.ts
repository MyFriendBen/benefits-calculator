/**
 * Flow Helper Types - Type definitions for flow helpers
 *
 * This file contains TypeScript interfaces and types used by flow helpers
 * to ensure type safety across the test suite.
 */

import type { WhiteLabel } from '../../../src/Types/WhiteLabel';

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
  category: string;
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
 * Basic info for a single member on step-5/0
 */
export interface BasicInfoMember {
  birthMonth: string;
  birthYear: string;
  relationship?: string; // omitted for primary member (index 0)
}

/**
 * Expense information.
 * hasExpenses is derived from whether amount > 0 — just omit the expense entry if there are none.
 */
export interface ExpenseInfo {
  type: string;
  amount: string;
  frequency?: 'monthly' | 'yearly';
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
