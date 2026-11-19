import { useParams } from 'react-router-dom';

const STEP_SEGMENT_PREFIX = 'step-';

/**
 * The `<id>` of a `step-<id>` URL segment, or undefined when the current route isn't one.
 *
 * react-router 6.4+ only matches a param that fills a whole path segment, so the
 * questionnaire route is `:stepSegment` and the `step-` prefix is stripped here
 * (`step-:id` stopped matching).
 */
export const useStepId = (): string | undefined => {
  const { stepSegment } = useParams();
  return stepSegment?.startsWith(STEP_SEGMENT_PREFIX) ? stepSegment.slice(STEP_SEGMENT_PREFIX.length) : undefined;
};
