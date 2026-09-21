import { render, screen, fireEvent, within } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { Context } from '../Wrapper/Wrapper';
import { WrapperContext } from '../../Types/WrapperContext';
import { createMockContextValue } from '../../test-utils/renderHelpers';
import LanguageSelect, { useSupportedLocale } from './LanguageSelect';

const LANGUAGE_OPTIONS = { 'en-us': 'English', es: 'Español', 'zh-hans': '中文 (简体)' };

const renderSelect = (ui: React.ReactElement, overrides: Partial<WrapperContext> = {}) =>
  render(
    <Context.Provider
      value={createMockContextValue({ config: { language_options: LANGUAGE_OPTIONS } as any, ...overrides })}
    >
      <IntlProvider locale="en">{ui}</IntlProvider>
    </Context.Provider>,
  );

// This MUI version renders the Select trigger as role="button", not "combobox".
const getTrigger = () => screen.getByRole('button');
// MUI renders options into a portal only once the dropdown is open.
const openDropdown = () => fireEvent.mouseDown(getTrigger());

describe('LanguageSelect', () => {
  it('renders one option per configured language', () => {
    renderSelect(<LanguageSelect id="test-select" />);
    openDropdown();

    const options = within(screen.getByRole('listbox')).getAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual(['English', 'Español', '中文 (简体)']);
  });

  it('shows the app locale as selected when no value is given', () => {
    renderSelect(<LanguageSelect id="test-select" />, { locale: 'es' });
    expect(getTrigger()).toHaveTextContent('Español');
  });

  it('falls back to selectLanguage when no onChange is given', () => {
    const selectLanguage = jest.fn();
    renderSelect(<LanguageSelect id="test-select" />, { selectLanguage });
    openDropdown();
    fireEvent.click(screen.getByRole('option', { name: 'Español' }));

    expect(selectLanguage).toHaveBeenCalledWith('es');
  });

  it('reports the code and the display label to onChange', () => {
    const onChange = jest.fn();
    renderSelect(<LanguageSelect id="test-select" onChange={onChange} />);
    openDropdown();
    fireEvent.click(screen.getByRole('option', { name: '中文 (简体)' }));

    expect(onChange).toHaveBeenCalledWith('zh-hans', '中文 (简体)');
  });

  it('leaves the app locale untouched in controlled mode', () => {
    const selectLanguage = jest.fn();
    const onChange = jest.fn();
    renderSelect(<LanguageSelect id="test-select" value="es" onChange={onChange} />, { selectLanguage });

    expect(getTrigger()).toHaveTextContent('Español');

    openDropdown();
    fireEvent.click(screen.getByRole('option', { name: 'English' }));

    expect(onChange).toHaveBeenCalledWith('en-us', 'English');
    expect(selectLanguage).not.toHaveBeenCalled();
  });

  it('prepends a disabled placeholder option when one is given', () => {
    renderSelect(<LanguageSelect id="test-select" placeholder="Select a language" />);
    openDropdown();

    const options = within(screen.getByRole('listbox')).getAllByRole('option');
    expect(options[0]).toHaveTextContent('Select a language');
    expect(options[0]).toHaveAttribute('aria-disabled', 'true');
  });

  it('renders without options instead of throwing before the config loads', () => {
    renderSelect(<LanguageSelect id="test-select" />, { config: undefined });
    expect(getTrigger()).toBeInTheDocument();
  });
});

describe('useSupportedLocale', () => {
  const Probe = () => <span data-testid="locale">{useSupportedLocale()}</span>;
  const read = () => screen.getByTestId('locale').textContent;

  it('passes through a locale the white label offers', () => {
    renderSelect(<Probe />, { locale: 'es' });
    expect(read()).toBe('es');
  });

  it('replaces a stale code that is no longer a config key', () => {
    // `zh` predates the rename to `zh-hans` and survives in localStorage, which
    // Wrapper reads back without validating.
    renderSelect(<Probe />, { locale: 'zh' as any });
    expect(read()).toBe('en-us');
  });

  it('replaces a bare code the config spells regionally', () => {
    renderSelect(<Probe />, { locale: 'en' as any });
    expect(read()).toBe('en-us');
  });

  it('falls back when the locale is unset', () => {
    renderSelect(<Probe />, { locale: undefined as any });
    expect(read()).toBe('en-us');
  });

  it('falls back before the config has loaded', () => {
    renderSelect(<Probe />, { locale: 'es', config: undefined });
    expect(read()).toBe('en-us');
  });
});
