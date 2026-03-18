import { useBenContext } from '../BenContext';
import { formatToUSD, programValue } from '../../FormattedValue';
import BenChatBubble from '../BenChatBubble';
import BenQuickReply from '../BenQuickReply';
import type { SortLens } from '../benTypes';

const RATIONALE: Record<
  SortLens,
  (program: { name: string; value: string; appTime: string; deliveryTime: string }) => string
> = {
  highest_value: (p) => `It has the highest estimated value of your eligible programs at ${p.value}/year.`,
  quickest_apply: (p) => `The application typically takes ${p.appTime} and you can start online.`,
  most_likely: () => `Based on what you told me, this one looks like a strong match.`,
  quickest_receive: (p) => `Most people receive benefits within ${p.deliveryTime}.`,
};

export default function Recommendation() {
  const { topRecommendation, state, dispatch } = useBenContext();

  if (!topRecommendation || !state.selectedLens) {
    return null;
  }

  const name = topRecommendation.name.default_message;
  const value = formatToUSD(programValue(topRecommendation));
  const appTime = topRecommendation.estimated_application_time.default_message || 'a few minutes';
  const deliveryTime = topRecommendation.estimated_delivery_time.default_message || 'a few weeks';

  const rationale = RATIONALE[state.selectedLens]({ name, value, appTime, deliveryTime });

  return (
    <div className="ben-step">
      <BenChatBubble>
        <p>
          I&apos;d recommend starting with <strong>{name}</strong>. {rationale}
        </p>
      </BenChatBubble>
      <div className="ben-recommendation-card">
        <div className="ben-recommendation-card__name">{name}</div>
        <div className="ben-recommendation-card__value">{value}/year</div>
        {topRecommendation.apply_button_link.default_message && (
          <a
            className="ben-recommendation-card__apply"
            href={topRecommendation.apply_button_link.default_message}
            target="_blank"
            rel="noopener noreferrer"
          >
            Start here
          </a>
        )}
      </div>
      <div className="ben-quick-reply-row">
        <BenQuickReply label="Show me all" onClick={() => dispatch({ type: 'SKIP' })} />
      </div>
    </div>
  );
}
