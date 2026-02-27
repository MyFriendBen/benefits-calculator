import { useNavigate } from 'react-router-dom';

interface UseHouseholdMembersNavigationParams {
  uuid: string | undefined;
  whiteLabel: string | undefined;
  currentStepId: number;
  pageNumber: number;
  householdSize: number;
  redirectToConfirmationPage: boolean;
}

/**
 * Custom hook that encapsulates navigation logic for household member pages.
 * Handles forward/backward navigation between members and to/from other steps.
 */
export const useHouseholdMembersNavigation = ({
  uuid,
  whiteLabel,
  currentStepId,
  pageNumber,
  householdSize,
  redirectToConfirmationPage,
}: UseHouseholdMembersNavigationParams) => {
  const navigate = useNavigate();

  const navigateBack = () => {
    if (uuid === undefined) {
      throw new Error('uuid is undefined');
    }

    if (pageNumber <= 1) {
      navigate(`/${whiteLabel}/${uuid}/step-${currentStepId - 1}`);
    } else {
      navigate(`/${whiteLabel}/${uuid}/step-${currentStepId}/${pageNumber - 1}`);
    }
  };

  const navigateNext = () => {
    if (uuid === undefined) {
      throw new Error('uuid is undefined');
    }

    if (redirectToConfirmationPage) {
      navigate(`/${whiteLabel}/${uuid}/confirm-information`);
      return;
    }

    if (pageNumber + 1 <= householdSize) {
      navigate(`/${whiteLabel}/${uuid}/step-${currentStepId}/${pageNumber + 1}`);
    } else {
      navigate(`/${whiteLabel}/${uuid}/step-${currentStepId + 1}`);
    }
  };

  return { navigateBack, navigateNext };
};
