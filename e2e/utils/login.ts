import { expect, Page } from '@playwright/test';

export const login = async ({ page }: { page: Page }) => {
  await page.goto('/login');
  await page.getByTestId('login-emailOrUsername-input').fill('admin');
  await page.getByTestId('login-password-input').fill('admin');
  await page.getByText('Login').click();
  await page.waitForURL('/');
  await expect(page.getByText('Logout')).toBeVisible();
};
