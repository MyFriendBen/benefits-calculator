import { createContext, useContext, useState, useRef, useEffect, useCallback, PropsWithChildren } from 'react';
import { useParams } from 'react-router-dom';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import { FormattedMessage, useIntl } from 'react-intl';
import { parseMarkdown } from '../../../utils/parseMarkdown';
import { startAssistantConversation, sendAssistantMessage, AssistantApiMessage } from '../../../apiCalls';
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

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

function renderFormattedMessage(text: string): React.ReactNode {
  const PRIMARY_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim() || '#1976d2';
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
    if (line.startsWith('* ')) {
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

export function ChatbotProvider({ children }: PropsWithChildren) {
  const { uuid } = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const conversationIdRef = useRef<string | null>(null);
  const startPromiseRef = useRef<Promise<string | null> | null>(null);
  const { formatMessage } = useIntl();

  const errorMessage = formatMessage({
    id: 'chatbot.error',
    defaultMessage: 'Sorry, something went wrong. Please try again.',
  });

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Start (or reuse) the conversation; returns the conversation id, or null on failure.
  // Deduped via startPromiseRef so concurrent opens/sends don't create two conversations.
  const ensureConversation = useCallback(async (): Promise<string | null> => {
    if (conversationIdRef.current) return conversationIdRef.current;
    if (!uuid) return null;
    if (!startPromiseRef.current) {
      startPromiseRef.current = startAssistantConversation(uuid)
        .then((res) => {
          conversationIdRef.current = res.conversation_id;
          setMessages(res.messages.map(toWidgetMessage));
          return res.conversation_id;
        })
        .catch(() => {
          setMessages((prev) => [...prev, { role: 'bot', text: errorMessage }]);
          return null;
        })
        .finally(() => {
          startPromiseRef.current = null;
        });
    }
    return startPromiseRef.current;
  }, [uuid, errorMessage]);

  const sendMessage = useCallback(
    async (text: string) => {
      const conversationId = await ensureConversation();
      setMessages((prev) => [...prev, { role: 'user', text }]);
      if (!conversationId || !uuid) {
        setMessages((prev) => [...prev, { role: 'bot', text: errorMessage }]);
        return;
      }
      setIsSending(true);
      try {
        const res = await sendAssistantMessage(uuid, conversationId, text, newClientMessageId());
        setMessages((prev) => [...prev, toWidgetMessage(res.assistant_message)]);
      } catch {
        setMessages((prev) => [...prev, { role: 'bot', text: errorMessage }]);
      } finally {
        setIsSending(false);
      }
    },
    [ensureConversation, uuid, errorMessage],
  );

  const openWithMessage = useCallback(
    (message: string) => {
      setIsOpen(true);
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
    setIsOpen(false);
  }, []);

  const handleOpen = useCallback(() => {
    // Open to a blank window; the conversation is created lazily on the first
    // user message (typed, or via the "Guide me" button), so no unsolicited reply.
    setIsOpen(true);
  }, []);

  return (
    <ChatbotContext.Provider value={{ openWithMessage }}>
      {children}
      {isOpen ? (
        <div className="chatbot-panel" role="dialog" aria-label={formatMessage({ id: 'chatbot.ariaLabel', defaultMessage: 'BenBot Assistant chat' })}>
          <div className="chatbot-header">
            <span className="chatbot-header-title">
              <FormattedMessage id="chatbot.title" defaultMessage="BenBot Assistant" />
            </span>
            <button
              type="button"
              className="chatbot-header-close"
              onClick={handleClose}
              aria-label={formatMessage({ id: 'chatbot.close', defaultMessage: 'Close chat' })}
            >
              <CloseIcon fontSize="small" />
            </button>
          </div>
          <div className="chatbot-messages">
            {messages.length === 0 && (
              <div className="chatbot-welcome">
                <FormattedMessage
                  id="chatbot.welcome"
                  defaultMessage="Hi there! I'm here to help you understand your benefits. Ask me anything about the programs you qualify for."
                />
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`chatbot-message chatbot-message-${msg.role}`}>
                {renderFormattedMessage(msg.text)}
              </div>
            ))}
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
          aria-label={formatMessage({ id: 'chatbot.open', defaultMessage: 'Open BenBot Assistant chat' })}
        >
          <ChatIcon />
        </button>
      )}
    </ChatbotContext.Provider>
  );
}
