import { ReactNode } from 'react';
import { FormattedMessageType } from '../../../../Types/Questions';
import { HealthInsurance, Conditions } from '../../../../Types/FormData';

export type WorkflowType = 'main' | 'energyCalculator';

export type HealthInsuranceOption = {
  text: FormattedMessageType;
  icon: ReactNode;
};

export type HealthInsuranceOptions = Record<'you' | 'them', Record<keyof HealthInsurance, HealthInsuranceOption>>;

export type ConditionOption = {
  text: FormattedMessageType;
  icon: ReactNode;
};

export type ConditionOptions = Record<'you' | 'them', Record<keyof Conditions, ConditionOption>>;

export type IncomeStreamFormData = {
  incomeCategory: string;
  incomeStreamName: string;
  incomeAmount: string;
  incomeFrequency: string;
  hoursPerWeek: string;
};

export type LocationState = {
  isEditing?: boolean;
  routedFromConfirmationPg?: boolean;
  basicInfoCollected?: boolean;
  returnToPage?: number;
  /**
   * Set when the roster (page 0) was reached from a member page that was itself in edit mode.
   * Page 0 hands it back on Continue so the member page restores edit mode rather than dropping
   * the user into a view with the basic-info fields hidden.
   */
  returnToEditing?: boolean;
  /**
   * The member page that originally opened the edit, carried across the roster round trip.
   * Distinct from `returnToPage`, which the roster overwrites with the page the user left —
   * without this the edit's own destination would be lost and Continue would resume normal
   * next-member navigation.
   */
  editReturnToPage?: number;
};

export type DeletePopoverState = { index: number; anchorEl: HTMLElement } | null;
