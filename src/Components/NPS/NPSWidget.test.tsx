import { render, screen } from '@testing-library/react';
import NPSWidget from './NPSWidget';
import { useExperiment } from '../../hooks/useExperiment';

// Mock the useExperiment hook
jest.mock('../../hooks/useExperiment', () => ({
  useExperiment: jest.fn(),
}));

// Mock the child components
jest.mock('./NPSFloating', () => {
  return function MockNPSFloating({ uuid }: { uuid?: string }) {
    return <div data-testid="nps-floating">Floating NPS - uuid: {uuid}</div>;
  };
});

jest.mock('./NPSInline', () => {
  return function MockNPSInline({ uuid }: { uuid?: string }) {
    return <div data-testid="nps-inline">Inline NPS - uuid: {uuid}</div>;
  };
});

const mockUseExperiment = useExperiment as jest.MockedFunction<typeof useExperiment>;

describe('NPSWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when variant is off', () => {
    mockUseExperiment.mockReturnValue('off');

    const { container } = render(<NPSWidget uuid="test-uuid" />);

    expect(container.firstChild).toBeNull();
  });

  it('renders NPSFloating when variant is floating', () => {
    mockUseExperiment.mockReturnValue('floating');

    render(<NPSWidget uuid="test-uuid" />);

    expect(screen.getByTestId('nps-floating')).toBeInTheDocument();
    expect(screen.queryByTestId('nps-inline')).not.toBeInTheDocument();
  });

  it('renders NPSInline when variant is inline', () => {
    mockUseExperiment.mockReturnValue('inline');

    render(<NPSWidget uuid="test-uuid" />);

    expect(screen.getByTestId('nps-inline')).toBeInTheDocument();
    expect(screen.queryByTestId('nps-floating')).not.toBeInTheDocument();
  });

  it('passes uuid to NPSFloating', () => {
    mockUseExperiment.mockReturnValue('floating');

    render(<NPSWidget uuid="my-test-uuid" />);

    expect(screen.getByText(/my-test-uuid/)).toBeInTheDocument();
  });

  it('passes uuid to NPSInline', () => {
    mockUseExperiment.mockReturnValue('inline');

    render(<NPSWidget uuid="my-test-uuid" />);

    expect(screen.getByText(/my-test-uuid/)).toBeInTheDocument();
  });

  it('calls useExperiment with correct parameters', () => {
    mockUseExperiment.mockReturnValue('off');

    render(<NPSWidget uuid="test-uuid" />);

    expect(mockUseExperiment).toHaveBeenCalledWith('npsVariant', 'off');
  });
});
