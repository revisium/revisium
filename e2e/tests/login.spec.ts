import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test.describe('Login', () => {
  test('log in with correct credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login('admin', 'admin');
    await expect(page).toHaveTitle(/Revisium/); 
  });
});
