import { test, expect, Page } from '@playwright/test';
import { createProject } from 'e2e/utils/createProject';
import { generateProjectName } from 'e2e/utils/generateProjectName';
import { login } from 'e2e/utils/login';
import { removeProject } from 'e2e/utils/removeProject';

const projectName = generateProjectName();

test.describe.skip('Workflow - Complete Version Control Flow', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    await login({ page });
  });

  test.describe('Full Git-like Version Control', () => {
    test('Step 1-2: Create project and verify initial HEAD state', async () => {
      // Create project
      await createProject({ page, projectName });

      // Navigate to project
      await page.goto(`/app/admin/${projectName}/master`);

      // Verify we're on master branch
      await expect(page).toHaveURL(new RegExp(`${projectName}/master`));

      // Verify initial state (no tables yet)
      await expect(page.getByTestId('create-table-button')).toBeVisible();
    });

    test('Step 3-4: First change triggers DRAFT mode', async () => {
      // Create first table "users"
      await page.getByTestId('create-table-button').click();
      await page.getByTestId('create-table-name-input').fill('users');
      await page.getByTestId('create-table-approve-button').click();

      // Verify table created
      await expect(page.getByTestId('table-users')).toBeVisible();

      // Verify transitioned to DRAFT mode (URL should contain draft)
      await expect(page).toHaveURL(new RegExp('draft'));
    });

    test('Step 5: Multiple changes accumulate in DRAFT', async () => {
      // Create second table "posts"
      await page.getByTestId('create-table-button').click();
      await page.getByTestId('create-table-name-input').fill('posts');
      await page.getByTestId('create-table-approve-button').click();

      // Verify both tables visible
      await expect(page.getByTestId('table-users')).toBeVisible();
      await expect(page.getByTestId('table-posts')).toBeVisible();

      // Verify still in DRAFT mode
      await expect(page).toHaveURL(new RegExp('draft'));
    });

    test.skip('Step 6: Add rows to tables', async () => {
      // TODO: Add row to users table
      // Add row to posts table
      // Verify still in DRAFT
      // Check "has changes" increased
      // All changes should be tracked
    });

    test.skip('Step 7: Verify has changes indicator', async () => {
      // TODO: Check "has changes" indicator
      // Should show total count (4+: 2 tables, 2+ rows)
      // Hover/click to see change list
      // Verify change descriptions
    });

    test.skip('Step 8-9: Test revert functionality', async () => {
      // TODO: Click revert button
      // Verify confirmation dialog appears
      // Confirm discard changes
      // Verify back to HEAD state
      // Verify HEAD indicator visible
      // Verify all tables gone
      // Verify commit/revert buttons disabled
      // Verify URL back to HEAD
    });

    test.skip('Step 10: Create table again (new DRAFT cycle)', async () => {
      // TODO: Create table "products"
      // Verify transitioned to DRAFT again
      // This is a new DRAFT cycle
      // Previous reverted changes should not appear
    });

    test.skip('Step 11-12: Test commit functionality', async () => {
      // TODO: Click commit button
      // Enter commit message: "Added products table"
      // Submit/confirm
      // Verify commit created
      // Verify back to HEAD state
      // Verify HEAD indicator visible
      // Verify URL back to HEAD
      // Verify commit button disabled
      // Verify "has changes" hidden
    });

    test.skip('Step 13: Verify HEAD is editable', async () => {
      // TODO: In HEAD mode after commit
      // Create another table "categories"
      // Verify immediately transitions to DRAFT
      // This is a new DRAFT cycle after commit
    });

    test.skip('Step 14-15: Make more changes and commit again', async () => {
      // TODO: Add more tables/rows
      // Verify in DRAFT
      // Commit with message: "Added categories and data"
      // Verify new HEAD created
      // Verify back to HEAD state
    });

    test.skip('Step 16: View revision history', async () => {
      // TODO: Open revision history/list
      // Should see multiple commits:
      //   - Latest commit (HEAD): "Added categories and data"
      //   - Previous commit: "Added products table"
      //   - Initial commit (empty project)
      // Verify chronological order
      // Verify commit messages shown
      // Verify HEAD indicator on latest
    });

    test.skip('Step 17: Switch to old revision (read-only)', async () => {
      // TODO: Click on old revision in history
      // Navigate to that revision
      // Verify URL contains revision ID
      // Verify data matches that point in time
      // Verify read-only mode (cannot edit)
      // Verify commit/create buttons not available
      // Only tables from that commit visible
    });

    test.skip('Step 18: Switch back to HEAD (editable)', async () => {
      // TODO: Navigate back to HEAD/DRAFT
      // Click HEAD in revision history
      // Or click breadcrumb
      // Verify back to HEAD state
      // Verify can edit again
      // Verify all latest data visible
      // Verify commit button available (if no changes)
    });

    test.skip('Bonus: Create branch from old revision', async () => {
      // TODO: Navigate to old revision
      // Click "Create branch from this revision"
      // Enter branch name "feature-from-v1"
      // Verify branch created
      // Verify branch starts from that old revision
      // Verify can make changes in new branch
    });

    test.skip('Bonus: Multiple commits workflow', async () => {
      // TODO: Simulate real workflow:
      // 1. Make changes → DRAFT
      // 2. Commit "v1"
      // 3. Make changes → DRAFT
      // 4. Commit "v2"
      // 5. Make changes → DRAFT
      // 6. Revert (don't commit)
      // 7. Make different changes → DRAFT
      // 8. Commit "v3"
      // Verify 3 commits in history (v1, v2, v3)
      // Verify can switch between all versions
    });
  });

  test.afterAll(async () => {
    await removeProject({ page, projectName });
    await page.close();
  });
});
