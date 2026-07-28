import { useCallback, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { trackEvent, trackItemList } from './index';
import { Context, DEFAULT_WHITE_LABEL, getUuidFromUrl, getWhiteLabelFromUrl } from '../../Components/Wrapper/Wrapper';
import type { ItemListItem, ItemListName, ScreenerContext, ScreenerEventMap, ScreenerEventName } from './events';

// Resolve screener_state / screener_uid for an event's context. Prefer the route
// params, then Wrapper's context, then parse the URL directly. The URL fallback
// covers components (e.g. results-page children) whose useParams() doesn't resolve
// the params even though they're present in the path — without it those events
// fire with no state AND no uid (the downstream join key).
function resolveScreenerContext(whiteLabel?: string, uuid?: string, contextWhiteLabel?: string): ScreenerContext {
  const urlWhiteLabel = getWhiteLabelFromUrl();
  return {
    screener_state:
      whiteLabel ??
      (contextWhiteLabel && contextWhiteLabel !== DEFAULT_WHITE_LABEL ? contextWhiteLabel : undefined) ??
      (urlWhiteLabel !== DEFAULT_WHITE_LABEL ? urlWhiteLabel : undefined),
    screener_uid: uuid ?? getUuidFromUrl(),
  };
}

/**
 * Returns a `track` function that emits a typed screener event with router
 * context (`screener_state`, `screener_uid`) attached automatically.
 *
 * Usage:
 *   const track = useTrackEvent();
 *   track('screener_apply_click', { program_id: String(program.program_id), url });
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
  const contextWhiteLabel = useContext(Context)?.whiteLabel;

  const context = resolveScreenerContext(whiteLabel, uuid, contextWhiteLabel);
  const screenerState = context.screener_state;
  const screenerUid = context.screener_uid;

  return useCallback(
    <E extends ScreenerEventName>(event: E, params: ScreenerEventMap[E]) => {
      trackEvent(event, { screener_state: screenerState, screener_uid: screenerUid, ...params });
    },
    [screenerState, screenerUid],
  );
}

/**
 * `useTrackEvent`'s counterpart for GA4 view_item_list impressions: returns a
 * `trackItemList(itemListName, items)` with router context attached.
 */
export function useTrackItemList() {
  const { whiteLabel, uuid } = useParams();
  const contextWhiteLabel = useContext(Context)?.whiteLabel;

  const context = resolveScreenerContext(whiteLabel, uuid, contextWhiteLabel);
  const screenerState = context.screener_state;
  const screenerUid = context.screener_uid;

  return useCallback(
    (itemListName: ItemListName, items: ItemListItem[]) => {
      trackItemList({
        screener_state: screenerState,
        screener_uid: screenerUid,
        item_list_name: itemListName,
        items,
      });
    },
    [screenerState, screenerUid],
  );
}
