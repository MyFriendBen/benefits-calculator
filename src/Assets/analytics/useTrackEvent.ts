import { useCallback, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { trackEvent, trackItemList } from './index';
import { Context, DEFAULT_WHITE_LABEL, getUuidFromUrl, getWhiteLabelFromUrl } from '../../Components/Wrapper/Wrapper';
import type { ItemListItem, ItemListName, ScreenerContext, ScreenerEventMap, ScreenerEventName } from './events';

// Resolve the context attached to every screener event. State and uid prefer the
// route params, then Wrapper's context, then the URL — the URL fallback covers
// components whose useParams() doesn't resolve the params, which would otherwise
// fire events with no state and no uid (the downstream join key).
//
// screener_path is the CESN homeowner/renter branch, derived from formPath
// (formData.path, 'renter' for renters). It's CESN-only and defaults to
// 'homeowner' when unset, so the dashboard can split the CESN funnel by path.
function resolveScreenerContext(
  whiteLabel?: string,
  uuid?: string,
  contextWhiteLabel?: string,
  formPath?: string,
): ScreenerContext {
  const urlWhiteLabel = getWhiteLabelFromUrl();
  const screenerState =
    whiteLabel ??
    (contextWhiteLabel && contextWhiteLabel !== DEFAULT_WHITE_LABEL ? contextWhiteLabel : undefined) ??
    (urlWhiteLabel !== DEFAULT_WHITE_LABEL ? urlWhiteLabel : undefined);
  return {
    screener_state: screenerState,
    screener_uid: uuid ?? getUuidFromUrl(),
    screener_path: screenerState === 'cesn' ? (formPath === 'renter' ? 'renter' : 'homeowner') : undefined,
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
  const wrapperContext = useContext(Context);
  const contextWhiteLabel = wrapperContext?.whiteLabel;

  // formData.path is the CESN homeowner/renter branch, persisted on the screening
  // (unlike the ?path= URL param, which only exists on the entry URL).
  const context = resolveScreenerContext(whiteLabel, uuid, contextWhiteLabel, wrapperContext?.formData?.path);
  const screenerState = context.screener_state;
  const screenerUid = context.screener_uid;
  const screenerPath = context.screener_path;

  return useCallback(
    <E extends ScreenerEventName>(event: E, params: ScreenerEventMap[E]) => {
      trackEvent(event, {
        screener_state: screenerState,
        screener_uid: screenerUid,
        // Spread in only on CESN, so non-CESN events don't carry the key at all.
        ...(screenerPath !== undefined ? { screener_path: screenerPath } : {}),
        ...params,
      });
    },
    [screenerState, screenerUid, screenerPath],
  );
}

/**
 * `useTrackEvent`'s counterpart for GA4 view_item_list impressions: returns a
 * `trackItemList(itemListName, items)` with router context attached.
 */
export function useTrackItemList() {
  const { whiteLabel, uuid } = useParams();
  const wrapperContext = useContext(Context);
  const contextWhiteLabel = wrapperContext?.whiteLabel;

  const context = resolveScreenerContext(whiteLabel, uuid, contextWhiteLabel, wrapperContext?.formData?.path);
  const screenerState = context.screener_state;
  const screenerUid = context.screener_uid;
  const screenerPath = context.screener_path;

  return useCallback(
    (itemListName: ItemListName, items: ItemListItem[]) => {
      trackItemList({
        screener_state: screenerState,
        screener_uid: screenerUid,
        // Only present on CESN, matching useTrackEvent.
        ...(screenerPath !== undefined ? { screener_path: screenerPath } : {}),
        item_list_name: itemListName,
        items,
      });
    },
    [screenerState, screenerUid, screenerPath],
  );
}
