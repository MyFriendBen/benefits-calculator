import { useFeatureFlag } from '../Config/configHook';
import NPSInline from './NPSInline';

type NPSWidgetProps = {
  uuid?: string;
};

export default function NPSWidget({ uuid }: NPSWidgetProps) {
  const isNPSEnabled = useFeatureFlag('nps_survey');

  if (!isNPSEnabled) {
    return null;
  }

  return <NPSInline uuid={uuid} />;
}
