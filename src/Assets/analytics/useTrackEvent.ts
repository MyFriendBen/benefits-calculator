import { useCallback, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { trackEvent, trackItemList } from './index';
import { Context, DEFAULT_WHITE_LABEL, getUuidFromUrl, getWhiteLabelFromUrl } from '../../Components/Wrapper/Wrapper';
import type { ItemListItem, ItemListName, ScreenerContext, ScreenerEventMap, ScreenerEventName } from './events';

// Resolve screener_state / screener_uid / screener_path for an event's context.
// Prefer the route params, then Wrapper's context, then parse the URL directly.
// The URL fallback covers components (e.g. results-page children) whose useParams()
// doesn't resolve the params even though they're present in the path — without it
// those events fire with no state AND no uid (the downstream join key).
//
// screener_path is CESN-only: the energy flow branches into a homeowner and a
// renter path (formData.path === 'renter' for renters, unset for homeowners),
// chosen on the landing page before the first step. Attaching it here means every
// CESN event carries the path — including events before the paths visibly diverge —
// so the dashboard can split the CESN funnel by path even for early drop-offs. It
// is omitted entirely for non-CESN screeners.
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
  // CESN homeowner/renter branch, persisted on the screening (survives across
  // steps, unlike the ?path= URL param which only exists on the entry URL).
  const formPath = wrapperContext?.formData?.path;

  const context = resolveScreenerContext(whiteLabel, uuid, contextWhiteLabel, formPath);
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
