import { test, expect, Page } from '@playwright/test';
import { login } from 'e2e/utils/login';
import {
  apiLogin,
  apiCreateProject,
  apiCreateTable,
  apiGetDraftRevision,
  apiCreateRevision,
  apiGetHeadRevision,
} from 'e2e/utils/apiHelpers';
import { generateProjectName } from 'e2e/utils/generateProjectName';

const projectName = generateProjectName();

test.describe.skip('Revisions - Create Revision (Commit)', () => {
  let page: Page;
  let adminToken: string;
  let adminOrgId: string;
  let projectId: string;
  let branchId: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();

    // Login via API to get token and organizationId
    const adminAuth = await apiLogin();
    adminToken = adminAuth.token;
    adminOrgId = adminAuth.organizationId; // 'admin'

    // Create project via API
    const { project, rootBranch } = await apiCreateProject(
      adminToken,
      adminOrgId,
      projectName,
    );
    projectId = project.id;
    branchId = rootBranch.id;

    // Login via UI
    await login({ page });
  });

  test('should show commit button when in DRAFT mode', async () => {
    // Navigate to project
    await page.goto(`/${projectName}/master`);

    // Create table via API to trigger DRAFT
    const draftRevision = await apiGetDraftRevision(
      adminToken,
      adminOrgId,
      projectName,
    );
    await apiCreateTable(adminToken, draftRevision.id, 'users', {
      type: 'object',
      properties: {
        name: { type: 'string', default: '' },
      },
      additionalProperties: false,
      required: [],
    });

    // Reload page to see DRAFT state
    await page.reload();

    // Should show DRAFT indicator
    await expect(page.getByText('DRAFT')).toBeVisible();

    // Should show commit button
    await expect(page.getByTestId('commit-changes-button')).toBeVisible();
  });

  test('should create revision with comment', async () => {
    // Navigate to project
    await page.goto(`/${projectName}/master`);

    // Create table to trigger DRAFT
    const draftRevision = await apiGetDraftRevision(
      adminToken,
      adminOrgId,
      projectName,
    );
    await apiCreateTable(adminToken, draftRevision.id, 'posts', {
      type: 'object',
      properties: {
        title: { type: 'string', default: '' },
      },
      additionalProperties: false,
      required: [],
    });

    await page.reload();

    // Click commit
    await page.getByTestId('commit-changes-button').click();

    // Fill comment
    await page.getByTestId('commit-comment-input').fill('Add posts table');

    // Approve commit
    await page.getByTestId('commit-approve-button').click();

    // Should return to HEAD mode
    await expect(page.getByText('HEAD')).toBeVisible();

    // Commit button should be disabled
    await expect(page.getByTestId('commit-changes-button')).toBeDisabled();
  });

  test.skip('should show revision in history after commit', async () => {
    // TODO: Create revision via API
    // Navigate to revisions page
    // Verify revision appears in list
    // Verify comment is shown
  });

  test.skip('should increment revision count after commit', async () => {
    // TODO: Count revisions
    // Create new changes
    // Commit
    // Verify revision count increased
  });

  test.skip('should create revision without comment', async () => {
    // TODO: Make changes
    // Click commit
    // Leave comment empty
    // Submit
    // Verify revision created with empty comment
  });

  test.skip('should show revision metadata', async () => {
    // TODO: Create revision
    // Open revision details
    // Verify: timestamp, author (if available), comment
  });

  test.skip('should navigate to specific revision', async () => {
    // TODO: Create multiple revisions
    // Click on older revision in history
    // Verify URL changes to revision ID
    // Verify read-only mode
  });

  test.skip('should show read-only indicator for old revisions', async () => {
    // TODO: Navigate to old revision
    // Verify read-only badge/indicator
    // Verify edit buttons disabled
  });

  test.afterAll(async () => {
    await page.close();
  });
});
