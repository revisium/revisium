import { test, expect, Page } from '@playwright/test';
import { apiLogin, apiCreateUser } from 'e2e/utils/apiHelpers';

test.describe('Authentication - Login', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    await page.goto('/login');
  });

  test.describe('Successful Login', () => {
    test('should login with username', async () => {
      await page.getByTestId('login-emailOrUsername-input').fill('admin');
      await page.getByTestId('login-password-input').fill('admin');
      await page.getByText('Login').click();
      await page.waitForURL('/');

      await expect(page.getByText('Logout')).toBeVisible();
      await expect(page).toHaveURL('/');
    });

    test('should login with email', async () => {
      // Get admin token to create user
      const auth = await apiLogin();

      // Create test user with unique email
      const uniqueEmail = `testuser-${Date.now()}@example.com`;
      const user = await apiCreateUser(auth.token, 'systemUser', uniqueEmail);

      // Login with email
      await page.getByTestId('login-emailOrUsername-input').fill(user.email!);
      await page.getByTestId('login-password-input').fill(user.password);
      await page.getByText('Login').click();
      await page.waitForURL('/');

      await expect(page.getByText('Logout')).toBeVisible();
      await expect(page).toHaveURL('/');
    });

    test('should redirect to main page after login', async () => {
      await page.getByTestId('login-emailOrUsername-input').fill('admin');
      await page.getByTestId('login-password-input').fill('admin');
      await page.getByText('Login').click();
      await page.waitForURL('/');

      await expect(page).toHaveURL('/');
      await expect(page.getByTestId('create-project-button')).toBeVisible();
    });

    test.skip('should show logout button after login', async () => {
      await page.getByTestId('login-emailOrUsername-input').fill('admin');
      await page.getByTestId('login-password-input').fill('admin');
      await page.getByText('Login').click();
      await page.waitForURL('/');

      await expect(page.getByText('Logout')).toBeVisible();
    });
  });

  test.describe('Failed Login', () => {
    test('should show error for invalid credentials', async () => {
      await page.getByTestId('login-emailOrUsername-input').fill('invalid');
      await page.getByTestId('login-password-input').fill('wrongpassword');
      await page.getByText('Login').click();

      // Should stay on login page
      await expect(page).toHaveURL('/login');

      // Should not see logout button
      await expect(page.getByText('Logout')).not.toBeVisible();
    });

    test('should not show login button when username is empty', async () => {
      // Fill only password, leave username empty
      await page.getByTestId('login-password-input').fill('admin');

      // Login button should not be visible
      await expect(page.getByText('Login')).not.toBeVisible();
    });

    test('should not show login button when password is empty', async () => {
      // Fill only username, leave password empty
      await page.getByTestId('login-emailOrUsername-input').fill('admin');

      // Login button should not be visible
      await expect(page.getByText('Login')).not.toBeVisible();
    });

    test('should not show login button when form is empty', async () => {
      // Don't fill anything

      // Login button should not be visible
      await expect(page.getByText('Login')).not.toBeVisible();
    });

    test('should show login button when both fields are filled', async () => {
      // Fill both fields
      await page.getByTestId('login-emailOrUsername-input').fill('admin');
      await page.getByTestId('login-password-input').fill('admin');

      // Login button should become visible
      await expect(page.getByText('Login')).toBeVisible();
    });
  });

  test.afterEach(async () => {
    await page.close();
  });
});
