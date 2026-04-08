import { createContext, useContext, useState, useRef, useEffect, useCallback, PropsWithChildren } from 'react';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import { FormattedMessage, useIntl } from 'react-intl';
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

const STATIC_BOT_REPLY =
  "That's a great question! We're still setting up this feature, but I'd love to help you navigate your benefits. Check the program details on this page for estimated savings and links to apply. You may also qualify for more benefits than you think — keep exploring!";

function getBotReply(): string {
  // Placeholder for future LLM API call
  return STATIC_BOT_REPLY;
}

export function ChatbotProvider({ children }: PropsWithChildren) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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

    // Simulate async bot response
    setTimeout(() => {
      const botMessage: Message = { role: 'bot', text: getBotReply() };
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
        <div className="chatbot-panel" role="dialog" aria-label={formatMessage({ id: 'chatbot.ariaLabel', defaultMessage: 'Benefits Assistant chat' })}>
          <div className="chatbot-header">
            <span className="chatbot-header-title">
              <FormattedMessage id="chatbot.title" defaultMessage="Benefits Assistant" />
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
                {msg.text}
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
          aria-label={formatMessage({ id: 'chatbot.open', defaultMessage: 'Open Benefits Assistant chat' })}
        >
          <ChatIcon />
        </button>
      )}
    </ChatbotContext.Provider>
  );
}
