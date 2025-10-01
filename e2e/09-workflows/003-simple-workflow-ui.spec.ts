import { test, expect, Page } from '@playwright/test';
import { createProject } from 'e2e/utils/createProject';
import { generateProjectName } from 'e2e/utils/generateProjectName';
import { login } from 'e2e/utils/login';
import { removeProject } from 'e2e/utils/removeProject';

const projectName = generateProjectName();

test.describe.skip('Workflow - Simple UI Workflow', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    await login({ page });
  });

  test('Step 1: Create project', async () => {
    await createProject({ page, projectName });

    // Navigate to project
    await page.goto(`/app/admin/${projectName}/master`);

    // Verify we're on master branch
    await expect(page).toHaveURL(new RegExp(`${projectName}/master`));
  });

  test('Step 2: Create first table - enters DRAFT', async () => {
    // Create first table "users"
    await page.getByTestId('create-table-button').click();
    await page.getByTestId('create-table-name-input').fill('users');
    await page.getByTestId('create-table-approve-button').click();

    // Verify table created
    await expect(page.getByText('users')).toBeVisible();

    // Verify transitioned to DRAFT mode
    await expect(page).toHaveURL(new RegExp('draft'));
  });

  test('Step 3: Create second table - accumulates in DRAFT', async () => {
    // Create second table "posts"
    await page.getByTestId('create-table-button').click();
    await page.getByTestId('create-table-name-input').fill('posts');
    await page.getByTestId('create-table-approve-button').click();

    // Verify both tables visible
    await expect(page.getByText('users')).toBeVisible();
    await expect(page.getByText('posts')).toBeVisible();

    // Still in DRAFT
    await expect(page).toHaveURL(new RegExp('draft'));
  });

  test('Step 4: Commit changes', async () => {
    // Look for commit button - try common patterns
    const commitButton = page
      .locator('button', { hasText: 'Commit' })
      .or(page.locator('button', { hasText: 'Create Revision' }));

    // Click commit
    await commitButton.first().click();

    // May need to fill commit message if dialog appears
    const messageInput = page.locator(
      'input[placeholder*="message" i], textarea[placeholder*="message" i]',
    );
    if (await messageInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await messageInput.fill('Added users and posts tables');

      // Find and click confirm button
      const confirmButton = page.locator('button', {
        hasText: /^(Commit|Create|Save|OK)$/i,
      });
      await confirmButton.first().click();
    }

    // Should navigate back to HEAD (no draft in URL)
    await expect(page).toHaveURL(new RegExp(`${projectName}/master$`));

    // Tables should still be visible in HEAD
    await expect(page.getByText('users')).toBeVisible();
    await expect(page.getByText('posts')).toBeVisible();
  });

  test('Step 5: Make new changes after commit', async () => {
    // Create third table "categories"
    await page.getByTestId('create-table-button').click();
    await page.getByTestId('create-table-name-input').fill('categories');
    await page.getByTestId('create-table-approve-button').click();

    // Should transition to DRAFT again
    await expect(page).toHaveURL(new RegExp('draft'));

    // All three tables visible
    await expect(page.getByText('users')).toBeVisible();
    await expect(page.getByText('posts')).toBeVisible();
    await expect(page.getByText('categories')).toBeVisible();
  });

  test('Step 6: Revert changes', async () => {
    // Look for revert/discard button
    const revertButton = page.locator('button', { hasText: /Revert|Discard/i });

    // Click revert
    await revertButton.first().click();

    // May need to confirm
    const confirmButton = page.locator('button', {
      hasText: /^(Discard|Confirm|Yes|OK)$/i,
    });
    if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmButton.first().click();
    }

    // Should go back to HEAD
    await expect(page).toHaveURL(new RegExp(`${projectName}/master$`));

    // Categories table should be gone
    await expect(page.getByText('categories')).not.toBeVisible();

    // But users and posts should still be there (from previous commit)
    await expect(page.getByText('users')).toBeVisible();
    await expect(page.getByText('posts')).toBeVisible();
  });

  test.afterAll(async () => {
    await removeProject({ page, projectName });
    await page.close();
  });
});
