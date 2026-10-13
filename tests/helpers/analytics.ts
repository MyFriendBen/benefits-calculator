import { Page } from '@playwright/test';

// Reads the GTM dataLayer that the screener pushes analytics events onto. Tests
// assert on these pushes directly — the same layer GTM relays to GA4 — so they
// verify the FE emits the right event/params without needing GA4 or BigQuery.

export type DataLayerEvent = Record<string, unknown> & { event?: string };

export async function getDataLayer(page: Page): Promise<DataLayerEvent[]> {
  return page.evaluate(() => ((window as any).dataLayer ?? []) as DataLayerEvent[]);
}

// All pushes for a given event name, oldest first.
export async function getEvents(page: Page, eventName: string): Promise<DataLayerEvent[]> {
  const layer = await getDataLayer(page);
  return layer.filter((e) => e.event === eventName);
}

// The most recent push for an event name (or undefined if none yet).
export async function lastEvent(page: Page, eventName: string): Promise<DataLayerEvent | undefined> {
  const events = await getEvents(page, eventName);
  return events[events.length - 1];
}
