import React from 'react';

/**
 * Parses simple markdown-like syntax and converts to React elements
 *
 * Supported features:
 * - **text** for bold
 * - Auto-detection of URLs (https://...) and converts them to clickable links
 * - Preserves line breaks
 *
 * @param content - The text content to parse
 * @param primaryColor - Color for links
 * @returns React nodes with formatted content
 */
export const parseMarkdown = (content: string, primaryColor: string): React.ReactNode => {
  // Convert literal \n strings to actual newlines (handles database-stored translations)
  const normalizedContent = content.replace(/\\n/g, '\n');

  // Helper function to parse a line for **bold** markdown and URLs
  const parseLine = (line: string, lineIndex: number): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let keyCounter = 0;

    // First, convert **bold** markdown to markers
    let currentText = line.replace(/\*\*(.+?)\*\*/g, '__BOLD_START__$1__BOLD_END__');

    // Maintain bold state across the entire line
    let inBold = false;
    const pushSegments = (text: string) => {
      const boldSegments = text.split(/(__BOLD_START__|__BOLD_END__)/);
      boldSegments.forEach((seg) => {
        if (seg === '__BOLD_START__') {
          inBold = true;
        } else if (seg === '__BOLD_END__') {
          inBold = false;
        } else if (seg) {
          parts.push(inBold ? <strong key={`${lineIndex}-${keyCounter++}`}>{seg}</strong> : seg);
        }
      });
    };

    // Find all URLs (excluding trailing punctuation including quotes)
    const urlRegex = /(https?:\/\/[^\s]+?)(?=[.,;:!?)\]'\"]*(?:\s|$))/g;
    const urlMatches = [...currentText.matchAll(urlRegex)];

    if (urlMatches.length === 0) {
      pushSegments(currentText);
    } else {
      let lastIdx = 0;
      urlMatches.forEach((match) => {
        const url = match[0];
        const startIdx = match.index!;
        if (startIdx > lastIdx) {
          pushSegments(currentText.substring(lastIdx, startIdx));
        }
        parts.push(
          <a
            key={`${lineIndex}-link-${keyCounter++}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: primaryColor, textDecoration: 'underline' }}
          >
            {url}
          </a>,
        );
        lastIdx = startIdx + url.length;
      });
      if (lastIdx < currentText.length) {
        pushSegments(currentText.substring(lastIdx));
      }
    }

    return parts;
  };

  // Split content by newlines and process each line
  const lines = normalizedContent.split('\n');
  const result: React.ReactNode[] = [];

  lines.forEach((line, lineIndex) => {
    result.push(...parseLine(line, lineIndex));

    // Add line break between lines (except for last line)
    if (lineIndex < lines.length - 1) {
      result.push(<br key={`br-${lineIndex}`} />);
    }
  });

  return result;
};
