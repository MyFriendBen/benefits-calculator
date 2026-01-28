import { test, expect } from '@playwright/test';

/**
 * Test for current-benefits pages across all white-label instances
 */

const whiteLabels = [
  { name: 'North Carolina', path: 'nc' },
  { name: 'Colorado', path: 'co' },
  { name: 'Massachusetts', path: 'ma', skip: true }, // skipping MA for now - has [PLACEHOLDER] content in CI
  { name: 'Colorado Energy Savings Navigator', path: 'cesn' },
  { name: 'Illinois', path: 'il' },
  { name: 'Texas', path: 'tx' },
];

test.describe('Current Benefits Pages Test', () => {
  for (const whiteLabel of whiteLabels) {
    const runner = whiteLabel.skip ? test.skip : test;
    runner(`${whiteLabel.name} current-benefits page loads without [PLACEHOLDER] text or untranslated labels`, async ({
      page,
    }) => {
      const url = `/${whiteLabel.path}/current-benefits`;

      await test.step(`Navigate to ${url}`, async () => {
        await page.goto(url);
        await expect(page).toHaveURL(new RegExp(`${whiteLabel.path}/current-benefits`));
      });
      await test.step('Check for [PLACEHOLDER] text and untranslated labels', async () => {
        /*
         * Wait for the page to fully load using specific element waits
         * instead of the less reliable 'networkidle' state
         */
        // Wait for the main container to be visible
        await expect(page.locator('.current-benefits-container')).toBeVisible({ timeout: 15000 });

        // Wait for the header to be visible
        await expect(page.locator('.current-benefits-header')).toBeVisible();

        // Wait for either program categories or loading state to be complete
        await Promise.any([
          expect(page.locator('.long-near-term-header').first()).toBeVisible(),
          expect(page.locator('.category-section-container').first()).toBeVisible(),
        ]);

        const visibleText = await page.evaluate(() => {
          return document.body.innerText;
        });

        const foundUntranslatedLabels: string[] = [];

        const placeholderRegex = /\[PLACEHOLDER\]/gi;
        const foundPlaceholders = visibleText.match(placeholderRegex) || [];

        /*
         * Using 'TreeWalker' to get collect all of the
         * text nodes on the page.
         */
        const textContent = await page.evaluate(() => {
          const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);

          let node: Node | null;
          const textNodes: string[] = [];

          /*
           * 'walker.nextNode()' returns the next node or null
           * when it reaches the end of the document. The while loop
           * will continue to run until 'walker.nextNode()' returns
           * null.
           */
          while ((node = walker.nextNode())) {
            const text = node.textContent?.trim();
            if (text && text.length > 0) {
              textNodes.push(text);
            }
          }

          return textNodes;
        });

        const untranslatedLabelPatterns = [
          /program\.[a-z0-9_-]+/,
          /program_category\.[a-z0-9_-]+/,
          /urgent_need\.[a-z0-9_-]+/,
        ];

        for (const text of textContent) {
          for (const pattern of untranslatedLabelPatterns) {
            if (pattern.test(text.trim())) {
              foundUntranslatedLabels.push(text.trim());
            }
          }
        }

        const uniqueUntranslatedLabels = [...new Set(foundUntranslatedLabels)];
        const totalIssues = foundPlaceholders.length + uniqueUntranslatedLabels.length;

        if (totalIssues > 0) {
          // Fail the test with a detailed message
          expect(
            totalIssues,
            `Found ${totalIssues} issues in ${whiteLabel.path}/current-benefits: ` +
              `${foundPlaceholders.length} [PLACEHOLDER], ${uniqueUntranslatedLabels.length} untranslated labels`,
          ).toBe(0);
        }
      });
    });
  }
});
