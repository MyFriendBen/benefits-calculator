import type { ReactNode, RefObject } from 'react';
import { useBenContext } from './BenContext';

interface BenPanelProps {
  children: ReactNode;
  bodyRef?: RefObject<HTMLDivElement>;
  visible?: boolean;
}

export default function BenPanel({ children, bodyRef, visible = true }: BenPanelProps) {
  const { dispatch } = useBenContext();

  const className = `ben-panel${visible ? ' ben-panel--visible' : ''}`;

  return (
    <aside className={className} aria-label="BenBot - Benefits Guide">
      <div className="ben-panel__header">
        <span className="ben-panel__title">Ben&apos;s got your back</span>
        <button
          className="ben-panel__minimize"
          onClick={() => dispatch({ type: 'SKIP' })}
          aria-label="Minimize BenBot"
          type="button"
        >
          &minus;
        </button>
      </div>
      <div className="ben-panel__body" ref={bodyRef}>
        {children}
      </div>
    </aside>
  );
}
