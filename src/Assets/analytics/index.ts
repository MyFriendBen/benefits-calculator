import TagManager from 'react-gtm-module';
import type { ScreenerContext, ScreenerEventMap, ScreenerEventName } from './events';

export type { ScreenerEventName } from './events';
export { useTrackEvent } from './useTrackEvent';

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
export function trackEvent<E extends ScreenerEventName>(
  event: E,
  params: ScreenerEventMap[E] & ScreenerContext,
) {
  dataLayerPush({ event, ...params });
}

export function initializeGTM() {
  const gtmId = process.env.REACT_APP_GOOGLE_ANALYTICS_ID;
  if (gtmId) {
    TagManager.initialize({ gtmId });
  } else {
    console.error('REACT_APP_GOOGLE_ANALYTICS_ID is not defined. Google Tag Manager will not be initialized.');
  }
}
