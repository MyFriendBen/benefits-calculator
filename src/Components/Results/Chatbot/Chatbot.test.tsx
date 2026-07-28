import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ChatbotProvider } from './Chatbot';
import { startAssistantConversation, sendAssistantMessage, AssistantVisibleProgram } from '../../../apiCalls';

jest.mock('../../../apiCalls', () => ({
  startAssistantConversation: jest.fn(),
  sendAssistantMessage: jest.fn(),
}));

jest.mock('../../../Assets/analytics', () => ({
  useTrackEvent: () => jest.fn(),
}));

const mockStart = startAssistantConversation as jest.MockedFunction<typeof startAssistantConversation>;
const mockSend = sendAssistantMessage as jest.MockedFunction<typeof sendAssistantMessage>;

const SCREEN_UUID = 'c0ffee00-0000-4000-8000-000000000001';

const SNAP = { name_abbreviated: 'co_snap', value: 6636 };
const MEDICAID = { name_abbreviated: 'co_medicaid', value: 5280 };
const WIC = { name_abbreviated: 'co_wic', value: 1224 };

const renderChatbot = (visiblePrograms?: AssistantVisibleProgram[]) =>
  render(
    <IntlProvider locale="en" defaultLocale="en">
      <MemoryRouter initialEntries={[`/co/${SCREEN_UUID}/results/benefits`]}>
        <Routes>
          <Route
            path="/:whiteLabel/:uuid/results/benefits"
            element={<ChatbotProvider visiblePrograms={visiblePrograms} />}
          />
        </Routes>
      </MemoryRouter>
    </IntlProvider>,
  );

/** Open the widget and send a message — the only thing that starts a conversation. */
const openAndSend = async (text = 'hello') => {
  await userEvent.click(screen.getByRole('button', { name: /chat/i }));
  const input = screen.getByRole('textbox');
  await userEvent.type(input, text);
  await userEvent.keyboard('{Enter}');
};

beforeEach(() => {
  jest.clearAllMocks();
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

  // Known limitation, deliberately untested here: ensureConversation short-circuits
  // on conversationIdRef, so changing a results-page filter mid-session does NOT
  // re-post the narrowed list — it takes effect on the next page load, when the ref
  // is null again and ai-service refreshes the stored context. Asserting it needs a
  // remount, which resets the widget's open state and makes the test about jsdom
  // rather than about the behavior. Documented in ChatbotProvider instead.
});
