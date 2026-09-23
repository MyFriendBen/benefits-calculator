import { createContext, useContext, useState, useRef, useEffect, useCallback, useMemo, PropsWithChildren } from 'react';
import { useParams } from 'react-router-dom';
import ChatIcon from '@mui/icons-material/Chat';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import ThumbDownOffAltIcon from '@mui/icons-material/ThumbDownOffAlt';
import ThumbDownAltIcon from '@mui/icons-material/ThumbDownAlt';
import { FormattedMessage, useIntl } from 'react-intl';
import { parseMarkdown } from '../../../utils/parseMarkdown';
import {
  startAssistantConversation,
  getAssistantHistory,
  sendAssistantMessage,
  rateAssistantMessage,
  ASSISTANT_RATING_REASONS,
  AssistantApiMessage,
  AssistantRating,
  AssistantRatingReason,
  AssistantVisibleProgram,
} from '../../../apiCalls';
import { useTrackEvent } from '../../../Assets/analytics';
import './Chatbot.css';

type Message = {
  role: 'user' | 'bot';
  text: string;
  /**
   * The server's message id, and the rating it currently holds (MFB-1915).
   *
   * Both optional because not every bubble in this list is a stored row. A user's
   * message is appended locally the instant they hit send, before the round trip that
   * would give it an id — and it is never rateable anyway. The greeting isn't in this
   * list at all (it's derived; see the transcript below), so it can't be rated either,
   * which is right: it is client-templated copy, not something Benji said.
   *
   * `id` is therefore what makes a bubble rateable, and its absence is the reason the
   * buttons don't render rather than a separate flag.
   */
  id?: string;
  rating?: AssistantRating;
  reason?: AssistantRatingReason | null;
};

// The greeting as the user last saw it — which variant, and the numbers it quotes.
// A discriminated union rather than a nullable count, so the branch and its values are
// latched by the same write: freezing one without the other is what let the greeting
// swap variants under a live conversation.
type GreetingSnapshot = { variant: 'personalized'; count: number; totalValue: number } | { variant: 'generic' };

// The API uses role 'assistant'; the widget renders it as 'bot'.
function toWidgetMessage(m: AssistantApiMessage): Message {
  return {
    role: m.role === 'assistant' ? 'bot' : 'user',
    text: m.text,
    id: m.message_id,
    // `?? null` rather than passing it through: a backend that predates MFB-1915 omits
    // the key, and "absent" and "unrated" have to be the same thing to the buttons.
    rating: m.rating ?? null,
    reason: m.rating_reason ?? null,
  };
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

type RatingWriteValue = { rating: AssistantRating; reason: AssistantRatingReason | null };

/** One message's in-flight rating request, plus the newest value waiting behind it. */
type RatingWrite = { inFlight: boolean; pending: RatingWriteValue | null };

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

// `<b>` chunks for the greeting's two options.
//
// The greeting is a raw <FormattedMessage>, not model output, so it never passes
// through renderFormattedMessage below and `**asterisks**` would render literally.
// The bolding isn't decoration: the system prompt requires each option in a choice to
// be bold (PROMPT_VERSION v5), and the greeting is now the message that makes that
// offer — so it has to look like the assistant's own offers, not like prose.
//
// Module-level, so it's a stable reference rather than a new closure per render.
const boldChunks = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

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

type ReasonChipsProps = {
  selected: AssistantRatingReason | null;
  onPick: (reason: AssistantRatingReason | null) => void;
  labels: Record<AssistantRatingReason, string>;
  /** Id of the visible heading above the chips; it names the group for screen readers. */
  labelledBy: string;
};

/**
 * "What went wrong?" chips, shown under a reply that is currently rated down (MFB-1915).
 *
 * A bare thumbs-down says someone was unhappy and nothing about what to change. These
 * are what make it actionable, and the codes come from the failure modes ai-service's
 * `_SHARED_GUARDRAILS` already names — fabricated rules, programs outside the closed
 * list, invented links — rather than from a generic list.
 *
 * SKIPPABLE, AND THAT IS THE POINT. The thumbs-down is saved before these ever render,
 * so ignoring them costs the household nothing and costs us only a reason we were
 * never owed. Requiring one would convert a rating we already have into an abandoned
 * interaction — the opposite of the trade worth making.
 *
 * Single select: picking a second chip replaces the first, and picking the selected one
 * clears it, matching how the thumbs themselves behave.
 *
 * FIVE, not the seven this started with. Seven stacked to seven lines in a panel capped
 * at 45vh — a lot of furniture under every thumbs-down — and the labels were sentences
 * rather than chips. `bad_link` was cut because it is the one failure mode detectable
 * WITHOUT asking anyone (sweep the stored replies for URLs), and `wrong_tone` because it
 * is the least often articulated as its own complaint. Both now land in `other`, whose
 * rate is what will say if that was the wrong call.
 *
 * Rendered whenever the rating is -1, including on a restored transcript, so a returning
 * household sees what they said — and gets a second chance if they skipped it.
 */
function ReasonChips({ selected, onPick, labels, labelledBy }: ReasonChipsProps) {
  return (
    <div className="chatbot-reasons" role="group" aria-labelledby={labelledBy}>
      {ASSISTANT_RATING_REASONS.map((code) => (
        <button
          key={code}
          type="button"
          className={`chatbot-reason-chip${selected === code ? ' chatbot-reason-chip--active' : ''}`}
          onClick={() => onPick(selected === code ? null : code)}
          aria-pressed={selected === code}
        >
          {labels[code]}
        </button>
      ))}
    </div>
  );
}

type MessageRatingProps = {
  rating: AssistantRating;
  /** Called with what the rating should BECOME — never a toggle; see `rateMessage`. */
  onRate: (next: AssistantRating) => void;
  groupLabel: string;
  upLabel: string;
  downLabel: string;
};

/**
 * The thumbs up / thumbs down pair under one assistant reply (MFB-1915).
 *
 * Presentational: it holds no state and performs no request, so the optimistic update
 * and its rollback stay in one place in the provider rather than being split across a
 * component that renders once per message.
 *
 * Two real <button>s carrying `aria-pressed`, inside a labelled group. The pressed
 * state is what a screen reader announces, and the icon swaps between outline and
 * filled — so which thumb is chosen never rests on colour alone.
 */
function MessageRating({ rating, onRate, groupLabel, upLabel, downLabel }: MessageRatingProps) {
  // Clicking the thumb already held clears it; clicking the other switches.
  const toggle = (thumb: 1 | -1) => () => onRate(rating === thumb ? null : thumb);

  return (
    <div className="chatbot-rating" role="group" aria-label={groupLabel}>
      <button
        type="button"
        className={`chatbot-rating-btn${rating === 1 ? ' chatbot-rating-btn--active' : ''}`}
        onClick={toggle(1)}
        aria-pressed={rating === 1}
        aria-label={upLabel}
      >
        {rating === 1 ? <ThumbUpAltIcon fontSize="inherit" /> : <ThumbUpOffAltIcon fontSize="inherit" />}
      </button>
      <button
        type="button"
        className={`chatbot-rating-btn${rating === -1 ? ' chatbot-rating-btn--active' : ''}`}
        onClick={toggle(-1)}
        aria-pressed={rating === -1}
        aria-label={downLabel}
      >
        {rating === -1 ? <ThumbDownAltIcon fontSize="inherit" /> : <ThumbDownOffAltIcon fontSize="inherit" />}
      </button>
    </div>
  );
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
  // `programId` is set only on a program's own page (`results/benefits/:programId`).
  // Used for the greeting, which is written about the whole results list (MFB-1872).
  const { uuid, programId } = useParams();
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
  // The conversation id for RATING, which is deliberately not `conversationIdRef`.
  //
  // Those two look like the same fact and are not. `conversationIdRef` doubles as
  // "we have already started this conversation in this session", and the
  // history-restore effect below leaves it null ON PURPOSE so the next send still
  // POSTs the start endpoint and refreshes ai-service's context snapshot (see the
  // long note there — setting it is the MFB-1427 failure through the back door).
  //
  // Rating needs the plain fact instead: which conversation the messages on screen
  // belong to, whether we opened it this session or read it back. Restoring a
  // transcript and then being unable to rate any of it would defeat the "survives a
  // reload" requirement, which is most of the point.
  const ratingConversationIdRef = useRef<string | null>(null);
  // A synchronous mirror of `messages`. A rating write needs to know what is currently
  // displayed at the moment it is queued, and the `setMessages` updater runs when React
  // processes the update, which is not necessarily before the next line here.
  const messagesRef = useRef<Message[]>([]);
  // Per message: is a rating request on the wire, what newer value is waiting behind it,
  // and what to fall back to if the last one fails. See `queueRatingWrite`.
  const ratingWritesRef = useRef<Map<string, RatingWrite>>(new Map());
  const startPromiseRef = useRef<Promise<string | null> | null>(null);
  const sendingRef = useRef(false);
  const { formatMessage, formatNumber } = useIntl();
  const track = useTrackEvent();

  // Displayed program values are annual whole dollars (see visiblePrograms).
  const totalAnnualValue = useMemo(
    () => (visiblePrograms ?? []).reduce((sum, program) => sum + program.value, 0),
    [visiblePrograms],
  );

  // WHICH greeting is on screen, and the numbers it quotes — latched the moment the
  // user answers it.
  //
  // The invariant is "the greeting stops changing once the user has answered it", not
  // the weaker "its numbers stop changing". Both inputs are live, and freezing only the
  // numbers leaves the second one editing a message that has already been read:
  //
  //   - `visiblePrograms` tracks the results-page filters, so an unfrozen count
  //     re-counts itself mid-conversation;
  //   - `programId` tracks the route, and ChatbotProvider deliberately survives the
  //     navigation into a program's own page (MFB-1872, Results.tsx) — so a user who
  //     clicks "more info" mid-conversation would watch the personalized greeting above
  //     their own words turn into the generic one.
  //
  // Before they answer, recomputing is correct and not merely harmless: the greeting
  // quotes what the results page is showing, so it has to track a filter change, and
  // this is also what lets a widget that auto-opened before the list resolved upgrade
  // from the generic welcome to the personalized one. After they answer, it is a sent
  // message, and sent messages don't change.
  //
  // `isSending` is part of "answered" because `messages` is still empty while the first
  // send is in flight — without it, a filter landing in that window still edits the
  // greeting the user has just replied to.
  //
  // Written during render rather than from an effect so the first paint already has the
  // final text; this is a latched snapshot, not derived state.
  const greetingRef = useRef<GreetingSnapshot | null>(null);
  const greetingAnswered = messages.length > 0 || isSending;
  if (isOpen && (greetingRef.current === null || !greetingAnswered)) {
    greetingRef.current =
      !programId && visiblePrograms && visiblePrograms.length > 0
        ? { variant: 'personalized', count: visiblePrograms.length, totalValue: totalAnnualValue }
        : { variant: 'generic' };
  }
  const greeting = greetingRef.current;

  const errorMessage = formatMessage({
    id: 'chatbot.error',
    defaultMessage: 'Sorry, something went wrong. Please try again.',
  });

  // Formatted here rather than inline in the transcript: these are re-evaluated for
  // every assistant bubble on every render, and the transcript grows all conversation.
  //
  // The labels say "helpful" rather than naming the gesture, because a thumb is not
  // what a screen-reader user is choosing between — and because the two buttons are a
  // pair, which `rateReplyLabel` on the group is what actually establishes.
  const rateReplyLabel = formatMessage({ id: 'chatbot.rateReply', defaultMessage: 'Rate this reply' });
  const thumbUpLabel = formatMessage({ id: 'chatbot.thumbUp', defaultMessage: 'This reply was helpful' });
  const thumbDownLabel = formatMessage({
    id: 'chatbot.thumbDown',
    defaultMessage: 'This reply was not helpful',
  });
  // Shown under the thumbs once a reply is rated, and for a thumbs-down it doubles as
  // the visible heading for the chips below it — which is why `aria-labelledby` points
  // at it rather than the group carrying its own invisible `aria-label`. One accessible
  // name, and sighted users get the heading that was previously screen-reader-only.
  //
  // Deliberately NOT an aria-live region: `aria-pressed` on the thumb already announces
  // the state change, so a live region here would say it twice.
  //
  // "Recorded" was considered and dropped. It reads as a promise — someone who has just
  // said a reply was inaccurate may take it to mean a person will look and follow up,
  // and nothing routes a thumbs-down anywhere today.
  const thanksUpLabel = formatMessage({ id: 'chatbot.thanksUp', defaultMessage: "Thanks — that's helpful." });
  const thanksDownLabel = formatMessage({
    id: 'chatbot.reason.groupLabel',
    defaultMessage: 'Thanks. What went wrong?',
  });
  // Keyed by the stored code, so re-wording a chip is a translation change and never
  // touches what the warehouse has already recorded. `useMemo` because this builds an
  // object and the transcript re-renders on every message.
  const reasonLabels = useMemo(
    () => ({
      inaccurate: formatMessage({ id: 'chatbot.reason.inaccurate', defaultMessage: 'Not accurate' }),
      not_my_results: formatMessage({
        id: 'chatbot.reason.notMyResults',
        defaultMessage: 'Not about my results',
      }),
      unanswered: formatMessage({ id: 'chatbot.reason.unanswered', defaultMessage: "Didn't answer me" }),
      hard_to_follow: formatMessage({
        id: 'chatbot.reason.hardToFollow',
        defaultMessage: 'Confusing or too long',
      }),
      other: formatMessage({ id: 'chatbot.reason.other', defaultMessage: 'Something else' }),
    }),
    [formatMessage],
  );

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    messagesRef.current = messages;
  });

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
        // Rating only — NOT conversationIdRef, for the reason in (1) above and at the
        // ref's own declaration.
        ratingConversationIdRef.current = conversation.conversation_id;
        const restored = conversation.messages.map(toWidgetMessage);
        setMessages((prev) => (prev.length === 0 ? restored : prev));
      })
      .catch(() => {});
  }, [panel, uuid]);

  // Apply a server transcript WITHOUT discarding ratings this session has written.
  //
  // `setMessages(res.messages.map(toWidgetMessage))` replaced the list wholesale, which
  // loses a rating the household has just given. The window is real and ordinary: after
  // a history restore `conversationIdRef` is deliberately left null (see the restore
  // effect), so the first send calls the start endpoint — and someone who rates a
  // restored reply and immediately asks a follow-up has a rating PUT racing a start
  // POST. If ai-service reads the rows before that PUT commits, the response carries
  // `rating: null` and the reply goes back to unrated on screen while the database holds
  // the rating.
  //
  // Any message this session has written a rating for keeps its local value: we know
  // what we sent, and that is at least as fresh as anything a server read can tell us.
  const applyServerMessages = useCallback((serverMessages: AssistantApiMessage[]) => {
    setMessages((prev) => {
      const ours = new Map(
        prev
          .filter((m) => m.id !== undefined && ratingWritesRef.current.has(m.id))
          .map((m) => [m.id as string, { rating: m.rating ?? null, reason: m.reason ?? null }]),
      );
      return serverMessages.map((sm) => {
        const mapped = toWidgetMessage(sm);
        const mine = ours.get(sm.message_id);
        return mine ? { ...mapped, rating: mine.rating, reason: mine.reason } : mapped;
      });
    });
  }, []);

  // Start (or reuse) the conversation; returns the conversation id, or null on failure.
  // Deduped via startPromiseRef so concurrent opens/sends don't create two conversations.
  const ensureConversation = useCallback(async (): Promise<string | null> => {
    if (conversationIdRef.current) return conversationIdRef.current;
    if (!uuid) return null;
    if (!startPromiseRef.current) {
      startPromiseRef.current = startAssistantConversation(uuid, undefined, visiblePrograms)
        .then((res) => {
          conversationIdRef.current = res.conversation_id;
          ratingConversationIdRef.current = res.conversation_id;
          applyServerMessages(res.messages);
          return res.conversation_id;
        })
        .catch(() => null) // error surfaced by the caller (sendMessage), not here
        .finally(() => {
          startPromiseRef.current = null;
        });
    }
    return startPromiseRef.current;
  }, [uuid, errorMessage, visiblePrograms, applyServerMessages]);

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

  // Thumbs up / down on one reply, and the reason behind a thumbs-down (MFB-1915).
  //
  // ONE REQUEST PER MESSAGE AT A TIME, with the newest value coalesced behind it.
  // Firing these off independently looked fine and was wrong in two ways, both of
  // which a normal thumbs-down-then-pick-a-chip sequence can hit inside one round trip:
  //
  //   1. Out-of-order writes. Two PUTs for the same message can reach different workers
  //      and be applied in either order, so the row can end up holding the value the
  //      user chose FIRST while the buttons show the one they chose second. Nothing
  //      fails, so nothing rolls back, and the mismatch only surfaces on a reload.
  //      Sending the desired value rather than a toggle fixes a double-click of the
  //      SAME value; it does nothing for two different values in flight together.
  //
  //   2. A stale failure clobbering a newer success. Each attempt used to restore the
  //      value it captured at its own click, with no check for anything newer. Thumbs-up
  //      then quickly thumbs-down, where the first request then 429s, restored "unrated"
  //      over a thumbs-down the server had already accepted.
  //
  // Serializing per message removes both: at most one write is on the wire, the latest
  // intent always goes out last, and a failure can only ever roll back to the value the
  // server most recently confirmed — and only when nothing newer is already waiting.
  const queueRatingWrite = useCallback(
    async (messageId: string, desired: RatingWriteValue) => {
      const conversationId = ratingConversationIdRef.current;
      if (!conversationId || !uuid) return;

      const current = messagesRef.current.find((m) => m.id === messageId);
      const before: RatingWriteValue = { rating: current?.rating ?? null, reason: current?.reason ?? null };

      // Optimistic, always. A rating is feedback, not a transaction: making someone wait
      // on a spinner to learn whether their thumbs-down registered costs more than the
      // rare failure does.
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, rating: desired.rating, reason: desired.reason } : m)),
      );

      const writes = ratingWritesRef.current;
      const open = writes.get(messageId);
      if (open?.inFlight) {
        // Something is already on the wire for this message. Keep only the latest
        // intent — the in-flight call will send it when it returns.
        open.pending = desired;
        return;
      }

      const entry: RatingWrite = { inFlight: true, pending: null };
      writes.set(messageId, entry);

      let send = desired;
      // What the server has most recently accepted. Starts at what was on screen before
      // this write, which is the last thing it accepted for this message.
      let confirmed = before;
      try {
        for (;;) {
          try {
            await rateAssistantMessage(uuid, conversationId, messageId, send.rating, send.reason);
            confirmed = send;
          } catch {
            // Don't roll back under a newer value that is about to be sent — it would
            // flicker, and the pending write is about to state the truth anyway.
            if (!entry.pending) {
              const back = confirmed;
              setMessages((prev) =>
                prev.map((m) => (m.id === messageId ? { ...m, rating: back.rating, reason: back.reason } : m)),
              );
            }
            // No error bubble in the transcript. The send path adds one because a failed
            // send means the user's question went unanswered; a failed rating means only
            // that their opinion wasn't recorded, and interrupting the conversation with
            // a message about it would be louder than the thing that failed.
          }
          if (!entry.pending) break;
          send = entry.pending;
          entry.pending = null;
        }
      } finally {
        entry.inFlight = false;
      }
    },
    [uuid],
  );

  // Clicking a thumb. Always clears any reason: a reason stranded on a thumbs-up or an
  // unrated reply would be counted as a complaint nobody made, and the endpoint and the
  // DB constraint both refuse it anyway.
  const rateMessage = useCallback(
    (messageId: string, next: AssistantRating) => {
      track('screener_benbot_rated', { rating: next === 1 ? 'up' : next === -1 ? 'down' : 'cleared' });
      void queueRatingWrite(messageId, { rating: next, reason: null });
    },
    [queueRatingWrite, track],
  );

  // Picking or clearing a reason chip. A SEPARATE event from the thumb: these used to
  // share `screener_benbot_rated`, so every chip press recorded another thumbs-down and
  // one unhappy reply could report three. The overcount fell hardest on the most engaged
  // households, whose reasons are the ones worth having.
  const setRatingReason = useCallback(
    (messageId: string, reason: AssistantRatingReason | null) => {
      track('screener_benbot_rating_reason', { reason: reason ?? 'cleared' });
      void queueRatingWrite(messageId, { rating: -1, reason });
    },
    [queueRatingWrite, track],
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
          {/* Standing privacy notice. Pinned between the header and the transcript
              rather than placed in it: it's a warning about what the user is about
              to type, so it has to stay on screen once the conversation starts.

              Omitted in 'peek', which is a teaser, not a place you can type: focusing
              the input there expands to 'full' (see the input's onFocus), so the
              notice is always on screen before a character can be entered. Rendering
              it in peek only costs the greeting ~39px of a panel already capped at
              min(21rem, 45vh), which pushed the last lines below the fold. */}
          {panel === 'full' && (
            <div className="chatbot-disclaimer" role="note">
              <FormattedMessage
                id="chatbot.privacyNotice"
                defaultMessage="Benji is an AI assistant. Please do not include your SSN, account numbers, or medical details in this chat."
              />
            </div>
          )}
          <div className="chatbot-messages">
            {
              // The greeting is a real bot bubble, not a banner, so the conversation
              // opens the way it continues — and it STAYS, which is the whole point of
              // rendering it unconditionally rather than from `messages.length === 0`.
              // Under that old guard it vanished the instant the user hit send: the
              // start call replaces `messages` wholesale with the server's transcript,
              // which has never contained the greeting. What the user saw was Benji
              // deleting its own opening line the moment they answered it — and once
              // that line is an invitation to describe a hard situation, retracting it
              // mid-thought is the worst possible moment to do it.
              //
              // It is still derived rather than seeded into `messages`, because seeding
              // is what actually can't survive here: the history-restore effect below
              // only fills an EMPTY transcript (so a seeded greeting would suppress a
              // returning household's history), and `ensureConversation` would overwrite
              // it on the first send anyway. Deriving sidesteps both. Both the variant
              // and its numbers come from the latched `greeting` above — nothing here
              // may read `visiblePrograms` or `programId` directly, or the bubble starts
              // rewriting itself again under a conversation that has moved past it.
              //
              // Not stored server-side: it is client-templated and already translated,
              // and ai-service's store appends user/assistant messages in pairs. The
              // model is told about it in the system prompt instead, so it doesn't
              // re-offer the choice this bubble just made.
              <div className="chatbot-message chatbot-message-bot">
                {greeting?.variant === 'personalized' ? (
                  // Templated client-side from what the page is showing — instant
                  // and free; the model is only engaged once the user replies.
                  //
                  // Suppressed on a program's own page: this greeting counts the whole
                  // list and offers to pick "which one to apply for first", which
                  // describes a screen the user is not on. Someone who deep-links or
                  // reloads there would otherwise be auto-opened into it. The generic
                  // welcome below is route-neutral and already translated, so this
                  // costs no new strings.
                  <FormattedMessage
                    id="chatbot.welcomePersonalizedSituation"
                    defaultMessage="Hi, I'm Benji! Your results show {count, plural, one {# program} other {# programs}} you may qualify for, worth about {totalValue} per year. <b>Tell me what's going on right now</b> and I'll point you to the best place to start — or I can <b>walk you through your top result</b>."
                    values={{
                      count: greeting.count,
                      totalValue: formatNumber(greeting.totalValue, {
                        style: 'currency',
                        currency: 'USD',
                        maximumFractionDigits: 0,
                      }),
                      b: boldChunks,
                    }}
                  />
                ) : (
                  <FormattedMessage
                    id="chatbot.welcomeSituation"
                    defaultMessage="Hi, I'm Benji. <b>Tell me what's going on for you right now</b> and I'll help you find the best place to start — or <b>ask me anything</b> about the programs you qualify for."
                    values={{ b: boldChunks }}
                  />
                )}
              </div>
            }
            {messages.map((msg, i) => (
              <div key={msg.id ?? i} className={`chatbot-message chatbot-message-${msg.role}`}>
                {renderFormattedMessage(msg.text)}
                {/* Stored assistant replies only. `msg.id` is the gate rather than a
                    separate flag: a bubble without one is either the user's own message
                    echoed optimistically before its round trip, or a client-side error
                    notice — nothing the server has a row for, and nothing it would make
                    sense to rate. The greeting never reaches this list at all. */}
                {msg.role === 'bot' && msg.id !== undefined && (
                  <>
                    <MessageRating
                      rating={msg.rating ?? null}
                      onRate={(next) => rateMessage(msg.id as string, next)}
                      groupLabel={rateReplyLabel}
                      upLabel={thumbUpLabel}
                      downLabel={thumbDownLabel}
                    />
                    {/* Only under a reply that is currently rated down. Never on a
                        thumbs-up: positive reasons are far less diagnostic, and a
                        second step on the cheap positive action suppresses the volume
                        that makes the positive signal worth having. */}
                    {(msg.rating === 1 || msg.rating === -1) && (
                      <p className="chatbot-rating-note" id={`chatbot-rating-note-${msg.id}`}>
                        {msg.rating === 1 ? thanksUpLabel : thanksDownLabel}
                      </p>
                    )}
                    {msg.rating === -1 && (
                      <ReasonChips
                        selected={msg.reason ?? null}
                        onPick={(reason) => setRatingReason(msg.id as string, reason)}
                        labels={reasonLabels}
                        labelledBy={`chatbot-rating-note-${msg.id}`}
                      />
                    )}
                  </>
                )}
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
