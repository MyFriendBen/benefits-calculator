import { useNavigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { Context } from '../../../Wrapper/Wrapper';
import { LocationState } from '../utils/types';
import { hasSubmittedMemberForm } from '../utils/defaultValues';

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
 * - Detail forms for members added mid-edit, before leaving the edit
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
   * - From page 0: Goes to previous step
   * - From page 1: Goes to basic info page (page 0) if household size > 1, otherwise previous step
   * - From page 2+: Goes to previous member page
   */
  const navigateBack = () => {
    if (!uuid) {
      console.error('UUID is undefined');
      return;
    }

    if (pageNumber === 0) {
      navigate(`/${whiteLabel}/${uuid}/step-${currentStepId - 1}`);
    } else if (pageNumber === 1) {
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
   * - Detail form of a member added during an edit, before leaving it
   * - Redirect to confirmation if needed
   * - Return to original page if editing
   * - Next member page or next step
   */
  const navigateNext = () => {
    if (!uuid) {
      console.error('UUID is undefined');
      return;
    }

    const locationState = location.state as LocationState | null;
    const returningToEditedPage = !!locationState?.isEditing && locationState?.returnToPage !== undefined;

    // A member added from the roster mid-edit is saved with basic info only. The two exits below
    // skip the normal page-by-page order, so visit every such member first, carrying the edit's
    // origin along so finishing them still ends up at Confirmation or the card that opened it.
    // The first-time flow reaches them in order and must not be redirected here.
    if (redirectToConfirmationPage || returningToEditedPage) {
      const incompleteIndex = formData.householdData.findIndex(
        (member, index) => index + 1 !== pageNumber && !hasSubmittedMemberForm(member),
      );
      if (incompleteIndex !== -1) {
        const state: LocationState = {
          isEditing: true,
          ...(redirectToConfirmationPage && { routedFromConfirmationPg: true }),
          ...(returningToEditedPage && { returnToPage: locationState?.returnToPage }),
        };
        navigate(`/${whiteLabel}/${uuid}/step-${currentStepId}/${incompleteIndex + 1}`, { state });
        return;
      }
    }

    // Redirect to confirmation page if flow is complete
    if (redirectToConfirmationPage) {
      navigate(`/${whiteLabel}/${uuid}/confirm-information`);
      return;
    }

    // If user is editing from a summary card, return them to the page they came from
    if (returningToEditedPage) {
      navigate(`/${whiteLabel}/${uuid}/step-${currentStepId}/${locationState?.returnToPage}`);
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
