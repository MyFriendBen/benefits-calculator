import React from 'react';

/**
 * Parses simple markdown-like syntax and converts to React elements
 *
 * Supported features:
 * - **text** for bold
 * - [text](url) for links
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

  // Helper function to parse a line for markdown
  const parseLine = (line: string, lineIndex: number): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let keyCounter = 0;

    // Handle markdown links [text](url) first
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const linkMatches = [...line.matchAll(markdownLinkRegex)];

    // Replace markdown links with unique placeholders
    let currentText = line;
    linkMatches.forEach((match, idx) => {
      const placeholder = `__MDLINK_${idx}__`;
      currentText = currentText.replace(match[0], placeholder);
    });

    // Now handle **bold** markdown
    currentText = currentText.replace(/\*\*(.+?)\*\*/g, '__BOLD_START__$1__BOLD_END__');

    // Find all plain URLs (excluding trailing punctuation)
    const urlRegex = /(https?:\/\/[^\s]+?)(?=[.,;:!?)\]'\"]*(?:\s|$))/g;
    const plainUrlMatches = [...currentText.matchAll(urlRegex)];

    // Maintain bold state across the entire line
    let inBold = false;

    const pushSegments = (seg: string) => {
      if (seg === '__BOLD_START__') {
        inBold = true;
      } else if (seg === '__BOLD_END__') {
        inBold = false;
      } else if (seg) {
        let remaining = seg;
        while (remaining.length > 0) {
          const mdLinkMatch = /__MDLINK_(\d+)__/.exec(remaining);
          if (!mdLinkMatch) {
            parts.push(inBold ? <strong key={`${lineIndex}-${keyCounter++}`}>{remaining}</strong> : remaining);
            break;
          }
          const [placeholder, linkIdxString] = mdLinkMatch;
          const placeholderIndex = mdLinkMatch.index ?? 0;
          if (placeholderIndex > 0) {
            const textBefore = remaining.slice(0, placeholderIndex);
            parts.push(inBold ? <strong key={`${lineIndex}-${keyCounter++}`}>{textBefore}</strong> : textBefore);
          }
          const linkIdx = parseInt(linkIdxString, 10);
          const [, linkText, url] = linkMatches[linkIdx];
          parts.push(
            <a
              key={`${lineIndex}-link-${keyCounter++}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: primaryColor, textDecoration: 'underline' }}
            >
              {linkText}
            </a>
          );
          remaining = remaining.slice(placeholderIndex + placeholder.length);
        }
      }
    };

    if (plainUrlMatches.length === 0) {
      // No plain URLs, just process bold and markdown links
      const boldSegments = currentText.split(/(__BOLD_START__|__BOLD_END__)/);
      boldSegments.forEach((seg) => {
        pushSegments(seg);
      });
    } else {
      // Handle plain URLs
      let lastIdx = 0;
      plainUrlMatches.forEach((match) => {
        const url = match[0];
        const startIdx = match.index!;
        
        if (startIdx > lastIdx) {
          const textBefore = currentText.substring(lastIdx, startIdx);
          const boldSegments = textBefore.split(/(__BOLD_START__|__BOLD_END__)/);
          boldSegments.forEach((seg) => {
            pushSegments(seg);
          });
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
        const textAfter = currentText.substring(lastIdx);
        const boldSegments = textAfter.split(/(__BOLD_START__|__BOLD_END__)/);
        boldSegments.forEach((seg) => {
          pushSegments(seg);
        });
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