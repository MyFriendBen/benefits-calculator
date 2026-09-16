import { createContext, useContext, useState, useRef, useEffect, useCallback, useMemo, PropsWithChildren } from 'react';
import { useParams } from 'react-router-dom';
import ChatIcon from '@mui/icons-material/Chat';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import { FormattedMessage, useIntl } from 'react-intl';
import { parseMarkdown } from '../../../utils/parseMarkdown';
import {
  startAssistantConversation,
  getAssistantHistory,
  sendAssistantMessage,
  AssistantApiMessage,
  AssistantVisibleProgram,
} from '../../../apiCalls';
import { useTrackEvent } from '../../../Assets/analytics';
import './Chatbot.css';

type Message = {
  role: 'user' | 'bot';
  text: string;
};

// The API uses role 'assistant'; the widget renders it as 'bot'.
function toWidgetMessage(m: AssistantApiMessage): Message {
  return { role: m.role === 'assistant' ? 'bot' : 'user', text: m.text };
}

function newClientMessageId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// MFB-1737: the widget opens itself instead of waiting behind a button, but the
// results page gets the first impression — this is how long it keeps it.
const AUTO_OPEN_DELAY_MS = 2000;

const dismissalKey = (uuid: string) => `benbot-dismissed-${uuid}`;

// Dismissal is remembered per screen for the tab session so remounts and
// back-navigation don't re-open a widget the user closed. sessionStorage can
// throw (private windows, storage disabled); treat that as "not dismissed" and
// accept the worst case of one extra auto-open.
function wasDismissed(uuid: string): boolean {
  try {
    return sessionStorage.getItem(dismissalKey(uuid)) === '1';
  } catch {
    return false;
  }
}

function rememberDismissal(uuid: string): void {
  try {
    sessionStorage.setItem(dismissalKey(uuid), '1');
  } catch {
    // best-effort
  }
}

// On small screens the full panel covers the results the user just earned, so
// auto-open lands in the partial-height "peek" state instead. Guarded because
// jsdom has no matchMedia.
function isSmallScreen(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 767px)').matches;
}

type ChatbotContextType = {
  openWithMessage: (message: string) => void;
};

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export function useChatbotContext() {
  const context = useContext(ChatbotContext);
  if (context === undefined) {
    throw new Error('useChatbotContext must be used within a ChatbotProvider');
  }
  return context;
}

function renderFormattedMessage(text: string): React.ReactNode {
  const PRIMARY_COLOR =
    getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim() || '#1976d2';
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let bulletBuffer: string[] = [];
  let paragraphBuffer: string[] = [];
  let key = 0;

  const flushBullets = () => {
    if (bulletBuffer.length === 0) return;
    elements.push(
      <ul key={key++} className="chatbot-list">
        {bulletBuffer.map((item, j) => (
          <li key={j}>{parseMarkdown(item, PRIMARY_COLOR)}</li>
        ))}
      </ul>,
    );
    bulletBuffer = [];
  };

  const flushParagraph = () => {
    if (paragraphBuffer.length === 0) return;
    const paragraphKey = key++;
    elements.push(
      <p key={paragraphKey} className="chatbot-paragraph">
        {paragraphBuffer.map((line, j) => (
          <span key={j}>
            {j > 0 && <br />}
            {parseMarkdown(line, PRIMARY_COLOR)}
          </span>
        ))}
      </p>,
    );
    paragraphBuffer = [];
  };

  for (const line of lines) {
    // Accept both "* " and "- " bullets (the model may emit either).
    if (line.startsWith('* ') || line.startsWith('- ')) {
      flushParagraph();
      bulletBuffer.push(line.slice(2));
    } else if (line === '') {
      flushBullets();
      flushParagraph();
    } else {
      flushBullets();
      paragraphBuffer.push(line);
    }
  }
  flushBullets();
  flushParagraph();

  return elements;
}

type ChatbotProviderProps = {
  /**
   * Every program currently rendered on the results page — i.e. what survived the
   * results-page filters (legal status, mutual exclusions, already_has, zero value) —
   * with each value as displayed. BenBot may only recommend from the list it's given
   * and quotes the values in it, so this is what keeps both equal to what the user is
   * looking at.
   *
   * Passed in rather than read from ResultsContext because Results.tsx imports this
   * module; consuming the context here would close an import cycle.
   *
   * Left `undefined` rather than defaulted to `[]` on purpose — the two mean
   * different things to benefits-api. `[]` asserts "the results page is showing
   * nothing", which makes BenBot recommend nothing at all; `undefined` means "no
   * list available", which selects the server-side fallback filters.
   *
   * MFB-1737: the results subtree no longer remounts on filter changes (see the
   * resultsContextValue note in Results.tsx), so an open conversation now outlives
   * them. To keep ai-service's stored snapshot equal to what's on screen, a change
   * to this list re-POSTs the start endpoint once a conversation exists — it is
   * idempotent per screen and refreshes the context on resume. See the
   * context-refresh effect below.
   */
  visiblePrograms?: AssistantVisibleProgram[];
};

export function ChatbotProvider({ visiblePrograms, children }: PropsWithChildren<ChatbotProviderProps>) {
  const { uuid } = useParams();
  // 'peek' is a partial-height panel used by auto-open on small screens: the
  // greeting and input are visible, the results stay visible behind it, and any
  // engagement expands to 'full'.
  const [panel, setPanel] = useState<'closed' | 'peek' | 'full'>('closed');
  const isOpen = panel !== 'closed';
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const conversationIdRef = useRef<string | null>(null);
  const startPromiseRef = useRef<Promise<string | null> | null>(null);
  const sendingRef = useRef(false);
  const { formatMessage, formatNumber } = useIntl();
  const track = useTrackEvent();

  // Displayed program values are annual whole dollars (see visiblePrograms).
  const totalAnnualValue = useMemo(
    () => (visiblePrograms ?? []).reduce((sum, program) => sum + program.value, 0),
    [visiblePrograms],
  );

  const errorMessage = formatMessage({
    id: 'chatbot.error',
    defaultMessage: 'Sorry, something went wrong. Please try again.',
  });

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending, scrollToBottom]);

  // Focus the input only after a deliberate open or expand — never on auto-open,
  // where stealing focus would pop the mobile keyboard over the results and yank
  // screen-reader users into the dialog before they've heard their results.
  const pendingFocusRef = useRef(false);
  useEffect(() => {
    if (panel !== 'closed' && pendingFocusRef.current) {
      pendingFocusRef.current = false;
      inputRef.current?.focus();
    }
  }, [panel]);

  // Auto-open (MFB-1737), replacing the old "Guide Me" button: open shortly after
  // the results render — peek on small screens, full panel on large ones. Skipped
  // when the page is showing zero programs (a bot with nothing to recommend
  // shouldn't announce itself; `undefined` means "no list available" and still
  // opens with the generic welcome) and when the user dismissed it for this
  // screen. A manual open first changes `panel`, which cancels the timer.
  useEffect(() => {
    if (panel !== 'closed') return;
    if (!uuid || wasDismissed(uuid)) return;
    if (visiblePrograms !== undefined && visiblePrograms.length === 0) return;
    const timer = setTimeout(() => {
      setPanel(isSmallScreen() ? 'peek' : 'full');
      track('screener_benbot_opened', { entry: 'auto' });
    }, AUTO_OPEN_DELAY_MS);
    return () => clearTimeout(timer);
  }, [panel, uuid, visiblePrograms, track]);

  // Restore a returning household's transcript when the widget opens.
  //
  // The emailed results link brings them back to the same screen_uuid, so their
  // conversation is still there — but nothing used to fetch it until they sent a
  // message, so they landed on the generic welcome and their history appeared all at
  // once above their next question. This reads it on open instead.
  //
  // Two deliberate choices:
  //
  // 1. It does NOT set `conversationIdRef`. That looks like an obvious optimization
  //    (we know the id now, so why let the next send POST the start endpoint again?)
  //    and it would be a bug: `ensureConversation` returns early when the ref is set,
  //    and the start call is what refreshes ai-service's stored context snapshot.
  //    Skipping it would leave a returning household's assistant reasoning from the
  //    program list as it was on their last visit — the MFB-1427 failure, reintroduced
  //    through the back door. The start call on their first message returns this same
  //    history, so nothing is duplicated and nothing is lost.
  // 2. It only fills an EMPTY transcript. A fast first send can land before this
  //    resolves, and overwriting state at that point would drop the message the user
  //    just typed.
  //
  // Best-effort: a failure here leaves the welcome exactly as it was before, so it
  // deliberately emits no error event.
  const historyRequestedRef = useRef(false);
  useEffect(() => {
    if (panel === 'closed' || historyRequestedRef.current || !uuid) return;
    historyRequestedRef.current = true;
    getAssistantHistory(uuid)
      .then((conversation) => {
        if (!conversation || conversation.messages.length === 0) return;
        const restored = conversation.messages.map(toWidgetMessage);
        setMessages((prev) => (prev.length === 0 ? restored : prev));
      })
      .catch(() => {});
  }, [panel, uuid]);

  // Start (or reuse) the conversation; returns the conversation id, or null on failure.
  // Deduped via startPromiseRef so concurrent opens/sends don't create two conversations.
  const ensureConversation = useCallback(async (): Promise<string | null> => {
    if (conversationIdRef.current) return conversationIdRef.current;
    if (!uuid) return null;
    if (!startPromiseRef.current) {
      startPromiseRef.current = startAssistantConversation(uuid, undefined, visiblePrograms)
        .then((res) => {
          conversationIdRef.current = res.conversation_id;
          setMessages(res.messages.map(toWidgetMessage));
          return res.conversation_id;
        })
        .catch(() => null) // error surfaced by the caller (sendMessage), not here
        .finally(() => {
          startPromiseRef.current = null;
        });
    }
    return startPromiseRef.current;
  }, [uuid, errorMessage, visiblePrograms]);

  // Context refresh (MFB-1737): once a conversation exists, a change in the
  // rendered program list (a results-page filter) re-POSTs the start endpoint so
  // ai-service's stored snapshot tracks what the user is actually looking at.
  // Idempotent per screen; benefits-api refuses to overwrite a good snapshot with
  // an empty list. Best-effort — the next page load re-syncs anyway.
  //
  // A refresh must not interleave with a message round-trip, so a change that
  // lands mid-send is queued and flushed when the send finishes (dropping it
  // would leave the snapshot stale until the next page load). The ref carries
  // the LATEST list so the flush never re-posts an already-superseded one.
  const visibleProgramsRef = useRef(visiblePrograms);
  useEffect(() => {
    visibleProgramsRef.current = visiblePrograms;
  });

  const pendingRefreshRef = useRef(false);

  const refreshContext = useCallback(() => {
    if (!conversationIdRef.current || !uuid) return;
    startAssistantConversation(uuid, undefined, visibleProgramsRef.current).catch(() => {});
  }, [uuid]);

  useEffect(() => {
    if (!conversationIdRef.current || !uuid) return;
    if (sendingRef.current) {
      pendingRefreshRef.current = true;
      return;
    }
    refreshContext();
  }, [uuid, visiblePrograms, refreshContext]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (sendingRef.current) return; // ignore overlapping sends
      sendingRef.current = true;
      setIsSending(true);
      try {
        const conversationId = await ensureConversation();
        setMessages((prev) => [...prev, { role: 'user', text }]);
        if (!conversationId || !uuid) {
          setMessages((prev) => [...prev, { role: 'bot', text: errorMessage }]);
          track('screener_benbot_error', {});
          return;
        }
        // Fire after the guard so this counts messages actually dispatched to
        // the backend, not failed attempts (which emit screener_benbot_error).
        track('screener_benbot_message_sent', {});
        const res = await sendAssistantMessage(uuid, conversationId, text, newClientMessageId());
        setMessages((prev) => [...prev, toWidgetMessage(res.assistant_message)]);
      } catch {
        setMessages((prev) => [...prev, { role: 'bot', text: errorMessage }]);
        track('screener_benbot_error', {});
      } finally {
        sendingRef.current = false;
        setIsSending(false);
        if (pendingRefreshRef.current) {
          pendingRefreshRef.current = false;
          refreshContext();
        }
      }
    },
    [ensureConversation, uuid, errorMessage, track, refreshContext],
  );

  const openWithMessage = useCallback(
    (message: string) => {
      setPanel('full');
      void sendMessage(message);
    },
    [sendMessage],
  );

  const handleSend = useCallback(() => {
    const trimmed = inputValue.trim();
    if (trimmed === '' || isSending) return;
    void sendMessage(trimmed);
    setInputValue('');
  }, [inputValue, isSending, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleClose = useCallback(() => {
    setPanel('closed');
    if (uuid) rememberDismissal(uuid);
    track('screener_benbot_closed', {});
  }, [track, uuid]);

  const handleOpen = useCallback(() => {
    // Opens to the templated welcome; the conversation is created lazily on the
    // first user message, so no unsolicited model reply (and no API call yet).
    pendingFocusRef.current = true;
    setPanel('full');
    track('screener_benbot_opened', { entry: 'fab' });
  }, [track]);

  const handleExpand = useCallback(() => {
    pendingFocusRef.current = true;
    setPanel('full');
  }, []);

  return (
    <ChatbotContext.Provider value={{ openWithMessage }}>
      {children}
      {isOpen ? (
        <div
          className={`chatbot-panel${panel === 'peek' ? ' chatbot-panel--peek' : ''}`}
          role="dialog"
          aria-label={formatMessage({ id: 'chatbot.ariaLabel', defaultMessage: 'Benji Assistant chat' })}
        >
          <div className="chatbot-header">
            <span className="chatbot-header-title">
              <FormattedMessage id="chatbot.title" defaultMessage="Benji Assistant" />
            </span>
            <span className="chatbot-header-actions">
              {panel === 'peek' && (
                <button
                  type="button"
                  className="chatbot-header-expand"
                  onClick={handleExpand}
                  aria-label={formatMessage({ id: 'chatbot.expand', defaultMessage: 'Expand chat' })}
                >
                  <KeyboardArrowUpIcon fontSize="small" />
                </button>
              )}
              <button
                type="button"
                className="chatbot-header-close"
                onClick={handleClose}
                aria-label={formatMessage({ id: 'chatbot.close', defaultMessage: 'Close chat' })}
              >
                <CloseIcon fontSize="small" />
              </button>
            </span>
          </div>
          <div className="chatbot-messages">
            {messages.length === 0 && (
              <div className="chatbot-welcome">
                {visiblePrograms && visiblePrograms.length > 0 ? (
                  // Templated client-side from what the page is showing — instant
                  // and free; the model is only engaged once the user replies.
                  <FormattedMessage
                    id="chatbot.welcomePersonalized"
                    defaultMessage="Hi, I'm Benji! Your results show {count, plural, one {# program} other {# programs}} you may qualify for, worth about {totalValue} per year. Ask me anything — like which one to apply for first."
                    values={{
                      count: visiblePrograms.length,
                      totalValue: formatNumber(totalAnnualValue, {
                        style: 'currency',
                        currency: 'USD',
                        maximumFractionDigits: 0,
                      }),
                    }}
                  />
                ) : (
                  <FormattedMessage
                    id="chatbot.welcome"
                    defaultMessage="Hi there! I'm here to help you understand your benefits. Ask me anything about the programs you qualify for."
                  />
                )}
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`chatbot-message chatbot-message-${msg.role}`}>
                {renderFormattedMessage(msg.text)}
              </div>
            ))}
            {isSending && (
              <div
                className="chatbot-message chatbot-message-bot chatbot-message-loading"
                role="status"
                aria-label={formatMessage({ id: 'chatbot.loading', defaultMessage: 'Benji is typing' })}
              >
                <span className="chatbot-typing-dot" />
                <span className="chatbot-typing-dot" />
                <span className="chatbot-typing-dot" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="chatbot-input-area">
            <input
              ref={inputRef}
              type="text"
              className="chatbot-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={panel === 'peek' ? handleExpand : undefined}
              placeholder={formatMessage({ id: 'chatbot.placeholder', defaultMessage: 'Type a message...' })}
              aria-label={formatMessage({ id: 'chatbot.inputAriaLabel', defaultMessage: 'Chat message input' })}
              disabled={isSending}
            />
            <button
              type="button"
              className="chatbot-send-btn"
              onClick={handleSend}
              disabled={inputValue.trim() === '' || isSending}
              aria-label={formatMessage({ id: 'chatbot.send', defaultMessage: 'Send message' })}
            >
              <SendIcon fontSize="small" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="chatbot-fab"
          onClick={handleOpen}
          aria-label={formatMessage({ id: 'chatbot.open', defaultMessage: 'Open Benji Assistant chat' })}
        >
          <ChatIcon />
        </button>
      )}
    </ChatbotContext.Provider>
  );
}
