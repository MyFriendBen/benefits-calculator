import { renderHook } from '@testing-library/react';
import { useTrackEvent } from './useTrackEvent';
import { trackEvent } from './index';

// These assert the screener_path contract the CESN two-path energy funnel relies
// on: path rides on every CESN event (so early drop-offs are still classifiable),
// homeowner is the default when no renter path is chosen, and non-CESN screeners
// never carry the param.

jest.mock('./index', () => ({
  trackEvent: jest.fn(),
  trackItemList: jest.fn(),
}));

// Drive screener_state / formData.path per test via these mutable values.
let mockParams: { whiteLabel?: string; uuid?: string } = {};
let mockFormPath: string | undefined;

jest.mock('react-router-dom', () => ({
  useParams: () => mockParams,
}));

jest.mock('../../Components/Wrapper/Wrapper', () => ({
  Context: { Provider: ({ children }: { children: unknown }) => children },
  DEFAULT_WHITE_LABEL: '_default',
  getUuidFromUrl: () => undefined,
  getWhiteLabelFromUrl: () => '_default',
}));

// useTrackEvent reads formData.path via useContext(Context); stub React's
// useContext to return a minimal Wrapper context shaped by mockFormPath.
jest.mock('react', () => {
  const actual = jest.requireActual('react');
  return {
    ...actual,
    useContext: () => ({ whiteLabel: undefined, formData: { path: mockFormPath } }),
  };
});

const trackEventMock = trackEvent as jest.MockedFunction<typeof trackEvent>;

describe('useTrackEvent screener_path', () => {
  beforeEach(() => {
    trackEventMock.mockClear();
    mockParams = {};
    mockFormPath = undefined;
  });

  const lastPayload = () =>
    trackEventMock.mock.calls[trackEventMock.mock.calls.length - 1][1] as Record<string, unknown>;

  it('marks a CESN renter screening as "renter"', () => {
    mockParams = { whiteLabel: 'cesn', uuid: 'abc' };
    mockFormPath = 'renter';
    const { result } = renderHook(() => useTrackEvent());
    result.current('screener_form_start', {});
    expect(lastPayload().screener_path).toBe('renter');
  });

  it('marks a CESN homeowner screening ("default" path) as "homeowner"', () => {
    mockParams = { whiteLabel: 'cesn', uuid: 'abc' };
    mockFormPath = 'default';
    const { result } = renderHook(() => useTrackEvent());
    result.current('screener_form_start', {});
    expect(lastPayload().screener_path).toBe('homeowner');
  });

  it('omits screener_path when the CESN path is unknown', () => {
    mockParams = { whiteLabel: 'cesn', uuid: 'abc' };
    mockFormPath = undefined;
    const { result } = renderHook(() => useTrackEvent());
    result.current('screener_form_start', {});
    expect(lastPayload()).not.toHaveProperty('screener_path');
  });

  it('omits screener_path for a non-CESN screening', () => {
    mockParams = { whiteLabel: 'co', uuid: 'abc' };
    mockFormPath = 'renter';
    const { result } = renderHook(() => useTrackEvent());
    result.current('screener_form_start', {});
    expect(lastPayload()).not.toHaveProperty('screener_path');
  });
});
