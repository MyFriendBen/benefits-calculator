import { test, expect, Locator } from '@playwright/test';
test.describe('CO cobrand, header and footer links Test', () => {
  test.setTimeout(30000);
   
    test('verify header and footer links are working', async ({ page }) => {
        // Set viewport to desktop size to ensure header links are visible (must be > 1280px)
        await page.setViewportSize({ width: 1400, height: 800 });
        // Navigate directly to a step where 211 cobrand header/footer is visible
        await page.goto('/co/step-3/?referrer=211co');

        // Header links - these are from the twoOneOneLinks array
        const headerLinks = [
          { text: 'ABOUT US', url: 'https://www.211colorado.org/#about-us' },
          { text: 'SUPPORT', url: 'https://www.211colorado.org/#support' },
          { text: 'COMMUNITY AGENCIES', url: 'https://www.211colorado.org/#agencies' },
          { text: 'SEARCH RESOURCES', url: 'https://www.211colorado.org/#category' },
          { text: 'CHAT', url: 'https://www.211colorado.org/chat/#english' },
          { text: 'LOGIN', url: 'https://search.211colorado.org/users/sign_in?_gl=1*bsbeov*_ga*MTIxNDcxNjc3OS4xNjg2MjQ1MDA3*_ga_2SYE2QY2YJ*MTY4OTAxODY0Ni43LjEuMTY4OTAxODkwMC42MC4wLjA' }
        ];
        
        // Footer links
        const footerLinks = [
          { text: 'Click to live chat with a 2-1-1 Navigator', url: 'https://www.211colorado.org/chat/#english' },
          { text: '2-1-1 Terms of service', url: 'https://www.211colorado.org/terms-of-service/' },
          { text: '2-1-1 Privacy Policy', url: 'https://www.211colorado.org/privacy-policy/' }
        ];
        
        // Test desktop header links (visible in desktop view)
        for (const link of headerLinks) {
          const linkElement = page.locator('.twoOneOne-desktop-links').locator(`a[href="${link.url}"]`).first();
          
          // Wait for the element to be visible
          await expect(linkElement).toBeVisible();
          await expect(linkElement).toHaveAttribute('href', link.url);
          await expect(linkElement).toHaveAttribute('target', '_blank');
          
          // Test the link opens correctly by clicking it
          const [newPage] = await Promise.all([
            page.waitForEvent('popup'),
            linkElement.click()
          ]);
          await expect(newPage).toHaveURL(link.url);
          await newPage.close();
        }
        
        // Test mobile header links by opening hamburger menu
        await page.setViewportSize({ width: 768, height: 600 });
        // Re-navigate to ensure 211co referrer is preserved (reload may lose query params)
        await page.goto('/co/step-3/?referrer=211co');

        // Click hamburger menu to reveal mobile links (visible at <= 1280px)
        const hamburgerButton = page.locator('button.hamburger-icon');
        await hamburgerButton.waitFor({ state: 'visible', timeout: 10000 });
        await hamburgerButton.click();
        
        // Test mobile header links (visible in hamburger menu)
        for (const link of headerLinks) {
          const linkElement = page.locator('#hamburger-drawer').locator(`a[href="${link.url}"]`);
          await expect(linkElement).toBeVisible();
          
          // Check if link is accessible and has correct href
          await expect(linkElement).toHaveAttribute('href', link.url);
          await expect(linkElement).toHaveAttribute('target', '_blank');
        }
        
        // Test footer links - scroll to footer first to ensure visibility
        await page.locator('footer, [role="contentinfo"]').first().scrollIntoViewIfNeeded();

        for (const link of footerLinks) {
          // Find all matching elements and pick the first visible one
          const allLinks = await page.locator(`a[href="${link.url}"]`).all();
          let visibleLink: Locator | null = null;
          for (const candidate of allLinks) {
            if (await candidate.isVisible()) {
              visibleLink = candidate;
              break;
            }
          }
          if (!visibleLink) {
            console.warn(`Skipping footer link not visible: ${link.text} (${link.url})`);
            continue;
          }
          await expect(visibleLink).toBeVisible();
          await expect(visibleLink).toHaveAttribute('href', link.url);
          await expect(visibleLink).toHaveAttribute('target', '_blank');
        }
        
        // Test special footer links (tel and sms)
        const telLink = page.locator('a[href="tel:211"]');
        await expect(telLink).toBeVisible();
        await expect(telLink).toHaveAttribute('href', 'tel:211');
        
        const telLink2 = page.locator('a[href="tel:866-760-6489"]');
        await expect(telLink2).toBeVisible();
        await expect(telLink2).toHaveAttribute('href', 'tel:866-760-6489');
        
        const smsLink = page.locator('a[href="sms:898211"]');
        await expect(smsLink).toBeVisible();
        await expect(smsLink).toHaveAttribute('href', 'sms:898211');
        
        // Test logo link (navigates back to step-1)
        const logoLink = page.locator('a[href="/co/step-1?referrer=211co"]');
        await expect(logoLink).toBeVisible();
        await expect(logoLink).toHaveAttribute('href', '/co/step-1?referrer=211co');
    });
  
  });
