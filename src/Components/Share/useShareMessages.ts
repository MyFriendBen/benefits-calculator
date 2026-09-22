import { useEffect, useMemo, useState } from 'react';
import { IntlShape, createIntl, createIntlCache, useIntl } from 'react-intl';
import { getTranslations } from '../../apiCalls';
import { Language } from '../../Assets/languageOptions';

export const SHARE_SUBJECT = {
  id: 'sharePopup.emailSubject',
  defaultMessage: 'Check out MyFriendBen',
};

export const SHARE_BODY = {
  id: 'sharePopup.shareBody',
  defaultMessage:
    "Hey, wanted to share MyFriendBen. It's a free screener that takes about 6 minutes and shows you what benefits you're eligible for - things like tax credits, help with utility bills, and food assistance. And it doesn't ask for your name or any contact information. {url}",
};

// Safe to share across the detached instances below: the cache only memoizes
// formatter construction, and its entries are keyed by locale.
const intlCache = createIntlCache();

// A share language is fetched once per session and reused. The payload is the
// whole translation table for that language, and the modal is mounted and
// unmounted freely — the results popup tears it down on every minimize — so the
// cache has to outlive the component rather than live in a ref.
const messagesByLocale = new Map<string, Record<string, string>>();

/** Drops the cache above, which would otherwise leak between tests. */
export function clearShareMessagesCache() {
  messagesByLocale.clear();
}

type ShareMessages = {
  subject: string;
  /** The body embeds the share link, and each channel uses a different one. */
  buildBody: (url: string) => string;
  /** True while the recipient's translations are still in flight. */
  loading: boolean;
  /**
   * True when the translations could not be fetched. The caller can still send —
   * the copy falls back to the sender's own language rather than blocking.
   */
  error: boolean;
};

/**
 * Formats the share copy in a language other than the one the app is currently
 * displaying, so the sender's UI stays put while the recipient gets their own
 * language.
 *
 * `useIntl` can only ever format in the active locale, so a target language
 * needs its own detached intl instance fed from the translations endpoint.
 */
export function useShareMessages(targetLocale: string): ShareMessages {
  const senderIntl = useIntl();
  // The common case is sharing in the language you are already reading, and the
  // active locale's translations are loaded already.
  const isSenderLocale = targetLocale === senderIntl.locale;

  const [messages, setMessages] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isSenderLocale) {
      setMessages(null);
      setLoading(false);
      setError(false);
      return;
    }

    const cached = messagesByLocale.get(targetLocale);
    if (cached) {
      setMessages(cached);
      setLoading(false);
      setError(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);

    getTranslations(targetLocale as Language)
      .then((response) => {
        if (cancelled) return;
        // The endpoint keys its payload by language code; fall back to the sole
        // entry if the returned key is spelled differently than we asked.
        const resolved = response[targetLocale] ?? Object.values(response)[0] ?? {};
        messagesByLocale.set(targetLocale, resolved);
        setMessages(resolved);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setMessages(null);
        setError(true);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [targetLocale, isSenderLocale]);

  const intl: IntlShape = useMemo(() => {
    if (isSenderLocale || messages === null) {
      return senderIntl;
    }

    return createIntl(
      {
        locale: targetLocale,
        defaultLocale: 'en-us',
        messages,
        // A target language can legitimately be missing a key that English has;
        // formatMessage already falls back to defaultMessage, so there is no
        // reason to spend a console warning on it.
        onError: () => {},
      },
      intlCache,
    );
  }, [isSenderLocale, messages, targetLocale, senderIntl]);

  return {
    subject: intl.formatMessage(SHARE_SUBJECT),
    buildBody: (url: string) => intl.formatMessage(SHARE_BODY, { url }),
    loading,
    error,
  };
}
