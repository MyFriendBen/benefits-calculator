import { createContext, useContext, useState, useRef, useEffect, useCallback, PropsWithChildren } from 'react';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import { FormattedMessage, useIntl } from 'react-intl';
import { parseMarkdown } from '../../../utils/parseMarkdown';
import './Chatbot.css';

type Message = {
  role: 'user' | 'bot';
  text: string;
};

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

const DEMO_BOT_REPLIES = [
  `Congrats! You completed the screener and found almost **$3200 monthly** in benefits.  Can I help you decide where to start?`,
  `Looks like Supplemental Security Income (SSI) would be the most meaningful, with almost **$2000 per month in savings**.  The application takes about 90 minutes but will be well worth it.  Can I help you grab the right documents and get started?`,
];

function renderFormattedMessage(text: string): React.ReactNode {
  const PRIMARY_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim() || '#1976d2';
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let bulletBuffer: string[] = [];
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

  for (const line of lines) {
    if (line.startsWith('* ')) {
      bulletBuffer.push(line.slice(2));
    } else {
      flushBullets();
      if (line === '') {
        elements.push(<br key={key++} />);
      } else {
        elements.push(<span key={key++}>{parseMarkdown(line, PRIMARY_COLOR)}</span>);
      }
    }
  }
  flushBullets();

  return elements;
}

export function ChatbotProvider({ children }: PropsWithChildren) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const replyIndexRef = useRef(0);
  const { formatMessage } = useIntl();

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

  const sendMessage = useCallback((text: string) => {
    const userMessage: Message = { role: 'user', text };
    setMessages((prev) => [...prev, userMessage]);

    // Walk through demo replies in order, repeat the last one if exhausted
    const replyText = DEMO_BOT_REPLIES[Math.min(replyIndexRef.current, DEMO_BOT_REPLIES.length - 1)];
    replyIndexRef.current += 1;

    setTimeout(() => {
      const botMessage: Message = { role: 'bot', text: replyText };
      setMessages((prev) => [...prev, botMessage]);
    }, 500);
  }, []);

  const openWithMessage = useCallback(
    (message: string) => {
      setIsOpen(true);
      sendMessage(message);
    },
    [sendMessage],
  );

  const handleSend = useCallback(() => {
    const trimmed = inputValue.trim();
    if (trimmed === '') return;
    sendMessage(trimmed);
    setInputValue('');
  }, [inputValue, sendMessage]);

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
            />
            <button
              type="button"
              className="chatbot-send-btn"
              onClick={handleSend}
              disabled={inputValue.trim() === ''}
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
