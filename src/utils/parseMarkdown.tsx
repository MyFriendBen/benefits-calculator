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
  // Helper function to parse a line for **bold** markdown and URLs
  const parseLine = (line: string, lineIndex: number): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let keyCounter = 0;

    // First, convert **bold** markdown to markers
    let currentText = line.replace(/\*\*(.+?)\*\*/g, '__BOLD_START__$1__BOLD_END__');

    // Find all URLs (excluding trailing punctuation)
    const urlRegex = /(https?:\/\/[^\s]+?)(?=[.,;:!?)\]]*(?:\s|$))/g;
    const urlMatches = [...currentText.matchAll(urlRegex)];

    if (urlMatches.length === 0) {
      // No URLs, just handle bold markers
      const boldSegments = currentText.split(/(__BOLD_START__|__BOLD_END__)/);
      let inBold = false;
      boldSegments.forEach((seg) => {
        if (seg === '__BOLD_START__') {
          inBold = true;
        } else if (seg === '__BOLD_END__') {
          inBold = false;
        } else if (seg) {
          if (inBold) {
            parts.push(<strong key={`${lineIndex}-${keyCounter++}`}>{seg}</strong>);
          } else {
            parts.push(<span key={`${lineIndex}-${keyCounter++}`}>{seg}</span>);
          }
        }
      });
    } else {
      // Has URLs, need to interleave text, bold, and links
      let lastIdx = 0;

      urlMatches.forEach((match) => {
        const url = match[0];
        const startIdx = match.index!;

        // Add text before URL
        if (startIdx > lastIdx) {
          const textBefore = currentText.substring(lastIdx, startIdx);
          const boldSegments = textBefore.split(/(__BOLD_START__|__BOLD_END__)/);
          let inBold = false;
          boldSegments.forEach((seg) => {
            if (seg === '__BOLD_START__') {
              inBold = true;
            } else if (seg === '__BOLD_END__') {
              inBold = false;
            } else if (seg) {
              if (inBold) {
                parts.push(<strong key={`${lineIndex}-${keyCounter++}`}>{seg}</strong>);
              } else {
                parts.push(<span key={`${lineIndex}-${keyCounter++}`}>{seg}</span>);
              }
            }
          });
        }

        // Add URL as link
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

      // Add remaining text after last URL
      if (lastIdx < currentText.length) {
        const textAfter = currentText.substring(lastIdx);
        const boldSegments = textAfter.split(/(__BOLD_START__|__BOLD_END__)/);
        let inBold = false;
        boldSegments.forEach((seg) => {
          if (seg === '__BOLD_START__') {
            inBold = true;
          } else if (seg === '__BOLD_END__') {
            inBold = false;
          } else if (seg) {
            if (inBold) {
              parts.push(<strong key={`${lineIndex}-${keyCounter++}`}>{seg}</strong>);
            } else {
              parts.push(<span key={`${lineIndex}-${keyCounter++}`}>{seg}</span>);
            }
          }
        });
      }
    }

    return parts;
  };

  // Split content by newlines and process each line
  const lines = content.split('\n');
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
