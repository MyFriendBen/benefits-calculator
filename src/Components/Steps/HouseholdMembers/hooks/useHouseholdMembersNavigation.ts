import { useNavigate, useParams } from 'react-router-dom';
import { useContext } from 'react';
import { Context } from '../../../Wrapper/Wrapper';

interface UseHouseholdMembersNavigationParams {
  uuid: string | undefined;
  whiteLabel: string | undefined;
  currentStepId: number;
  pageNumber: number;
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
  redirectToConfirmationPage,
}: UseHouseholdMembersNavigationParams) => {
  const navigate = useNavigate();
  const { formData } = useContext(Context);

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

    if (Number(pageNumber + 1) <= formData.householdSize) {
      navigate(`/${whiteLabel}/${uuid}/step-${currentStepId}/${pageNumber + 1}`);
    } else {
      navigate(`/${whiteLabel}/${uuid}/step-${currentStepId + 1}`);
    }
  };

  return { navigateBack, navigateNext };
};
