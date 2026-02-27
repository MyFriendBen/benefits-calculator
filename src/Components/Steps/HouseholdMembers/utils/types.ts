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
  incomeStreamName: string;
  incomeAmount: string;
  incomeFrequency: string;
  hoursPerWeek: string;
};
