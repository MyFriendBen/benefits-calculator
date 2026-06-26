import { test, expect, Browser, BrowserContext } from '@playwright/test';

test.describe('Google Translate Prevention Tests', () => {
  let mockGoogleTranslate: BrowserContext;

  test.beforeEach(async ({ browser }) => {
    // Create a context that simulates Google Translate being present
    mockGoogleTranslate = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      // Inject mock Google Translate script
      serviceWorkers: 'block',
    });
  });

  test.afterEach(async () => {
    await mockGoogleTranslate.close();
  });

  test('verify prevention of Google Translate override for supported languages', async ({ page }) => {
    // First test without Google Translate prevention
    const pageWithoutPrevention = await mockGoogleTranslate.newPage();
    await pageWithoutPrevention.goto('/');

    // Simulate Google Translate initialization with proper waiting
    await pageWithoutPrevention.evaluate(() => {
      return new Promise((resolve) => {
        // Create and inject Google Translate elements
        const div = document.createElement('div');
        div.className = 'goog-te-combo';
        document.body.appendChild(div);

        const googleTranslateScript = document.createElement('script');
        googleTranslateScript.src = 'https://translate.google.com/translate_a/element.js';
        googleTranslateScript.onload = () => {
          // Mock Google Translate object
          (window as any).google = {
            translate: {
              TranslateElement: class {
                constructor() {
                  const div = document.createElement('div');
                  div.className = 'goog-te-combo';
                  document.body.appendChild(div);
                }
              },
            },
          };
          resolve(true);
        };
        document.head.appendChild(googleTranslateScript);
      });
    });

    // Wait for elements to be present
    await pageWithoutPrevention.waitForSelector('.goog-te-combo', { state: 'attached' });
    await pageWithoutPrevention.waitForSelector('script[src*="translate.google.com"]', { state: 'attached' });

    // Verify Google Translate elements are present
    const initialGoogleElements = await pageWithoutPrevention.evaluate(() => ({
      hasGoogTeCombo: document.querySelector('.goog-te-combo') !== null,
      hasTranslateScript: document.querySelector('script[src*="translate.google.com"]') !== null,
      hasGoogleObject: typeof (window as any).google !== 'undefined',
    }));

    // Verify elements are present
    expect(initialGoogleElements.hasGoogTeCombo, 'Google Translate combo box should be present').toBe(true);
    expect(initialGoogleElements.hasTranslateScript, 'Google Translate script should be present').toBe(true);
    expect(initialGoogleElements.hasGoogleObject, 'Google object should be present').toBe(true);

    // Now test with our prevention mechanism
    await page.goto('/');

    // Test supported languages with their correct ISO codes
    const supportedLanguages = [
      { code: 'es', display: 'Español' },
      { code: 'fr', display: 'Français' },
      { code: 'vi', display: 'Tiếng Việt' },
      { code: 'am', display: 'አማርኛ' },
      { code: 'so', display: 'Soomaali' },
      { code: 'ru', display: 'Русский' },
      { code: 'ne', display: 'नेपाली' },
      { code: 'my', display: 'မြန်မာဘာသာစကား' },
      { code: 'zh', display: '中文' },
      { code: 'ar', display: 'عربي' },
      { code: 'sw', display: 'Kiswahili' },
    ];

    for (const lang of supportedLanguages) {
      await page.locator('#language-select').waitFor({ state: 'visible' });
      await page.locator('#language-select').click();
      await page.getByRole('option', { name: lang.display }).click();

      // Verify prevention attributes using the correct ISO code
      await expect(page.locator('html')).toHaveAttribute('lang', lang.code);
      await expect(page.locator('html')).toHaveAttribute('translate', 'no');

      // Try to inject Google Translate
      await page.evaluate(() => {
        const googleTranslateScript = document.createElement('script');
        googleTranslateScript.src = 'https://translate.google.com/translate_a/element.js';
        document.head.appendChild(googleTranslateScript);
      });

      // Verify Google Translate elements are prevented
      const hasGoogleElements = await page.evaluate(() => ({
        hasGoogTeCombo: !!document.querySelector('.goog-te-combo'),
        hasGoogElement: !!document.getElementById('google_translate_element'),
        hasGoogScript: !!document.querySelector('script[src*="translate.google.com"]'),
        hasTranslateAttribute: document.documentElement.getAttribute('translate') === 'no',
      }));

      expect(hasGoogleElements.hasGoogTeCombo).toBe(false);
      expect(hasGoogleElements.hasGoogElement).toBe(false);
      expect(hasGoogleElements.hasTranslateAttribute).toBe(true);
    }
  });

  test('verify HTML language attributes and translation prevention', async ({ page }) => {
    await page.goto('/');

    // Check initial HTML attributes for English
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).not.toHaveAttribute('translate');

    // Switch to Spanish and verify attributes
    await page.locator('#language-select').click();
    await page.getByRole('option', { name: 'Español' }).click();

    // Wait for language change to take effect
    await page.waitForTimeout(1000);

    // Verify Spanish language attributes
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.locator('html')).toHaveAttribute('translate', 'no');

    // Check Google Translate is not active
    const bodyHTML = await page.evaluate(() => document.body.innerHTML);
    expect(bodyHTML).not.toContain('goog-te');
    expect(bodyHTML).not.toContain('google-translate');

    // Test switching back to English
    await page.locator('#language-select').click();
    await page.getByRole('option', { name: 'English' }).click();

    // Verify English attributes are restored
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).not.toHaveAttribute('translate');
  });

  test('verify language persistence across page navigation', async ({ page }) => {
    // Start in Spanish
    await page.goto('/');
    await page.locator('#language-select').click();
    await page.getByRole('option', { name: 'Español' }).click();

    // Verify initial Spanish setup
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.locator('html')).toHaveAttribute('translate', 'no');

    // Navigate through several pages
    await page.getByRole('button', { name: 'EMPEZAR' }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.locator('html')).toHaveAttribute('translate', 'no');

    await page.locator('#state-source-select').click();
    await page.getByRole('option', { name: 'North Carolina' }).click();
    await page.getByRole('button', { name: 'CONTINUAR' }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.locator('html')).toHaveAttribute('translate', 'no');
  });

  test('verify Google Translate works for unsupported languages', async ({ page }) => {
    await page.goto('/');

    // Verify English (default) allows Google Translate
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).not.toHaveAttribute('translate');

    // Verify non-supported language doesn't prevent Google Translate
    const unsupportedLang = 'ja'; // Japanese or any unsupported language
    await page.evaluate((lang) => {
      document.documentElement.setAttribute('lang', lang);
    }, unsupportedLang);

    // Verify translate attribute is not set
    await expect(page.locator('html')).not.toHaveAttribute('translate');
  });

  test('verify HTML lang attribute updates correctly', async ({ page }) => {
    await page.goto('/');

    // Test language switching
    const testCases = [
      { select: 'English', expectedLang: 'en', expectPrevent: false },
      { select: 'Español', expectedLang: 'es', expectPrevent: true },
      { select: 'Tiếng Việt', expectedLang: 'vi', expectPrevent: true },
      { select: 'አማርኛ', expectedLang: 'am', expectPrevent: true },
      { select: 'Soomaali', expectedLang: 'so', expectPrevent: true },
      { select: 'Русский', expectedLang: 'ru', expectPrevent: true },
      { select: 'नेपाली', expectedLang: 'ne', expectPrevent: true },
      { select: 'မြန်မာဘာသာစကား', expectedLang: 'my', expectPrevent: true },
      { select: '中文', expectedLang: 'zh', expectPrevent: true },
      { select: 'عربي', expectedLang: 'ar', expectPrevent: true },
      { select: 'Kiswahili', expectedLang: 'sw', expectPrevent: true },
    ];

    for (const { select, expectedLang, expectPrevent } of testCases) {
      await page.locator('#language-select').click();
      await page.getByRole('option', { name: select }).click();
      await page.waitForTimeout(1000);

      // Verify language attribute
      await expect(page.locator('html')).toHaveAttribute('lang', expectedLang);

      // According to HtmlLangUpdater.tsx, all non-English languages should have translate="no"
      if (expectedLang !== 'en') {
        await expect(page.locator('html')).toHaveAttribute('translate', 'no');
      } else {
        await expect(page.locator('html')).not.toHaveAttribute('translate');
      }
    }
  });
});
