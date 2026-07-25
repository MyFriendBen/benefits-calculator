import { Button } from '@mui/material';
import { useContext } from 'react';
import { Context } from '../Wrapper/Wrapper';
import { useNavigate, useParams } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import { useStepName, useStepNumber } from '../../Assets/stepDirectory';
import { useTrackEvent } from '../../Assets/analytics';
import { getStepAnalyticsId } from '../../Assets/analytics/stepIds';

type Props = {
  navFunction: () => void;
  // Overrides the route-derived step slug/number for the back event. Used by the
  // household sub-pages, which route on `step-N/:page` (so useParams has no `id`)
  // and whose slug (member-basics / member-details) depends on the page number —
  // neither is recoverable from the route here.
  stepNameOverride?: string;
  stepNumberOverride?: number;
};

const PreviousButton = ({ navFunction, stepNameOverride, stepNumberOverride }: Props) => {
  const { formData } = useContext(Context);
  const { whiteLabel, id, uuid } = useParams();
  let stepNumberId = Number(id);
  if (!stepNumberId) stepNumberId = 1;
  const navigate = useNavigate();
  const track = useTrackEvent();

  const householdStep = useStepNumber('householdData', false);
  // Every screener step renders its "Back" CTA through this shared component
  // (directly or via PrevAndContinueButtons), making it the single place to
  // track back-navigation across the whole step framework. `id` is only present
  // on numbered step-N routes — pages without it (e.g. Confirmation) pass their
  // own `navFunction` and don't correspond to a step number.
  const stepNameForId = useStepName(stepNumberId);
  const currentStepName = id ? stepNameForId : undefined;

  const defaultNavigate = () => {
    if (id && +id === householdStep + 1) {
      navigate(`/${whiteLabel}/${uuid}/step-${householdStep}/${formData.householdData.length || 1}`);
      return;
    }
    navigate(`/${whiteLabel}/${uuid}/step-${stepNumberId - 1}`);
  };

  const navigationFunction = navFunction ?? defaultNavigate;

  const handleClick = () => {
    track('screener_form_back', {
      screener_step_name: stepNameOverride ?? getStepAnalyticsId(currentStepName),
      screener_step_number: stepNumberOverride ?? (id ? stepNumberId : undefined),
    });
    navigationFunction();
  };

  return (
    <Button
      variant="outlined"
      onClick={handleClick}
      startIcon={<NavigateBeforeIcon sx={{ mr: '-8px' }} className="rtl-mirror" />}
    >
      <FormattedMessage id="previousButton" defaultMessage="Back" />
    </Button>
  );
};

export default PreviousButton;
