import { useParams } from 'react-router-dom';
import HouseholdMemberBasicInfoPage from './HouseholdMemberBasicInfoPage';
import HouseholdMemberForm from './HouseholdMemberForm';

/**
 * Router component that handles navigation logic for household member forms
 * - Page 0: Shows basic info form for all members (upfront collection)
 * - Page 1+: Shows detailed form for each member
 */
const HouseholdMemberRouter = () => {
  const { page } = useParams<{ page: string }>();
  const pageNumber = Number(page);

  if (pageNumber === 0) {
    return <HouseholdMemberBasicInfoPage />;
  }

  return <HouseholdMemberForm />;
};

export default HouseholdMemberRouter;
