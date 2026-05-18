import type { QuestionName } from '../Types/Questions';
import { useContext } from 'react';
import { Context } from '../Components/Wrapper/Wrapper';

export const STARTING_QUESTION_NUMBER = 3;

export function useStepDirectory() {
  const {
    getReferrer,
    formData,
    hasBenefitsPrograms,
    hasBenefitsProgramsLoading,
    hasBenefitsProgramsError,
    referralOptions,
    referralOptionsLoading,
  } = useContext(Context);

  const stepDirectory = getReferrer('stepDirectory', []);

  let steps: QuestionName[];
  if (Array.isArray(stepDirectory)) {
    steps = stepDirectory;
  } else {
    const pathStepDirectory = stepDirectory[formData.path ?? 'default'];
    steps = pathStepDirectory !== undefined ? pathStepDirectory : stepDirectory.default;
  }

  if (formData.immutableReferrer && !referralOptionsLoading) {
    const allOptions = { ...referralOptions.generic, ...referralOptions.partners };
    if (formData.immutableReferrer in allOptions) {
      steps = steps.filter((step) => step !== 'referralSource');
    }
  }

  // Skip the 'already has benefits' step entirely when the WL has no programs
  // flagged for it (so users don't land on a blank dead-end page). Only skip
  // on a *successful* empty fetch — on error, keep the step so AlreadyHasBenefits
  // can render its error Alert rather than silently bypassing the step.
  if (
    hasBenefitsProgramsLoading === false &&
    hasBenefitsProgramsError === false &&
    (hasBenefitsPrograms ?? []).length === 0
  ) {
    steps = steps.filter((step) => step !== 'hasBenefits');
  }

  return steps;
}

export function useStepNumber(name: QuestionName, raise: boolean = true) {
  // The second argument is an optional boolean that you can use if you need to access the step number before the config is loaded.
  const stepDirectory = useStepDirectory();

  const stepNumber = stepDirectory.findIndex((question) => question === name);

  if (stepNumber === -1) {
    if (raise) {
      throw new Error(`The "${name}" step does not exist for this referrer`);
    }

    return -1;
  }

  return stepNumber + STARTING_QUESTION_NUMBER;
}

export function useStepName(stepNumber: number): QuestionName | undefined {
  const stepDirectory = useStepDirectory();

  return stepDirectory[stepNumber - STARTING_QUESTION_NUMBER];
}
