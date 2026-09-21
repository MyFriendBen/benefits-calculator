import { ReactNode, useContext, useState } from 'react';
import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, SxProps, Theme } from '@mui/material';
import { useConfig } from '../Config/configHook';
import { Context } from '../Wrapper/Wrapper';

export type LanguageOptions = {
  [key: string]: string;
};

type LanguageSelectProps = {
  /** Must be unique per rendered dropdown — a page can show more than one. */
  id: string;
  /**
   * Language code to show as selected. Defaults to the app locale, which is what
   * the headers and the language step both want. The share flow passes its own
   * value so that picking a recipient's language never changes the sender's UI.
   */
  value?: string;
  /**
   * Receives the newly picked language code and its display label. Defaults to
   * `selectLanguage`, so omitting it keeps the "this dropdown re-languages the
   * whole app" behavior.
   */
  onChange?: (languageCode: string, languageLabel: string) => void;
  /** When set, the Select is wrapped in a FormControl with this as its InputLabel. */
  label?: ReactNode;
  /** Prepended as a disabled, unselectable first option. */
  placeholder?: ReactNode;
  variant?: 'standard' | 'outlined';
  /** Tints the dropdown arrow; the co-branded headers each use their own brand color. */
  iconColor?: string;
  /** Tints the menu item text; likewise brand-specific. */
  menuItemColor?: string;
  ariaLabel?: string;
  formControlSx?: SxProps<Theme>;
};

/**
 * The single language dropdown. Options always come from the white label's
 * `language_options` config rather than a hardcoded list, because the option set
 * differs per white label and the codes there (e.g. `zh-hans`) are the ones the
 * translations endpoint expects.
 */
const LanguageSelect = ({
  id,
  value,
  onChange,
  label,
  placeholder,
  variant = 'standard',
  iconColor,
  menuItemColor,
  ariaLabel,
  formControlSx,
}: LanguageSelectProps) => {
  const { locale, selectLanguage } = useContext(Context);
  // Defaulted so the component can render before the config resolves (and in
  // tests) instead of throwing the way a bare useConfig would.
  const languageOptions = useConfig<LanguageOptions>('language_options', {});
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (event: SelectChangeEvent) => {
    const languageCode = event.target.value;

    if (onChange) {
      onChange(languageCode, languageOptions[languageCode] ?? languageCode);
      return;
    }

    selectLanguage(languageCode);
  };

  const menuItems = Object.entries(languageOptions).map(([languageCode, languageLabel]) => (
    <MenuItem value={languageCode} key={languageCode} sx={menuItemColor ? { color: menuItemColor } : undefined}>
      {languageLabel}
    </MenuItem>
  ));

  if (placeholder) {
    menuItems.unshift(
      <MenuItem value="disabled-select" key="disabled-select" disabled>
        {placeholder}
      </MenuItem>,
    );
  }

  const select = (
    <Select
      // Only point at a label that actually exists; the dropdown otherwise
      // relies on `aria-label`, and a dangling labelId would override it.
      labelId={label ? `${id}-label` : undefined}
      id={id}
      value={value ?? locale ?? ''}
      label={label}
      onChange={handleChange}
      aria-label={ariaLabel}
      variant={variant}
      // `disableUnderline` belongs to the standard variant's input only; passing
      // it to an OutlinedInput leaks an unknown DOM prop.
      {...(variant === 'standard' ? { disableUnderline: true } : {})}
      open={isOpen}
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
      sx={iconColor ? { '& .MuiSvgIcon-root': { color: iconColor } } : undefined}
    >
      {menuItems}
    </Select>
  );

  if (!label) {
    return select;
  }

  return (
    <FormControl sx={formControlSx}>
      <InputLabel id={`${id}-label`}>{label}</InputLabel>
      {select}
    </FormControl>
  );
};

export default LanguageSelect;
