import TagManager from 'react-gtm-module';
import type { ItemListItem, ItemListName, ScreenerContext, ScreenerEventMap, ScreenerEventName } from './events';

export type { ScreenerEventName } from './events';
export type { ItemListItem, ItemListName } from './events';
export { useTrackEvent, useTrackItemList } from './useTrackEvent';

/**
 * Low-level push to the GTM dataLayer. Prefer `useTrackEvent` for screener
 * events so router context (screener_state / screener_uid) is attached and the
 * payload is type-checked. This raw form remains for the few pre-existing
 * events (`config`, `outbound_click`, page views) that don't need that context.
 */
export default function dataLayerPush<T>(obj: T) {
  if (window.dataLayer === undefined) {
    console.error('Analytics are not working');
    return;
  }
  window.dataLayer.push(obj);
}

/**
 * Emit a typed screener analytics event. The event name must be a key of
 * `ScreenerEventMap`, and `params` must match that event's declared payload —
 * a missing or misnamed param is a compile error.
 *
 * Most call sites should use the `useTrackEvent` hook instead, which wraps this
 * and injects `ScreenerContext` automatically. Use this function directly only
 * where router context isn't available and you pass context explicitly.
 */
export function trackEvent<E extends ScreenerEventName>(event: E, params: ScreenerEventMap[E] & ScreenerContext) {
  dataLayerPush({ event, ...params });
}

/**
 * Emit a GA4 ecommerce `view_item_list` impression. The payload nests under
 * `ecommerce` (not flat like `trackEvent`) so GA4 populates the native items
 * RECORD; a `{ ecommerce: null }` clear is pushed first so a prior event's items
 * can't merge in. Prefer `useTrackItemList` at call sites for router context.
 */
export function trackItemList(params: { item_list_name: ItemListName; items: ItemListItem[] } & ScreenerContext) {
  const { item_list_name, items, ...context } = params;
  // Nothing was shown — don't emit an impression. GA4 fabricates a single
  // all-"(not set)" item for a view_item_list sent with an empty items array,
  // which then reads downstream as a phantom program/resource.
  if (items.length === 0) {
    return;
  }
  // Clear any ecommerce object left on the dataLayer so items don't merge.
  dataLayerPush({ ecommerce: null });
  dataLayerPush({
    event: 'view_item_list',
    ...context,
    ecommerce: { item_list_name, items },
  });
}

export function initializeGTM() {
  const gtmId = process.env.REACT_APP_GOOGLE_ANALYTICS_ID;
  if (gtmId) {
    TagManager.initialize({ gtmId });
  } else {
    console.error('REACT_APP_GOOGLE_ANALYTICS_ID is not defined. Google Tag Manager will not be initialized.');
  }
}
