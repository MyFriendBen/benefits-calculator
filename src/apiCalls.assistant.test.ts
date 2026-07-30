/**
 * Wire-format tests for the Benbot start call (MFB-1427).
 *
 * Chatbot.test.tsx mocks `apiCalls` wholesale, so it asserts the *arguments* to
 * `startAssistantConversation` and never the request body. Renaming the JSON key to
 * `visible_program` would leave that suite green. These tests cover the actual bytes,
 * which matters most for the `undefined` case: it relies on `JSON.stringify` dropping
 * undefined-valued keys, and nothing else pins that down.
 */
import { startAssistantConversation, AssistantVisibleProgram } from './apiCalls';

const SCREEN_UUID = 'c0ffee00-0000-4000-8000-000000000001';

const SNAP: AssistantVisibleProgram = { name_abbreviated: 'co_snap', value: 6636 };
const WIC: AssistantVisibleProgram = { name_abbreviated: 'co_wic', value: 1224 };

function mockFetch() {
  const fetchMock = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ conversation_id: 'c1', messages: [] }),
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

/** The parsed request body of the most recent fetch call. */
function sentBody(fetchMock: jest.Mock): Record<string, unknown> {
  const [, init] = fetchMock.mock.calls[0];
  return JSON.parse(init.body);
}

describe('startAssistantConversation wire format', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sends visible_programs as name_abbreviated + value objects', async () => {
    const fetchMock = mockFetch();

    await startAssistantConversation(SCREEN_UUID, 'en-US', [SNAP, WIC]);

    expect(sentBody(fetchMock)).toEqual({
      locale: 'en-US',
      visible_programs: [SNAP, WIC],
    });
  });

  it('sends an explicit empty array when the page is showing nothing', async () => {
    const fetchMock = mockFetch();

    await startAssistantConversation(SCREEN_UUID, undefined, []);

    const body = sentBody(fetchMock);
    expect(body).toHaveProperty('visible_programs', []);
  });

  it('omits the key entirely when no list is supplied', async () => {
    // Distinct from []: absent selects benefits-api's server-side fallback filters,
    // while [] asserts an empty results page. JSON.stringify drops undefined values,
    // which is the mechanism — worth pinning since it's invisible at the call site.
    const fetchMock = mockFetch();

    await startAssistantConversation(SCREEN_UUID);

    expect(sentBody(fetchMock)).not.toHaveProperty('visible_programs');
  });

  it('posts to the screen-scoped assistant endpoint', async () => {
    const fetchMock = mockFetch();

    await startAssistantConversation(SCREEN_UUID, 'en-US', [SNAP]);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain(`/api/screens/${SCREEN_UUID}/assistant/conversations/`);
    expect(init.method).toBe('POST');
  });

  it('throws on a non-ok response so the caller can surface an error', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 502,
      statusText: 'Bad Gateway',
    }) as unknown as typeof fetch;

    await expect(startAssistantConversation(SCREEN_UUID, 'en-US', [SNAP])).rejects.toThrow('502');
  });
});
