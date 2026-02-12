import { render, screen } from '@testing-library/react';
import NPSWidget from './NPSWidget';
import { useExperiment } from '../../hooks/useExperiment';
import { useFeatureFlag } from '../Config/configHook';

jest.mock('../../hooks/useExperiment', () => ({
  useExperiment: jest.fn(),
}));

jest.mock('../Config/configHook', () => ({
  useFeatureFlag: jest.fn(),
}));

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
const mockUseFeatureFlag = useFeatureFlag as jest.MockedFunction<typeof useFeatureFlag>;

describe('NPSWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('feature flag gating', () => {
    it('renders nothing when feature flag is off', () => {
      mockUseFeatureFlag.mockReturnValue(false);
      mockUseExperiment.mockReturnValue('floating');

      const { container } = render(<NPSWidget uuid="test-uuid" />);

      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when feature flag is off even with inline variant', () => {
      mockUseFeatureFlag.mockReturnValue(false);
      mockUseExperiment.mockReturnValue('inline');

      const { container } = render(<NPSWidget uuid="test-uuid" />);

      expect(container.firstChild).toBeNull();
    });

    it('calls useFeatureFlag with nps_survey', () => {
      mockUseFeatureFlag.mockReturnValue(false);
      mockUseExperiment.mockReturnValue('off');

      render(<NPSWidget uuid="test-uuid" />);

      expect(mockUseFeatureFlag).toHaveBeenCalledWith('nps_survey');
    });
  });

  describe('experiment variant routing', () => {
    it('renders nothing when variant is off', () => {
      mockUseFeatureFlag.mockReturnValue(true);
      mockUseExperiment.mockReturnValue('off');

      const { container } = render(<NPSWidget uuid="test-uuid" />);

      expect(container.firstChild).toBeNull();
    });

    it('renders NPSFloating when variant is floating', () => {
      mockUseFeatureFlag.mockReturnValue(true);
      mockUseExperiment.mockReturnValue('floating');

      render(<NPSWidget uuid="test-uuid" />);

      expect(screen.getByTestId('nps-floating')).toBeInTheDocument();
      expect(screen.queryByTestId('nps-inline')).not.toBeInTheDocument();
    });

    it('renders NPSInline when variant is inline', () => {
      mockUseFeatureFlag.mockReturnValue(true);
      mockUseExperiment.mockReturnValue('inline');

      render(<NPSWidget uuid="test-uuid" />);

      expect(screen.getByTestId('nps-inline')).toBeInTheDocument();
      expect(screen.queryByTestId('nps-floating')).not.toBeInTheDocument();
    });

    it('passes uuid to NPSFloating', () => {
      mockUseFeatureFlag.mockReturnValue(true);
      mockUseExperiment.mockReturnValue('floating');

      render(<NPSWidget uuid="my-test-uuid" />);

      expect(screen.getByText(/my-test-uuid/)).toBeInTheDocument();
    });

    it('passes uuid to NPSInline', () => {
      mockUseFeatureFlag.mockReturnValue(true);
      mockUseExperiment.mockReturnValue('inline');

      render(<NPSWidget uuid="my-test-uuid" />);

      expect(screen.getByText(/my-test-uuid/)).toBeInTheDocument();
    });

    it('calls useExperiment with correct parameters', () => {
      mockUseFeatureFlag.mockReturnValue(true);
      mockUseExperiment.mockReturnValue('off');

      render(<NPSWidget uuid="test-uuid" />);

      expect(mockUseExperiment).toHaveBeenCalledWith('npsVariant', 'off');
    });
  });
});
