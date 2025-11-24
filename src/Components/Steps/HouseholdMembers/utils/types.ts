import { ReactNode } from 'react';
import { FormattedMessageType } from '../../../Types/Questions';
import { HealthInsurance, Conditions } from '../../../Types/FormData';

export type LocationState = {
  isEditing?: boolean;
  returnToPage?: number;
};

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

export const EMPTY_INCOME_STREAM: IncomeStreamFormData = {
  incomeCategory: '',
  incomeStreamName: '',
  incomeAmount: '',
  incomeFrequency: '',
  hoursPerWeek: '',
};
