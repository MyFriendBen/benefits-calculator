import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import SystemBanner, { BannerMessage } from './SystemBanner';
import { Context } from '../../Wrapper/Wrapper';

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
});
