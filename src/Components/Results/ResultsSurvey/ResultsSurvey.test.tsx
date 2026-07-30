import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import ResultsSurvey from './ResultsSurvey';
import { useConfig, useFeatureFlag } from '../../Config/configHook';
import dataLayerPush from '../../../Assets/analytics';

jest.mock('../../Config/configHook', () => ({
  useFeatureFlag: jest.fn(),
  useConfig: jest.fn(),
}));

jest.mock('../../../Assets/analytics', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockUseFeatureFlag = useFeatureFlag as jest.MockedFunction<typeof useFeatureFlag>;
const mockUseConfig = useConfig as jest.MockedFunction<typeof useConfig>;
const mockDataLayerPush = dataLayerPush as jest.MockedFunction<typeof dataLayerPush>;

const SURVEY_URL = 'https://example.com/survey';

const SURVEY_CONFIG = {
  link: SURVEY_URL,
  intro: 'Help us improve MyFriendBen — tell us about your experience.',
  button: 'Share your feedback',
};
const EMPTY_SURVEY = { link: '', intro: null, button: null };

function renderResultsSurvey() {
  return render(
    <IntlProvider locale="en-us" messages={{}}>
      <ResultsSurvey />
    </IntlProvider>,
  );
}

describe('ResultsSurvey', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseConfig.mockReturnValue(SURVEY_CONFIG);
  });

  describe('gating', () => {
    it('renders nothing when the feature flag is off', () => {
      mockUseFeatureFlag.mockReturnValue(false);

      const { container } = renderResultsSurvey();

      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when the flag is on but no survey link is configured', () => {
      mockUseFeatureFlag.mockReturnValue(true);
      mockUseConfig.mockReturnValue(EMPTY_SURVEY);

      const { container } = renderResultsSurvey();

      expect(container.firstChild).toBeNull();
    });

    it('reads the nc_results_survey flag and the results_survey config', () => {
      mockUseFeatureFlag.mockReturnValue(false);

      renderResultsSurvey();

      expect(mockUseFeatureFlag).toHaveBeenCalledWith('nc_results_survey');
      expect(mockUseConfig).toHaveBeenCalledWith('results_survey', expect.anything());
    });
  });

  describe('when enabled with a configured link', () => {
    beforeEach(() => {
      mockUseFeatureFlag.mockReturnValue(true);
    });

    it('renders the configured intro text and survey link', () => {
      renderResultsSurvey();

      expect(screen.getByText('Help us improve MyFriendBen — tell us about your experience.')).toBeInTheDocument();

      const link = screen.getByRole('link', { name: /share your feedback/i });
      expect(link).toHaveAttribute('href', SURVEY_URL);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('fires a tracked outbound_click event when the link is clicked', () => {
      renderResultsSurvey();

      fireEvent.click(screen.getByRole('link', { name: /share your feedback/i }));

      expect(mockDataLayerPush).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'outbound_click',
          action: 'nc_results_survey_click',
          label: 'NC Results Survey',
          url: SURVEY_URL,
        }),
      );
    });
  });
});
