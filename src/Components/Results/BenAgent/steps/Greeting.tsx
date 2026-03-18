import { useResultsContext } from '../../Results';
import { useBenContext } from '../BenContext';
import { formatToUSD } from '../../FormattedValue';
import BenChatBubble from '../BenChatBubble';
import BenQuickReply from '../BenQuickReply';

export default function Greeting() {
  const { programs } = useResultsContext();
  const { dispatch, totalFilteredValue } = useBenContext();

  const programCount = programs.length;
  const formattedValue = formatToUSD(totalFilteredValue);

  const benText = `Hey, I'm BenBot. I found ${programCount} programs you may be eligible for, worth up to ${formattedValue}/year. Want me to help you figure out where to start?`;

  return (
    <div className="ben-step">
      <BenChatBubble>
        <p>
          Hey, I&apos;m Benbot. I found <strong>{programCount} programs</strong> you may be eligible for, worth up to{' '}
          <strong>{formattedValue}/year</strong>. Want me to help you figure out where to start?
        </p>
      </BenChatBubble>
      <div className="ben-quick-reply-row">
        <BenQuickReply
          label="Let's go"
          onClick={() => dispatch({ type: 'GO_TO_STEP', step: 'already_have', benText, userText: "Let's go" })}
        />
        <BenQuickReply
          label="Skip"
          variant="secondary"
          onClick={() => dispatch({ type: 'SKIP', benText, userText: 'Skip' })}
        />
      </div>
    </div>
  );
}
