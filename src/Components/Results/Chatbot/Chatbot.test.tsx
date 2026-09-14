import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ChatbotProvider } from './Chatbot';
import {
  startAssistantConversation,
  getAssistantHistory,
  sendAssistantMessage,
  AssistantVisibleProgram,
} from '../../../apiCalls';

// requireActual so a future import of a third export from apiCalls doesn't silently
// become undefined at runtime.
jest.mock('../../../apiCalls', () => ({
  ...jest.requireActual('../../../apiCalls'),
  startAssistantConversation: jest.fn(),
  getAssistantHistory: jest.fn(),
  sendAssistantMessage: jest.fn(),
}));

jest.mock('../../../Assets/analytics', () => ({
  useTrackEvent: () => jest.fn(),
}));

const mockStart = startAssistantConversation as jest.MockedFunction<typeof startAssistantConversation>;
const mockHistory = getAssistantHistory as jest.MockedFunction<typeof getAssistantHistory>;
const mockSend = sendAssistantMessage as jest.MockedFunction<typeof sendAssistantMessage>;

const SCREEN_UUID = 'c0ffee00-0000-4000-8000-000000000001';

const SNAP = { name_abbreviated: 'co_snap', value: 6636 };
const MEDICAID = { name_abbreviated: 'co_medicaid', value: 5280 };
const WIC = { name_abbreviated: 'co_wic', value: 1224 };

const chatbotUi = (visiblePrograms?: AssistantVisibleProgram[]) => (
  <IntlProvider locale="en" defaultLocale="en">
    <MemoryRouter initialEntries={[`/co/${SCREEN_UUID}/results/benefits`]}>
      <Routes>
        <Route
          path="/:whiteLabel/:uuid/results/benefits"
          element={<ChatbotProvider visiblePrograms={visiblePrograms} />}
        />
      </Routes>
    </MemoryRouter>
  </IntlProvider>
);

const renderChatbot = (visiblePrograms?: AssistantVisibleProgram[]) => render(chatbotUi(visiblePrograms));

/** Open the widget and send a message — the only thing that starts a conversation. */
const openAndSend = async (text = 'hello') => {
  await userEvent.click(screen.getByRole('button', { name: /chat/i }));
  const input = screen.getByRole('textbox');
  await userEvent.type(input, text);
  await userEvent.keyboard('{Enter}');
};

beforeEach(() => {
  jest.clearAllMocks();
  // Auto-open dismissal is remembered per screen in sessionStorage (MFB-1737);
  // clear it so tests don't leak state into each other.
  sessionStorage.clear();
  // jsdom doesn't implement scrollIntoView; the widget calls it on every message.
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
  mockStart.mockResolvedValue({
    conversation_id: 'conv-1',
    screen_uuid: SCREEN_UUID,
    status: 'active',
    mode: 'live',
    prompt_version: 'v3',
    messages: [],
  });
  // No prior conversation is the default; the restore tests below override it.
  mockHistory.mockResolvedValue(null);
  mockSend.mockResolvedValue({
    user_message: { message_id: 'u1', role: 'user', text: 'hello', created_at: '' },
    assistant_message: { message_id: 'a1', role: 'assistant', text: 'hi there', created_at: '' },
  });
});

describe('ChatbotProvider visiblePrograms (MFB-1427)', () => {
  it('sends the rendered program list, with displayed values, when starting a conversation', async () => {
    // BenBot may only recommend from the list it's given and quotes the values in it,
    // so both have to be what the user is actually looking at. Several results-page
    // filters (citizenship, mutual exclusions, per-member insurance) run client-side
    // and can't be reproduced from the server's eligibility snapshot — and the
    // snapshot's value sums all members, including ones already covered.
    renderChatbot([SNAP, MEDICAID, WIC]);

    await openAndSend();

    await waitFor(() => expect(mockStart).toHaveBeenCalled());
    expect(mockStart).toHaveBeenCalledWith(SCREEN_UUID, undefined, [SNAP, MEDICAID, WIC]);
  });

  it('sends an empty list when the results page is showing nothing', async () => {
    // Distinct from omitting the field: an empty results page is the case where the
    // assistant must recommend nothing at all, so it has to be reported explicitly.
    renderChatbot([]);

    await openAndSend();

    await waitFor(() => expect(mockStart).toHaveBeenCalled());
    expect(mockStart).toHaveBeenCalledWith(SCREEN_UUID, undefined, []);
  });

  it('sends undefined — not an empty list — when no programs are passed', async () => {
    // The two are NOT interchangeable to benefits-api: [] asserts "the page is
    // showing nothing" (BenBot recommends nothing), while undefined means "no list
    // available" and selects the server-side fallback filters. Defaulting to []
    // would silently blank the assistant for any caller that omits the prop.
    renderChatbot();

    await openAndSend();

    await waitFor(() => expect(mockStart).toHaveBeenCalled());
    expect(mockStart).toHaveBeenCalledWith(SCREEN_UUID, undefined, undefined);
  });

  it('starts only one conversation across repeated messages', async () => {
    // Threading visiblePrograms into ensureConversation's dependency list must not
    // break the existing dedup (conversationIdRef / startPromiseRef), or every
    // message would open a fresh conversation. Needs two sends — with one, the
    // short-circuit is never exercised.
    renderChatbot([SNAP]);

    await openAndSend('first');
    await waitFor(() => expect(mockSend).toHaveBeenCalledTimes(1));

    await userEvent.type(screen.getByRole('textbox'), 'second');
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(mockSend).toHaveBeenCalledTimes(2));

    expect(mockStart).toHaveBeenCalledTimes(1);
  });

  it('re-posts the list when it changes after the conversation exists (MFB-1737)', async () => {
    // The results subtree no longer remounts on filter changes (Results.tsx), so an
    // open conversation outlives them. The widget re-POSTs the idempotent start
    // endpoint on a list change so ai-service's stored snapshot tracks the screen.
    const { rerender } = render(chatbotUi([SNAP, MEDICAID]));

    await openAndSend();
    // mockSend being dispatched proves ensureConversation resolved, i.e. the
    // conversation id is set — the precondition for a refresh.
    await waitFor(() => expect(mockSend).toHaveBeenCalledTimes(1));

    rerender(chatbotUi([SNAP]));

    await waitFor(() => expect(mockStart).toHaveBeenCalledTimes(2));
    expect(mockStart).toHaveBeenLastCalledWith(SCREEN_UUID, undefined, [SNAP]);
    // A refresh is not a new conversation: no messages were sent.
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it('defers a refresh that lands mid-send until the send completes', async () => {
    // A refresh must not interleave with a message round-trip, but it must not be
    // dropped either — that would leave ai-service's snapshot stale until the next
    // page load.
    let resolveSend!: (value: Awaited<ReturnType<typeof sendAssistantMessage>>) => void;
    mockSend.mockImplementationOnce(() => new Promise((resolve) => (resolveSend = resolve)));

    const { rerender } = render(chatbotUi([SNAP, MEDICAID]));

    await openAndSend();
    await waitFor(() => expect(mockSend).toHaveBeenCalledTimes(1));

    // The send is still in flight; the list change must be queued, not posted.
    rerender(chatbotUi([SNAP]));
    expect(mockStart).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveSend({
        user_message: { message_id: 'u1', role: 'user', text: 'hello', created_at: '' },
        assistant_message: { message_id: 'a1', role: 'assistant', text: 'hi there', created_at: '' },
      });
    });

    await waitFor(() => expect(mockStart).toHaveBeenCalledTimes(2));
    expect(mockStart).toHaveBeenLastCalledWith(SCREEN_UUID, undefined, [SNAP]);
  });
});

describe('auto-open (MFB-1737)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    delete (window as unknown as { matchMedia?: unknown }).matchMedia;
  });

  const mockSmallScreen = () => {
    (window as unknown as { matchMedia: unknown }).matchMedia = jest.fn().mockReturnValue({
      matches: true,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });
  };

  it('opens itself after the delay, without an API call and without stealing focus', () => {
    renderChatbot([SNAP, MEDICAID, WIC]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // The greeting is templated client-side; the conversation (and any model
    // call) starts only when the user replies.
    expect(mockStart).not.toHaveBeenCalled();
    // Auto-open must never steal focus: it would pop the mobile keyboard over
    // the results and yank screen-reader users into the dialog.
    expect(screen.getByRole('textbox')).not.toHaveFocus();
  });

  it('shows a greeting templated from the visible programs', () => {
    renderChatbot([SNAP, MEDICAID, WIC]);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('3 programs');
    expect(dialog).toHaveTextContent('$13,140'); // 6636 + 5280 + 1224, annual
  });

  it('does not auto-open when the results page is showing zero programs', () => {
    // [] means "the page is showing nothing" — a bot with nothing to recommend
    // shouldn't announce itself. undefined ("no list available") still opens.
    renderChatbot([]);

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('still auto-opens, with the generic welcome, when no list is available', () => {
    renderChatbot(undefined);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByRole('dialog')).toHaveTextContent(/help you understand your benefits/i);
  });

  it('stays closed once dismissed, including across remounts of the same screen', () => {
    const { unmount } = renderChatbot([SNAP]);
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    fireEvent.click(screen.getByRole('button', { name: /close chat/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(10000);
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Remount (e.g. navigating to a program page and back) must respect the
    // dismissal — this is what sessionStorage is for.
    unmount();
    renderChatbot([SNAP]);
    act(() => {
      jest.advanceTimersByTime(10000);
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('auto-opens to the peek state on small screens and expands on input focus', () => {
    mockSmallScreen();
    renderChatbot([SNAP]);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByRole('dialog').className).toContain('chatbot-panel--peek');
    expect(screen.getByRole('button', { name: /expand chat/i })).toBeInTheDocument();

    fireEvent.focus(screen.getByRole('textbox'));

    expect(screen.getByRole('dialog').className).not.toContain('chatbot-panel--peek');
    expect(screen.queryByRole('button', { name: /expand chat/i })).not.toBeInTheDocument();
  });
});

describe('ChatbotProvider history restore', () => {
  const priorConversation = {
    conversation_id: 'conv-prior',
    screen_uuid: SCREEN_UUID,
    status: 'active',
    mode: 'live',
    prompt_version: 'v3',
    messages: [
      { message_id: 'm1', role: 'user' as const, text: 'what about WIC?', created_at: '' },
      { message_id: 'm2', role: 'assistant' as const, text: 'here is how WIC works', created_at: '' },
    ],
  };

  const open = () => userEvent.click(screen.getByRole('button', { name: /chat/i }));

  it('shows a returning household their transcript when the widget opens', async () => {
    // The emailed results link brings them back to the same screen_uuid, so their
    // conversation is still on the server. Before this, nothing fetched it until they
    // sent another message, so they landed on the generic welcome.
    mockHistory.mockResolvedValue(priorConversation);
    renderChatbot([SNAP]);

    await open();

    expect(await screen.findByText('what about WIC?')).toBeInTheDocument();
    expect(screen.getByText('here is how WIC works')).toBeInTheDocument();
  });

  it('reads history without starting a conversation', async () => {
    // The whole point of the separate read endpoint: the widget opens on nearly every
    // results page, and the start call would mint an empty conversation for every
    // visitor who never types.
    mockHistory.mockResolvedValue(priorConversation);
    renderChatbot([SNAP]);

    await open();
    await screen.findByText('what about WIC?');

    expect(mockStart).not.toHaveBeenCalled();
  });

  it('still calls the start endpoint on the first message, so context is refreshed', async () => {
    // The regression guard for the tempting optimization: caching the restored
    // conversation_id would make ensureConversation return early and skip the start
    // call — which is what refreshes ai-service's stored context snapshot. A returning
    // household's assistant would then reason from the program list as it was on their
    // last visit, which is the MFB-1427 failure via the back door.
    mockHistory.mockResolvedValue(priorConversation);
    renderChatbot([SNAP, WIC]);

    await open();
    await screen.findByText('what about WIC?');
    await userEvent.type(screen.getByRole('textbox'), 'and SNAP?');
    await userEvent.keyboard('{Enter}');

    await waitFor(() => expect(mockStart).toHaveBeenCalledWith(SCREEN_UUID, undefined, [SNAP, WIC]));
  });

  it('leaves the welcome in place when there is no history', async () => {
    mockHistory.mockResolvedValue(null);
    renderChatbot([SNAP]);

    await open();

    await waitFor(() => expect(mockHistory).toHaveBeenCalled());
    expect(screen.queryByText('what about WIC?')).not.toBeInTheDocument();
  });

  it('survives a failed history read without surfacing an error', async () => {
    // Best-effort: a failed restore should look exactly like having no history, not
    // like a broken assistant.
    mockHistory.mockRejectedValue(new Error('500 Server Error'));
    renderChatbot([SNAP]);

    await open();

    await waitFor(() => expect(mockHistory).toHaveBeenCalled());
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
  });

  it('does not drop a message the user sent before history arrived', async () => {
    // A fast first send can land before the read resolves; overwriting state at that
    // point would discard what they just typed.
    let resolveHistory: (value: typeof priorConversation) => void = () => {};
    mockHistory.mockReturnValue(
      new Promise((resolve) => {
        resolveHistory = resolve;
      }),
    );
    renderChatbot([SNAP]);

    await open();
    await userEvent.type(screen.getByRole('textbox'), 'urgent question');
    await userEvent.keyboard('{Enter}');
    await screen.findByText('urgent question');

    resolveHistory(priorConversation);

    await waitFor(() => expect(screen.getByText('urgent question')).toBeInTheDocument());
    expect(screen.queryByText('what about WIC?')).not.toBeInTheDocument();
  });

  it('reads history once per mount, not on every open', async () => {
    mockHistory.mockResolvedValue(priorConversation);
    renderChatbot([SNAP]);

    await open();
    await screen.findByText('what about WIC?');
    await userEvent.click(screen.getByRole('button', { name: /close/i }));
    await open();

    expect(mockHistory).toHaveBeenCalledTimes(1);
  });
});
