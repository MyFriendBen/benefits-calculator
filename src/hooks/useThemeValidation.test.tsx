import { renderHook } from '@testing-library/react';
import { useThemeValidation } from './useThemeValidation';
import { Context } from '../Components/Wrapper/Wrapper';
import * as styleController from '../Assets/styleController';

// Mock the styleController module
jest.mock('../Assets/styleController', () => ({
  isValidTheme: jest.fn(),
}));

describe('useThemeValidation', () => {
  const mockChangeTheme = jest.fn();

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Context.Provider value={{ setTheme: mockChangeTheme } as any}>
      {children}
    </Context.Provider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should set valid theme name', () => {
    (styleController.isValidTheme as jest.Mock).mockReturnValue(true);

    renderHook(() => useThemeValidation('twoOneOne'), { wrapper });

    expect(styleController.isValidTheme).toHaveBeenCalledWith('twoOneOne');
    expect(mockChangeTheme).toHaveBeenCalledWith('twoOneOne');
  });

  it('should fall back to default for invalid theme', () => {
    (styleController.isValidTheme as jest.Mock).mockReturnValue(false);

    renderHook(() => useThemeValidation('invalidTheme'), { wrapper });

    expect(styleController.isValidTheme).toHaveBeenCalledWith('invalidTheme');
    expect(mockChangeTheme).toHaveBeenCalledWith('default');
  });

  it('should update theme when themeName changes', () => {
    (styleController.isValidTheme as jest.Mock).mockReturnValue(true);

    const { rerender } = renderHook(
      ({ themeName }) => useThemeValidation(themeName),
      { wrapper, initialProps: { themeName: 'default' } }
    );

    expect(mockChangeTheme).toHaveBeenCalledWith('default');
    mockChangeTheme.mockClear();

    rerender({ themeName: 'twoOneOne' });

    expect(mockChangeTheme).toHaveBeenCalledWith('twoOneOne');
  });
});
