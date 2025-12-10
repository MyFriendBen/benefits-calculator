import { useNavigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { Context } from '../../../Wrapper/Wrapper';
import { LocationState } from '../utils/types';

interface UseHouseholdMembersNavigationParams {
  uuid: string | undefined;
  whiteLabel: string | undefined;
  currentStepId: number;
  pageNumber: number;
  redirectToConfirmationPage: boolean;
}

/**
 * Custom hook that encapsulates all household members navigation logic
 * Handles navigation between:
 * - Basic info page (page 0) and individual member pages
 * - Previous/next member pages
 * - Return to edited member after editing
 * - Confirmation page when complete
 */
export const useHouseholdMembersNavigation = ({
  uuid,
  whiteLabel,
  currentStepId,
  pageNumber,
  redirectToConfirmationPage,
}: UseHouseholdMembersNavigationParams) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { formData } = useContext(Context);

  /**
   * Navigate to the previous page
   * - From page 1: Goes to basic info page (page 0) if household size > 1, otherwise previous step
   * - From page 2+: Goes to previous member page
   */
  const navigateBack = () => {
    if (!uuid) {
      console.error('UUID is undefined');
      return;
    }

    if (pageNumber === 1) {
      if (formData.householdSize === 1) {
        navigate(`/${whiteLabel}/${uuid}/step-${currentStepId - 1}`);
      } else {
        navigate(`/${whiteLabel}/${uuid}/step-${currentStepId}/0`);
      }
    } else {
      navigate(`/${whiteLabel}/${uuid}/step-${currentStepId}/${pageNumber - 1}`);
    }
  };

  /**
   * Navigate to the next page
   * Handles:
   * - Redirect to confirmation if needed
   * - Return to original page if editing
   * - Next member page or next step
   */
  const navigateNext = () => {
    if (!uuid) {
      console.error('UUID is undefined');
      return;
    }

    // Redirect to confirmation page if flow is complete
    if (redirectToConfirmationPage) {
      navigate(`/${whiteLabel}/${uuid}/confirm-information`);
      return;
    }

    // If user is editing from a summary card, return them to the page they came from
    const locationState = location.state as LocationState | null;
    if (locationState?.isEditing && locationState?.returnToPage !== undefined) {
      navigate(`/${whiteLabel}/${uuid}/step-${currentStepId}/${locationState.returnToPage}`);
      return;
    }

    // Navigate to next member or next step
    if (Number(pageNumber + 1) <= formData.householdSize) {
      navigate(`/${whiteLabel}/${uuid}/step-${currentStepId}/${pageNumber + 1}`);
    } else {
      navigate(`/${whiteLabel}/${uuid}/step-${currentStepId + 1}`);
    }
  };

  return {
    navigateBack,
    navigateNext,
  };
};
