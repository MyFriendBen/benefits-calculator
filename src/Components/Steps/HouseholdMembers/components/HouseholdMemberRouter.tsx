import { useParams } from 'react-router-dom';
import HouseholdMemberBasicInfoPage from './HouseholdMemberBasicInfoPage';
import HouseholdMemberForm from './HouseholdMemberForm';

const HouseholdMemberRouter = () => {
  const { page } = useParams<{ page: string }>();
  const pageNumber = Number(page);

  if (pageNumber === 0) {
    return <HouseholdMemberBasicInfoPage />;
  }

  return <HouseholdMemberForm />;
};

export default HouseholdMemberRouter;
