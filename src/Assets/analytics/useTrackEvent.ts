import { useCallback, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { trackEvent } from './index';
import { Context, DEFAULT_WHITE_LABEL } from '../../Components/Wrapper/Wrapper';
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
  // App chrome (Header/Footer) renders ABOVE the matched route, so useParams()
  // returns no whiteLabel there and chrome events (logo/language/social/feedback/
  // footer links) fired with no screener_state — a state filter dropped 100% of
  // them (gap #2). Wrapper's context holds the whiteLabel parsed from the URL
  // even outside a matched route, so fall back to it. Its "_default" sentinel
  // (no white label resolved yet) is treated as unknown — better a null state
  // than a fake one.
  const contextWhiteLabel = useContext(Context)?.whiteLabel;

  const screenerState =
    whiteLabel ?? (contextWhiteLabel && contextWhiteLabel !== DEFAULT_WHITE_LABEL ? contextWhiteLabel : undefined);

  return useCallback(
    <E extends ScreenerEventName>(event: E, params: ScreenerEventMap[E]) => {
      const context: ScreenerContext = {
        screener_state: screenerState,
        screener_uid: uuid,
      };
      trackEvent(event, { ...context, ...params });
    },
    [screenerState, uuid],
  );
}
