import { renderHook } from '@testing-library/react';
import { useAppInitialization } from './useAppInitialization';
import { useThemeValidation } from './useThemeValidation';
import { usePageTracking } from './usePageTracking';
import { useHttpsRedirect } from './useHttpsRedirect';
import { useUrlParametersInit } from './useUrlParametersInit';
import { useScrollToTop } from './useScrollToTop';

// Mock all the individual hooks
jest.mock('./useThemeValidation');
jest.mock('./usePageTracking');
jest.mock('./useHttpsRedirect');
jest.mock('./useUrlParametersInit');
jest.mock('./useScrollToTop');

describe('useAppInitialization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call all initialization hooks', () => {
    renderHook(() => useAppInitialization('default'));

    expect(useThemeValidation).toHaveBeenCalledWith('default');
    expect(usePageTracking).toHaveBeenCalled();
    expect(useHttpsRedirect).toHaveBeenCalled();
    expect(useUrlParametersInit).toHaveBeenCalled();
    expect(useScrollToTop).toHaveBeenCalled();
  });

  it('should pass themeName to useThemeValidation', () => {
    renderHook(() => useAppInitialization('twoOneOne'));

    expect(useThemeValidation).toHaveBeenCalledWith('twoOneOne');
  });
});
