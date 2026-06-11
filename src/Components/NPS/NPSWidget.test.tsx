import { render, screen } from '@testing-library/react';
import NPSWidget from './NPSWidget';
import { useFeatureFlag } from '../Config/configHook';

jest.mock('../Config/configHook', () => ({
  useFeatureFlag: jest.fn(),
}));

jest.mock('./NPSInline', () => {
  return function MockNPSInline({ uuid }: { uuid?: string }) {
    return <div data-testid="nps-inline">Inline NPS - uuid: {uuid}</div>;
  };
});

const mockUseFeatureFlag = useFeatureFlag as jest.MockedFunction<typeof useFeatureFlag>;

describe('NPSWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('feature flag gating', () => {
    it('renders nothing when feature flag is off', () => {
      mockUseFeatureFlag.mockReturnValue(false);

      const { container } = render(<NPSWidget uuid="test-uuid" />);

      expect(container.firstChild).toBeNull();
    });

    it('calls useFeatureFlag with nps_survey', () => {
      mockUseFeatureFlag.mockReturnValue(false);

      render(<NPSWidget uuid="test-uuid" />);

      expect(mockUseFeatureFlag).toHaveBeenCalledWith('nps_survey');
    });

    it('renders NPSInline when feature flag is on', () => {
      mockUseFeatureFlag.mockReturnValue(true);

      render(<NPSWidget uuid="test-uuid" />);

      expect(screen.getByTestId('nps-inline')).toBeInTheDocument();
      expect(screen.getByText(/test-uuid/)).toBeInTheDocument();
    });
  });
});
