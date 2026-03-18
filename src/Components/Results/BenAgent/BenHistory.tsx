import type { BenHistoryItem } from './benTypes';
import BenChatBubble from './BenChatBubble';

interface BenHistoryProps {
  history: BenHistoryItem[];
}

export default function BenHistory({ history }: BenHistoryProps) {
  if (history.length === 0) return null;

  return (
    <div className="ben-history">
      {history.map((item, index) => (
        <div key={index} className="ben-history__exchange">
          <BenChatBubble>
            <p>{item.benText}</p>
          </BenChatBubble>
          <BenChatBubble variant="user">
            <p>{item.userText}</p>
          </BenChatBubble>
        </div>
      ))}
    </div>
  );
}
