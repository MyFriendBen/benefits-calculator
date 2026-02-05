import { renderHook } from '@testing-library/react';
import { useUrlParametersInit } from './useUrlParametersInit';
import { Context } from '../Components/Wrapper/Wrapper';
import { MemoryRouter } from 'react-router-dom';

describe('useUrlParametersInit', () => {
  const mockSetFormData = jest.fn();
  const defaultFormData = {
    immutableReferrer: undefined,
    referralSource: '',
    isTest: false,
    externalID: undefined,
    path: undefined,
    urlSearchParams: '',
  };

  const createWrapper = (initialPath: string, formData = defaultFormData) => {
    return ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={[initialPath]}>
        <Context.Provider value={{ formData, setFormData: mockSetFormData } as any}>
          {children}
        </Context.Provider>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize URL parameters from query string', () => {
    const wrapper = createWrapper('/?referrer=google&test=true&externalid=123&path=custom');

    renderHook(() => useUrlParametersInit(), { wrapper });

    expect(mockSetFormData).toHaveBeenCalledWith(
      expect.objectContaining({
        immutableReferrer: 'google',
        referralSource: 'google',
        isTest: true,
        externalID: '123',
        path: 'custom',
        urlSearchParams: '?referrer=google&test=true&externalid=123&path=custom',
      })
    );
  });

  it('should use utm_source as fallback for referrer', () => {
    const wrapper = createWrapper('/?utm_source=facebook');

    renderHook(() => useUrlParametersInit(), { wrapper });

    expect(mockSetFormData).toHaveBeenCalledWith(
      expect.objectContaining({
        immutableReferrer: 'facebook',
        referralSource: 'facebook',
      })
    );
  });

  it('should prioritize stored referrer over URL params', () => {
    const formDataWithReferrer = {
      ...defaultFormData,
      immutableReferrer: 'stored-referrer',
    };
    const wrapper = createWrapper('/?referrer=new-referrer', formDataWithReferrer);

    renderHook(() => useUrlParametersInit(), { wrapper });

    expect(mockSetFormData).toHaveBeenCalledWith(
      expect.objectContaining({
        immutableReferrer: 'stored-referrer', // Should keep stored value
      })
    );
  });

  it('should default path to "default" when not provided', () => {
    const wrapper = createWrapper('/');

    renderHook(() => useUrlParametersInit(), { wrapper });

    expect(mockSetFormData).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'default',
      })
    );
  });

  it('should preserve existing formData values when URL params not provided', () => {
    const existingFormData = {
      ...defaultFormData,
      referralSource: 'existing-source',
      isTest: true,
    };
    const wrapper = createWrapper('/', existingFormData);

    renderHook(() => useUrlParametersInit(), { wrapper });

    expect(mockSetFormData).toHaveBeenCalledWith(
      expect.objectContaining({
        referralSource: 'existing-source',
        isTest: true,
      })
    );
  });

  it('should only run once on mount', () => {
    const wrapper = createWrapper('/?referrer=test');

    const { rerender } = renderHook(() => useUrlParametersInit(), { wrapper });

    expect(mockSetFormData).toHaveBeenCalledTimes(1);

    rerender();

    // Should still only be called once
    expect(mockSetFormData).toHaveBeenCalledTimes(1);
  });

  it('should handle test param as boolean', () => {
    const wrapper = createWrapper('/?test=false');

    renderHook(() => useUrlParametersInit(), { wrapper });

    expect(mockSetFormData).toHaveBeenCalledWith(
      expect.objectContaining({
        isTest: false, // Boolean(searchParams.get('test')) returns true if param exists
      })
    );
  });
});
