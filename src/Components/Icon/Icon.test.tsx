import { render, screen } from '@testing-library/react';
import { Icon } from './Icon';

describe('Icon', () => {
  it('renders a valid Lucide icon as an svg', () => {
    const { container } = render(<Icon name="house" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders nothing and warns for an unknown icon name', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = render(<Icon name="not-a-real-icon-xyz" />);
    expect(container.querySelector('svg')).toBeNull();
    expect(warn).toHaveBeenCalledWith('Icon "not-a-real-icon-xyz" not found in Lucide icons');
    warn.mockRestore();
  });

  it('converts kebab-case to PascalCase for lookup', () => {
    // briefcase-business → BriefcaseBusiness (valid Lucide icon)
    const { container } = render(<Icon name="briefcase-business" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('forwards className to the svg element', () => {
    const { container } = render(<Icon name="house" className="my-icon" />);
    expect(container.querySelector('svg.my-icon')).toBeInTheDocument();
  });

  it('forwards aria-label to the svg element', () => {
    const { container } = render(<Icon name="house" aria-label="home icon" />);
    expect(container.querySelector('svg[aria-label="home icon"]')).toBeInTheDocument();
  });

  it('forwards size prop to the svg element', () => {
    const { container } = render(<Icon name="house" width={48} height={48} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '48');
    expect(svg).toHaveAttribute('height', '48');
  });
});
