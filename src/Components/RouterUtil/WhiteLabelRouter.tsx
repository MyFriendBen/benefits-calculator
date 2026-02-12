import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ALL_VALID_WHITE_LABELS, WhiteLabel, WHITE_LABEL_DEFAULT_PATH } from '../../Types/WhiteLabel';
import { useQueryString } from '../QuestionComponents/questionHooks';
import { useUpdateWhiteLabelAndNavigate } from './RedirectToWhiteLabel';

// route the path /:whiteLabel to /:whiteLabel/{defaultPath}
// defaultPath is 'step-1' unless specified in WHITE_LABEL_DEFAULT_PATH
export default function WhiteLabelRouter() {
  const { whiteLabel } = useParams();
  const query = useQueryString();
  const navigate = useNavigate();
  const updateWhiteLabelAndNavigate = useUpdateWhiteLabelAndNavigate();

  useEffect(() => {
    if (whiteLabel === undefined || !ALL_VALID_WHITE_LABELS.includes(whiteLabel as WhiteLabel)) {
      navigate(`/step-1${query}`, { replace: true });
      return;
    }

    const defaultPath = WHITE_LABEL_DEFAULT_PATH[whiteLabel as WhiteLabel] ?? 'step-1';
    updateWhiteLabelAndNavigate(whiteLabel, `${defaultPath}${query}`, true);
  }, []);

  return null;
}
