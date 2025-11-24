import { useContext } from 'react';
import { useParams } from 'react-router-dom';
import { Context } from '../../../Wrapper/Wrapper';
import HouseholdMemberBasicInfoPage from './HouseholdMemberBasicInfoPage';
import HouseholdMemberForm from './HouseholdMemberForm';

/**
 * Router component that handles navigation logic for household member forms
 * - Page 0: Shows basic info form for all members (when household size > 1)
 * - Page 1+: Shows detailed form for each member
 */
const HouseholdMemberRouter = () => {
  const { formData } = useContext(Context);
  const { page } = useParams<{ page: string }>();
  const pageNumber = Number(page);

  // Show basic info page for all members when household size > 1 and on page 0
  if (pageNumber === 0 && formData.householdSize > 1) {
    return <HouseholdMemberBasicInfoPage />;
  }

  // Show individual member detail form
  return <HouseholdMemberForm />;
};

export default HouseholdMemberRouter;
