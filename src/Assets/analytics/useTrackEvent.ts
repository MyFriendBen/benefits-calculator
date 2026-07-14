import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { trackEvent } from './index';
import type { ScreenerContext, ScreenerEventMap, ScreenerEventName } from './events';

/**
 * Returns a `track` function that emits a typed screener event with router
 * context (`screener_state`, `screener_uid`) attached automatically.
 *
 * Usage:
 *   const track = useTrackEvent();
 *   track('screener_apply_click', { program_name: program.name.default_message });
 *
 * Call sites only pass the event-specific params — screener_state / screener_uid
 * come from the route, so they're consistent on every event and no component
 * has to thread them through. `screener_uid` is the join key used downstream
 * (dbt/Metabase) for per-screening funnels and any sensitive segmentation, so
 * it must be present on every event — attaching it here guarantees that.
 */
export function useTrackEvent() {
  // These are the route params on all screener pages: /:whiteLabel/:uuid/...
  const { whiteLabel, uuid } = useParams();

  return useCallback(
    <E extends ScreenerEventName>(event: E, params: ScreenerEventMap[E]) => {
      const context: ScreenerContext = {
        screener_state: whiteLabel,
        screener_uid: uuid,
      };
      trackEvent(event, { ...context, ...params });
    },
    [whiteLabel, uuid],
  );
}
