import { test, expect, Page } from '@playwright/test';
import { login } from 'e2e/utils/login';

test.describe('Authentication - Logout', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    await login({ page });
  });

  test('should logout successfully', async () => {
    await page.getByText('Logout').click();

    // Should redirect to login page
    await expect(page).toHaveURL('/login');
  });

  test.skip('should clear session after logout', async () => {
    // TODO: Logout
    // Try to access protected page
    // Verify redirected to login
  });

  test.skip('should not access protected pages after logout', async () => {
    // TODO: Logout
    // Navigate to /app or project URL
    // Verify redirected to login or shown error
  });

  test.skip('should show login form after logout', async () => {
    // TODO: Logout
    // Verify login form visible
    // Verify no user data visible
  });

  test.afterEach(async () => {
    await page.close();
  });
});
