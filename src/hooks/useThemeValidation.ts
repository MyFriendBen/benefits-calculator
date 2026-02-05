import { useEffect, useContext } from 'react';
import { Context } from '../Components/Wrapper/Wrapper';
import { isValidTheme } from '../Assets/styleController';

/**
 * Validates and sets the theme from the referrer parameter.
 * Falls back to 'default' theme if the provided theme name is invalid.
 */
export const useThemeValidation = (themeName: string) => {
  const { setTheme: changeTheme } = useContext(Context);

  useEffect(() => {
    // Validate theme name and fall back to 'default' if invalid
    const validatedTheme = isValidTheme(themeName) ? themeName : 'default';
    changeTheme(validatedTheme);
  }, [themeName, changeTheme]);
};
