import { Page } from '@playwright/test';

export interface PageTexts {
  [key: string]: string[];
}

export async function collectPageTexts(page: Page): Promise<string[]> {
  // Get all visible text elements on the page
  const texts = await page.evaluate(() => {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip hidden elements
          const element = node.parentElement;
          if (!element) return NodeFilter.FILTER_REJECT;
          
          const style = window.getComputedStyle(element);
          if (style.display === 'none' || style.visibility === 'hidden') {
            return NodeFilter.FILTER_REJECT;
          }
          
          // Skip empty text nodes
          const text = node.textContent?.trim();
          if (!text) return NodeFilter.FILTER_REJECT;
          
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const texts: string[] = [];
    let node;
    while (node = walker.nextNode()) {
      const text = node.textContent?.trim();
      if (text) texts.push(text);
    }
    return texts;
  });

  // Filter out numbers, dates, and other non-translatable content
  return texts.filter(text => {
    // Skip if text is just numbers
    if (/^\d+$/.test(text)) return false;
    
    // Skip if text is just a date
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(text)) return false;
    
    // Skip if text is an email or URL
    if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(text)) return false;
    if (/^(http|https):\/\//.test(text)) return false;
    
    return true;
  });
}

export async function collectAllPageTexts(page: Page, steps: { url: string | RegExp; actions: ((page: Page) => Promise<void>)[] }[]): Promise<PageTexts> {
  const pageTexts: PageTexts = {};

  for (const step of steps) {
    // Navigate to the page and store URL
    let currentUrl: string;
    if (typeof step.url === 'string') {
      await page.goto(step.url);
      currentUrl = step.url;
    } else {
      await page.waitForURL(step.url);
      currentUrl = await page.url();
    }

    // Collect texts before any actions
    pageTexts[currentUrl] = await collectPageTexts(page);

    // Perform any required actions for this step
    for (const action of step.actions) {
      await action(page);
    }
  }
  return pageTexts;
}

export async function collectFormElements(page: Page): Promise<{ [key: string]: string[] }> {
  return await page.evaluate(() => {
    const elements: { [key: string]: string[] } = {
      buttons: [],
      inputs: [],
      labels: [],
      selects: [],
      links: []
    };

    // Collect button text
    document.querySelectorAll('button, [role="button"]').forEach(el => {
      const text = el.textContent?.trim();
      if (text) elements.buttons.push(text);
    });

    // Collect input placeholders and values
    document.querySelectorAll('input').forEach(el => {
      const input = el as HTMLInputElement;
      if (input.placeholder) elements.inputs.push(input.placeholder);
      if (input.value) elements.inputs.push(input.value);
    });

    // Collect label text
    document.querySelectorAll('label').forEach(el => {
      const text = el.textContent?.trim();
      if (text) elements.labels.push(text);
    });

    // Collect select options
    document.querySelectorAll('select').forEach(el => {
      const select = el as HTMLSelectElement;
      Array.from(select.options).forEach(option => {
        if (option.text) elements.selects.push(option.text);
      });
    });

    // Collect link text
    document.querySelectorAll('a').forEach(el => {
      const text = el.textContent?.trim();
      if (text) elements.links.push(text);
    });

    return elements;
  });
}

export async function collectProgramDetails(page: Page): Promise<{ [key: string]: string[] }> {
  const programTexts: { [key: string]: string[] } = {};
  
  // Get all "More Info" buttons
  const moreInfoButtons = page.getByRole('button', { name: 'More Info' });
  const count = await moreInfoButtons.count();

  for (let i = 0; i < count; i++) {
    try {
      // Get fresh reference to buttons since page reloads
      const buttons = page.getByRole('button', { name: 'More Info' });
      await buttons.nth(i).click();
      
      // Wait for program details page to load
      await page.waitForLoadState('networkidle');
      
      // Collect texts from program details page
      const texts = await collectPageTexts(page);
      programTexts[`Program-${i + 1}`] = texts;
      
      // Click "Back to Results" and wait for navigation
      await page.getByRole('link', { name: /back to results/i }).click();
      await page.waitForLoadState('networkidle');
    } catch (error) {
      console.error(`Error collecting program ${i + 1} details:`, error);
    }
  }

  return programTexts;
}
