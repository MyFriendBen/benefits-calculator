import { useEffect, useRef, useState } from 'react';
import { useBenContext } from './BenContext';
import BenPanel from './BenPanel';
import BenFAB from './BenFAB';
import BenHistory from './BenHistory';
import Greeting from './steps/Greeting';
import AlreadyHaveFilter from './steps/AlreadyHaveFilter';
import ConfirmHide from './steps/ConfirmHide';
import HideOthers from './steps/HideOthers';
import './BenAgent.css';

function StepContent() {
  const { state } = useBenContext();

  switch (state.step) {
    case 'greeting':
      return <Greeting />;
    case 'already_have':
      return <AlreadyHaveFilter />;
    case 'confirm_hide':
      return <ConfirmHide />;
    case 'hide_others':
      return <HideOthers />;
    default:
      return null;
  }
}

export default function BenAgent() {
  const { state } = useBenContext();
  const panelBodyRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  // Slide the panel open after a short delay on first render
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const el = panelBodyRef.current;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [state.step, state.categoryIndex, state.history.length]);

  if (state.step === 'minimized') {
    return <BenFAB />;
  }

  return (
    <BenPanel bodyRef={panelBodyRef} visible={visible}>
      <BenHistory history={state.history} />
      <StepContent />
    </BenPanel>
  );
}
