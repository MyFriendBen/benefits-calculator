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
// screener_path is the CESN homeowner/renter branch, from formData.path. The
// landing page sets it to 'renter' or 'default' (the homeowner path), so those
// map to 'renter' / 'homeowner'. Any other value — including undefined when the
// path was never resolved — stays unset rather than being fabricated as a
// homeowner, so the dashboard can tell a real homeowner from an unknown. CESN-only.
//
// screener_referrer is formData.immutableReferrer, set from the entry URL before
// any step renders, so it rides on the pre-uid steps too. Empty means none. The
// URL accepts any text, so only code-shaped values reach GA4: anything else
// (an email, a name, a phone number) is dropped rather than sent.
const REFERRER_CODE_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

function resolveScreenerContext(
  whiteLabel?: string,
  uuid?: string,
  contextWhiteLabel?: string,
  formPath?: string,
  referrer?: string,
): ScreenerContext {
  const urlWhiteLabel = getWhiteLabelFromUrl();
  const screenerState =
    whiteLabel ??
    (contextWhiteLabel && contextWhiteLabel !== DEFAULT_WHITE_LABEL ? contextWhiteLabel : undefined) ??
    (urlWhiteLabel !== DEFAULT_WHITE_LABEL ? urlWhiteLabel : undefined);
  const screenerPath = formPath === 'renter' ? 'renter' : formPath === 'default' ? 'homeowner' : undefined;
  return {
    screener_state: screenerState,
    screener_uid: uuid ?? getUuidFromUrl(),
    screener_path: screenerState === 'cesn' ? screenerPath : undefined,
    screener_referrer: referrer && REFERRER_CODE_PATTERN.test(referrer) ? referrer : undefined,
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
  const context = resolveScreenerContext(
    whiteLabel,
    uuid,
    contextWhiteLabel,
    wrapperContext?.formData?.path,
    wrapperContext?.formData?.immutableReferrer,
  );
  const screenerState = context.screener_state;
  const screenerUid = context.screener_uid;
  const screenerPath = context.screener_path;
  const screenerReferrer = context.screener_referrer;

  return useCallback(
    <E extends ScreenerEventName>(event: E, params: ScreenerEventMap[E]) => {
      trackEvent(event, {
        screener_state: screenerState,
        screener_uid: screenerUid,
        // Spread in only on CESN, so non-CESN events don't carry the key at all.
        ...(screenerPath !== undefined ? { screener_path: screenerPath } : {}),
        // Only when entered with ?referrer=, so other events don't carry an empty key.
        ...(screenerReferrer !== undefined ? { screener_referrer: screenerReferrer } : {}),
        ...params,
      });
    },
    [screenerState, screenerUid, screenerPath, screenerReferrer],
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

  const context = resolveScreenerContext(
    whiteLabel,
    uuid,
    contextWhiteLabel,
    wrapperContext?.formData?.path,
    wrapperContext?.formData?.immutableReferrer,
  );
  const screenerState = context.screener_state;
  const screenerUid = context.screener_uid;
  const screenerPath = context.screener_path;
  const screenerReferrer = context.screener_referrer;

  return useCallback(
    (itemListName: ItemListName, items: ItemListItem[]) => {
      trackItemList({
        screener_state: screenerState,
        screener_uid: screenerUid,
        // Only present on CESN, matching useTrackEvent.
        ...(screenerPath !== undefined ? { screener_path: screenerPath } : {}),
        // Only when entered with ?referrer=, so other events don't carry an empty key.
        ...(screenerReferrer !== undefined ? { screener_referrer: screenerReferrer } : {}),
        item_list_name: itemListName,
        items,
      });
    },
    [screenerState, screenerUid, screenerPath, screenerReferrer],
  );
}
