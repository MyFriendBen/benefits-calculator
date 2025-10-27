import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider, FormattedMessage } from 'react-intl';
import SystemBanner, { BannerMessage } from './SystemBanner';
import { Context } from '../../Wrapper/Wrapper';
import React from 'react';

const mockTheme = {
  primaryColor: '#0071BC',
  secondaryBackgroundColor: '#E7F6F8',
};

const mockConfig = {
  state: { name: 'Colorado' },
};

const mockContext = {
  theme: mockTheme,
  config: mockConfig,
};

const mockBanners: BannerMessage[] = [
  {
    id: 'snap_nov_2025_hold',
    title: 'Urgent: SNAP Benefits for November 2025 are on Hold',
    content:
      'Because of the federal government shutdown, the U.S. Department of Agriculture (USDA) has not released the funds that states use to pay SNAP (food assistance) benefits. This means Colorado is unable to issue November SNAP benefits to clients until the federal government restores funding.\n\nWe will update this banner as soon as we have new information.\n\nTo find other food resources in your area, please contact:\n\n**Colorado 211:** call 2-1-1 or 866-760-6489 or visit https://www.211colorado.org',
    enabled: true,
    priority: 1,
  },
];

const renderWithContext = (component: React.ReactElement, contextValue = mockContext) => {
  return render(
    <IntlProvider locale="en" defaultLocale="en">
      <Context.Provider value={contextValue as any}>{component}</Context.Provider>
    </IntlProvider>,
  );
};

describe('SystemBanner', () => {
  it('renders nothing when no banners are provided', () => {
    const { container } = renderWithContext(<SystemBanner banners={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when all banners are disabled', () => {
    const disabledBanners = mockBanners.map((b) => ({ ...b, enabled: false }));
    const { container } = renderWithContext(<SystemBanner banners={disabledBanners} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders banner collapsed by default', () => {
    renderWithContext(<SystemBanner banners={mockBanners} />);

    expect(screen.getByText('Urgent: SNAP Benefits for November 2025 are on Hold')).toBeInTheDocument();
    expect(screen.queryByText(/Because of the federal government shutdown/)).not.toBeVisible();
    expect(screen.getByText('More')).toBeInTheDocument();
  });

  it('expands banner when More button is clicked', () => {
    renderWithContext(<SystemBanner banners={mockBanners} />);

    const moreButton = screen.getByText('More');
    fireEvent.click(moreButton);

    expect(screen.getByText(/Because of the federal government shutdown/)).toBeVisible();
    expect(screen.getByText('Less')).toBeInTheDocument();
  });

  it('collapses banner when Less button is clicked after expanding', () => {
    renderWithContext(<SystemBanner banners={mockBanners} />);

    // Initially collapsed, shows More button
    expect(screen.getByText('More')).toBeInTheDocument();
    expect(screen.queryByText('Less')).not.toBeInTheDocument();

    // Expand the banner
    const moreButton = screen.getByText('More');
    fireEvent.click(moreButton);

    // After clicking More, should show Less button
    expect(screen.getByText('Less')).toBeInTheDocument();
    expect(screen.queryByText('More')).not.toBeInTheDocument();

    // Now collapse it again
    const lessButton = screen.getByText('Less');
    fireEvent.click(lessButton);

    // After clicking Less, the More button should appear again
    expect(screen.getByText('More')).toBeInTheDocument();
    expect(screen.queryByText('Less')).not.toBeInTheDocument();
  });

  it('replaces template variables in content and renders bold text and links', () => {
    renderWithContext(<SystemBanner banners={mockBanners} />);

    // Expand the banner to see the content
    const moreButton = screen.getByText('More');
    fireEvent.click(moreButton);

    expect(screen.getByText(/Colorado is unable to issue November SNAP benefits/)).toBeInTheDocument();

    // Check that the link is rendered and clickable
    const link = screen.getByRole('link', { name: 'https://www.211colorado.org' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://www.211colorado.org');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');

    // Check that "Colorado 211:" is bold
    const boldText = screen.getByText(/Colorado 211:/);
    expect(boldText.tagName).toBe('STRONG');
  });

  it('renders multiple banners in priority order', () => {
    const multipleBanners: BannerMessage[] = [
      {
        id: 'banner_2',
        title: 'Second Banner',
        content: 'Second content',
        enabled: true,
        priority: 2,
      },
      {
        id: 'banner_1',
        title: 'First Banner',
        content: 'First content',
        enabled: true,
        priority: 1,
      },
    ];

    renderWithContext(<SystemBanner banners={multipleBanners} />);

    // Check that banners are rendered in priority order
    const alerts = screen.getAllByRole('alert');
    expect(alerts).toHaveLength(2);
    expect(alerts[0]).toHaveTextContent('First Banner');
    expect(alerts[1]).toHaveTextContent('Second Banner');
  });

  it('renders banner content exactly as configured', () => {
    const contextWithoutConfig = {
      theme: mockTheme,
      config: undefined,
    };

    renderWithContext(<SystemBanner banners={mockBanners} />, contextWithoutConfig);

    // Expand the banner to see the content
    const moreButton = screen.getByText('More');
    fireEvent.click(moreButton);

    // Should render exactly as configured in the banner message
    expect(screen.getByText(/Colorado is unable to issue November SNAP benefits/)).toBeInTheDocument();
  });

  it('maintains independent state for multiple banners', () => {
    const multipleBanners: BannerMessage[] = [
      mockBanners[0],
      {
        id: 'banner_2',
        title: 'Second Banner',
        content: 'Second content',
        enabled: true,
        priority: 2,
      },
    ];

    renderWithContext(<SystemBanner banners={multipleBanners} />);

    const moreButtons = screen.getAllByText('More');

    // Expand first banner
    fireEvent.click(moreButtons[0]);

    // First banner should be expanded, second should remain collapsed
    expect(screen.getByText(/Because of the federal government shutdown/)).toBeVisible();
    expect(screen.queryByText('Second content')).not.toBeVisible();
  });

  it('has proper accessibility attributes', () => {
    renderWithContext(<SystemBanner banners={mockBanners} />);

    // More button should have aria-expanded=false initially
    const moreButton = screen.getByText('More');
    expect(moreButton).toHaveAttribute('aria-expanded', 'false');
    expect(moreButton).toHaveAttribute('aria-controls', 'system-banner-content-snap_nov_2025_hold');

    // Expand the banner
    fireEvent.click(moreButton);

    // Less button should have aria-expanded=true
    const lessButton = screen.getByText('Less');
    expect(lessButton).toHaveAttribute('aria-expanded', 'true');
    expect(lessButton).toHaveAttribute('aria-controls', 'system-banner-content-snap_nov_2025_hold');
  });

  it('handles FormattedMessage components for title and content', () => {
    // Simulate what the config transformation does - creates FormattedMessage components
    const translatedBanners: BannerMessage[] = [
      {
        id: 'translated_banner',
        title: <FormattedMessage id="banner.title" defaultMessage="Translated Title" />,
        content: <FormattedMessage id="banner.content" defaultMessage="Translated content with **bold** text" />,
        enabled: true,
        priority: 1,
      },
    ];

    renderWithContext(<SystemBanner banners={translatedBanners} />);

    // Title should be rendered as text
    expect(screen.getByText('Translated Title')).toBeInTheDocument();

    // Expand to see content
    fireEvent.click(screen.getByText('More'));

    // Content should be parsed and bold text should be rendered
    expect(screen.getByText(/Translated content/)).toBeInTheDocument();
    const { container } = render(
      <IntlProvider locale="en">
        <Context.Provider value={mockContext as any}>
          <SystemBanner banners={translatedBanners} />
        </Context.Provider>
      </IntlProvider>,
    );
    const strongs = container.querySelectorAll('strong');
    expect(strongs.length).toBeGreaterThan(0);
  });
});
