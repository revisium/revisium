import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('http://localhost:8080/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Revisium/);
});

// test('Try Revisium Cloud (Alpha)', async ({ page }) => {
//   await page.goto('https://revisium.io/');
//
//   // Click the cloud link.
//   await page.getByText('Try Revisium Cloud (Alpha)').click();
//
//   expect(page).toHaveURL(`https://cloud.revisium.io/`);
// });
