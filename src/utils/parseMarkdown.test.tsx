import React from 'react';
import { render, screen } from '@testing-library/react';
import { parseMarkdown } from './parseMarkdown';

const primaryColor = '#0071BC';

describe('parseMarkdown', () => {
  it('renders plain text without any markdown', () => {
    const result = parseMarkdown('This is plain text', primaryColor);
    const { container } = render(<>{result}</>);
    expect(container.textContent).toBe('This is plain text');
  });

  it('renders bold text with **markdown** syntax', () => {
    const result = parseMarkdown('This is **bold text** here', primaryColor);
    const { container } = render(<>{result}</>);

    const strong = container.querySelector('strong');
    expect(strong).toBeInTheDocument();
    expect(strong?.textContent).toBe('bold text');
  });

  it('renders multiple bold segments', () => {
    const result = parseMarkdown('**First** and **second** bold', primaryColor);
    const { container } = render(<>{result}</>);

    const strongs = container.querySelectorAll('strong');
    expect(strongs).toHaveLength(2);
    expect(strongs[0].textContent).toBe('First');
    expect(strongs[1].textContent).toBe('second');
  });

  it('converts URLs to clickable links', () => {
    const result = parseMarkdown('Visit https://example.com for info', primaryColor);
    render(<>{result}</>);

    const link = screen.getByRole('link', { name: 'https://example.com' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveStyle({ color: primaryColor, textDecoration: 'underline' });
  });

  it('handles multiple URLs in the same line', () => {
    const result = parseMarkdown('Visit https://example.com or https://test.org', primaryColor);
    render(<>{result}</>);

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', 'https://example.com');
    expect(links[1]).toHaveAttribute('href', 'https://test.org');
  });

  it('handles both bold text and URLs together', () => {
    const result = parseMarkdown('**Colorado 211:** visit https://www.211colorado.org', primaryColor);
    const { container } = render(<>{result}</>);

    const strong = container.querySelector('strong');
    expect(strong?.textContent).toBe('Colorado 211:');

    const link = screen.getByRole('link', { name: 'https://www.211colorado.org' });
    expect(link).toBeInTheDocument();
  });

  it('preserves line breaks between lines', () => {
    const result = parseMarkdown('Line one\nLine two\nLine three', primaryColor);
    const { container } = render(<>{result}</>);

    const breaks = container.querySelectorAll('br');
    expect(breaks).toHaveLength(2); // Two breaks for three lines
  });

  it('handles complex multi-line content with mixed markdown', () => {
    const content =
      'First line with **bold**\n\nSecond line with https://example.com\n\n**Third** line with both https://test.org';
    const result = parseMarkdown(content, primaryColor);
    const { container } = render(<>{result}</>);

    const strongs = container.querySelectorAll('strong');
    expect(strongs).toHaveLength(2);

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);

    const breaks = container.querySelectorAll('br');
    expect(breaks).toHaveLength(4); // Four breaks for five lines
  });

  it('handles http URLs (not just https)', () => {
    const result = parseMarkdown('Visit http://example.com', primaryColor);
    render(<>{result}</>);

    const link = screen.getByRole('link', { name: 'http://example.com' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'http://example.com');
  });

  it('handles empty content', () => {
    const result = parseMarkdown('', primaryColor);
    const { container } = render(<>{result}</>);
    expect(container.textContent).toBe('');
  });

  it('handles URL at the start of content', () => {
    const result = parseMarkdown('https://example.com is the link', primaryColor);
    render(<>{result}</>);

    const link = screen.getByRole('link', { name: 'https://example.com' });
    expect(link).toBeInTheDocument();
  });

  it('handles URL at the end of content', () => {
    const result = parseMarkdown('The link is https://example.com', primaryColor);
    render(<>{result}</>);

    const link = screen.getByRole('link', { name: 'https://example.com' });
    expect(link).toBeInTheDocument();
  });

  it('handles bold text surrounding a URL', () => {
    const result = parseMarkdown('**Visit https://example.com today**', primaryColor);
    const { container } = render(<>{result}</>);

    // The URL should be a link
    const link = screen.getByRole('link', { name: 'https://example.com' });
    expect(link).toBeInTheDocument();

    // Text before and after URL should be bold
    const strongs = container.querySelectorAll('strong');
    expect(strongs.length).toBeGreaterThan(0);
  });

  it('uses the provided primary color for links', () => {
    const customColor = '#FF5733';
    const result = parseMarkdown('Visit https://example.com', customColor);
    render(<>{result}</>);

    const link = screen.getByRole('link');
    expect(link).toHaveStyle({ color: customColor });
  });

  it('excludes trailing punctuation from URLs', () => {
    const result = parseMarkdown('Visit https://example.com. More info at https://test.org, or https://other.com!', primaryColor);
    render(<>{result}</>);

    // All three URLs should be links without trailing punctuation
    const link1 = screen.getByRole('link', { name: 'https://example.com' });
    const link2 = screen.getByRole('link', { name: 'https://test.org' });
    const link3 = screen.getByRole('link', { name: 'https://other.com' });

    expect(link1).toHaveAttribute('href', 'https://example.com');
    expect(link2).toHaveAttribute('href', 'https://test.org');
    expect(link3).toHaveAttribute('href', 'https://other.com');
  });

  it('preserves bold state across URLs', () => {
    const result = parseMarkdown('**Visit https://example.com for more info**', primaryColor);
    const { container } = render(<>{result}</>);

    // "Visit " should be bold
    const strongs = container.querySelectorAll('strong');
    expect(strongs.length).toBeGreaterThanOrEqual(2);
    expect(strongs[0].textContent).toBe('Visit ');

    // " for more info" should also be bold (this was the bug - it would lose bold after URL)
    expect(strongs[1].textContent).toBe(' for more info');

    // URL should be a link
    const link = screen.getByRole('link', { name: 'https://example.com' });
    expect(link).toBeInTheDocument();
  });

  it('converts literal \\n strings to line breaks', () => {
    // This handles the case where translations from database contain literal "\n" strings
    const result = parseMarkdown('First line\\nSecond line\\nThird line', primaryColor);
    const { container } = render(<>{result}</>);

    // Should have 2 <br> tags for 3 lines
    const breaks = container.querySelectorAll('br');
    expect(breaks).toHaveLength(2);

    // Should contain all three lines of text
    expect(container.textContent).toContain('First line');
    expect(container.textContent).toContain('Second line');
    expect(container.textContent).toContain('Third line');
  });

  it('converts markdown link syntax [text](url) to clickable links', () => {
    const result = parseMarkdown('Visit the [website](https://example.com) for info', primaryColor);
    render(<>{result}</>);

    const link = screen.getByRole('link', { name: 'website' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveStyle({ color: primaryColor, textDecoration: 'underline' });
  });
 
});
