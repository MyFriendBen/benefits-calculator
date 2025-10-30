import { FormattedMessage, useIntl } from 'react-intl';
import { useTranslateNumber } from '../../Assets/languageOptions';
import { FormattedMessageType } from '../../Types/Questions';
import { Program, ProgramCategory } from '../../Types/Results';
import { findValidationForProgram, useResultsContext } from './Results';

export function programValue(program: Program) {
  let total = program.household_value;

  for (const member of program.members) {
    if (member.already_has) {
      continue;
    }
    total += member.value;
  }

  return total;
}

function capValuesInitializer(): { household_value: number; member_values: { [key: string]: number } } {
  return { household_value: 0, member_values: {} };
}

export function calculateTotalValue(category: ProgramCategory) {
  // assume that none of the caps are overlapping
  if (hasOverlappingCaps(category)) {
    throw new Error(`"${category.name.default_message}" has overlapping program caps`);
  }

  let nonCapTotal = 0;
  const capValues = Array.from({ length: category.caps.length }, capValuesInitializer);
  for (const program of category.programs) {
    if (program.estimated_value_override.default_message !== '') {
      continue;
    }

    let isInCap = false;
    for (let i = 0; i < category.caps.length; i++) {
      const cap = category.caps[i];
      if (cap.programs.includes(program.name_abbreviated)) {
        capValues[i].household_value += program.estimated_value;
        for (const member of program.members) {
          if (!(member.frontend_id in capValues[i].member_values)) {
            capValues[i].member_values[member.frontend_id] = 0;
          }
          capValues[i].member_values[member.frontend_id] += member.value;
        }
        isInCap = true;
        break;
      }
    }

    if (!isInCap) {
      nonCapTotal += programValue(program);
    }
  }

  let total = nonCapTotal;
  for (let i = 0; i < category.caps.length; i++) {
    const cap = category.caps[i];
    const value = capValues[i];

    let cappedValue = Math.min(cap.household_cap, value.household_value);

    if (cap.member_caps === null) {
      total += cappedValue;
      continue;
    }
    for (const [id, memberValue] of Object.entries(value.member_values)) {
      cappedValue += Math.min(cap.member_caps[id], memberValue);
    }

    total += cappedValue;
  }

  return total;
}

function hasOverlappingCaps(category: ProgramCategory) {
  const existingProgramCaps: string[] = [];

  for (const cap of category.caps) {
    for (const program in cap.programs) {
      if (existingProgramCaps.includes(program)) {
        return true;
      }
      existingProgramCaps.push(program);
    }
  }

  return false;
}

export const formatToUSD = (num: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
};

function useOverrideValue(program: Program, value: string, expectedValue?: string) {
  const { isAdminView } = useResultsContext();
  const intl = useIntl();

  if (program.estimated_value_override.default_message !== '') {
    return intl.formatMessage({
      id: program.estimated_value_override.label,
      defaultMessage: program.estimated_value_override.default_message,
    });
  }

  if (isAdminView && expectedValue !== undefined) {
    return `${expectedValue} => ${value}`;
  }

  return value;
}

type DefaultMap<T> = {
  default: T;
  [key: string]: T | undefined;
};

function useValueFormats(): DefaultMap<(program: Program) => string> {
  const translateNumber = useTranslateNumber();
  const intl = useIntl();

  return {
    default: (program: Program) => {
      const perMonth = intl.formatMessage({ id: 'program-card-month-txt', defaultMessage: '/month' });
      return translateNumber(formatToUSD(programValue(program) / 12)) + perMonth;
    },
    lump_sum: (program: Program) => {
      return (
        translateNumber(formatToUSD(programValue(program)))
      );
    },
    estimated_annual: (program: Program) => {
      const perYear = intl.formatMessage({ id: 'results.programs.values.formats.per_year', defaultMessage: '/year' });
      return translateNumber(formatToUSD(programValue(program))) + perYear;
    },
  };
}

export function useFormatDisplayValue(program: Program) {
  const formats = useValueFormats();
  const calculator = formats[program.value_format ?? 'default'] ?? formats.default;
  const value = calculator(program);
  const { validations } = useResultsContext();
  const validation = findValidationForProgram(validations, program);
  const translateNumber = useTranslateNumber();

  if (validation !== undefined) {
    const expextedValue = translateNumber(formatToUSD(Number(validation.value) / 12));
    return useOverrideValue(program, value, expextedValue);
  }

  return useOverrideValue(program, value);
}

export function YearlyValueLabel({ program }: { program: Program }) {
  const formats: DefaultMap<FormattedMessageType> = {
    default: <FormattedMessage id="results.estimated-annual-value" defaultMessage="Estimated Annual Value" />,
    lump_sum: (
      <FormattedMessage
        id="results.programs.values.formats.programPage.lump_sum"
        defaultMessage="Estimated One-Time Payment"
      />
    ),
    estimated_annual: (
      <FormattedMessage
        id="results.programs.values.formats.programPage.estimated_annual"
        defaultMessage="Average Annual Savings"
      />
    ),
  };

  return formats[program.value_format ?? 'default'] ?? formats.default;
}

export function useFormatYearlyValue(program: Program) {
  const translateNumber = useTranslateNumber();
  const { validations } = useResultsContext();
  const validation = findValidationForProgram(validations, program);

  const value = translateNumber(formatToUSD(programValue(program)));

  if (validation !== undefined) {
    const expextedValue = translateNumber(formatToUSD(Number(validation.value)));
    return useOverrideValue(program, value, expextedValue);
  }
  return useOverrideValue(program, value);
}
