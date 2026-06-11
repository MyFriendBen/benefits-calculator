import { useContext, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { STARTING_QUESTION_NUMBER, useStepDirectory, useStepName, useStepNumber } from '../../Assets/stepDirectory';
import { isCustomTypedLocationState } from '../../Types/FormData';
import { QuestionName } from '../../Types/Questions';
import { Context } from '../Wrapper/Wrapper';

export function useShouldRedirectToConfirmation() {
  const location = useLocation();
  return isCustomTypedLocationState(location.state) && location.state.routedFromConfirmationPg;
}

export function useShouldRedirectToResults() {
  const location = useLocation();
  return isCustomTypedLocationState(location.state) && location.state.routeBackToResults;
}

// routeEnding will be added to the end of the route when going to the next step
export function useGoToNextStep(questionName: QuestionName, routeEnding: string = '') {
  const { whiteLabel, uuid } = useParams();
  const stepNumber = useStepNumber(questionName);
  const stepDirectory = useStepDirectory();
  const totalStepCount = stepDirectory.length + STARTING_QUESTION_NUMBER - 1;
  const redirectToConfirmationPage = useShouldRedirectToConfirmation();
  const redirectToResults = useShouldRedirectToResults();
  const navigate = useNavigate();

  return () => {
    if (redirectToConfirmationPage) {
      navigate(`/${whiteLabel}/${uuid}/confirm-information`);
      return;
    }

    if (redirectToResults) {
      navigate(`/${whiteLabel}/${uuid}/results/near-term-needs`);
      return;
    }

    if (stepNumber === totalStepCount) {
      navigate(`/${whiteLabel}/${uuid}/confirm-information`);
      return;
    }

    navigate(`/${whiteLabel}/${uuid}/step-${stepNumber + 1}/${routeEnding}`);
  };
}

type MainQueryParamName = 'externalid' | 'referrer' | 'path' | 'test';
export function useQueryString(override?: Partial<Record<MainQueryParamName, string | null>>): string {
  const { formData } = useContext(Context);
  const query = new URLSearchParams();

  const setParam = (name: MainQueryParamName, value: string | undefined, ...dontShowConditions: unknown[]) => {
    let overrideValue = override?.[name];

    if (overrideValue === null) {
      return;
    }

    if (overrideValue !== undefined) {
      query.append(name, overrideValue);
      return;
    }

    if (value === undefined) {
      return;
    }
    for (const condition of dontShowConditions) {
      if (value === condition) {
        return;
      }
    }

    query.append(name, value);
  };

  setParam('externalid', formData.externalID);
  setParam('referrer', formData.immutableReferrer, '');
  setParam('path', formData.path, 'default');
  setParam('test', formData.isTest ? 'true' : undefined);

  let queryString = query.toString();
  if (queryString !== '') {
    queryString = '?' + queryString;
  }

  return queryString;
}

const MEMBER_QUESTIONS: QuestionName[] = ['householdData'];

export function useDefaultBackNavigationFunction(questionName: QuestionName) {
  const { formData } = useContext(Context);
  const { whiteLabel, uuid } = useParams();
  const navigate = useNavigate();
  const currentStepId = useStepNumber(questionName);
  const prevStepName = useStepName(currentStepId - 1);

  const prevUrl = useMemo(() => {
    if (prevStepName && MEMBER_QUESTIONS.includes(prevStepName)) {
      return `/${whiteLabel}/${uuid}/step-${currentStepId - 1}/${formData.householdData.length || 1}`;
    }

    return `/${whiteLabel}/${uuid}/step-${currentStepId - 1}`;
  }, [prevStepName]);

  return () => navigate(prevUrl);
}
