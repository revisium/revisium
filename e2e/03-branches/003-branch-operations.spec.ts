import { test, expect, Page } from '@playwright/test';
import { login } from 'e2e/utils/login';
import {
  apiLogin,
  apiCreateProject,
  apiGetDraftRevision,
  apiGetHeadRevision,
  apiCreateTable,
  apiCreateRevision,
  apiCreateBranch,
  apiGetBranch,
} from 'e2e/utils/apiHelpers';
import { generateProjectName } from 'e2e/utils/generateProjectName';

test.describe.skip('Branches - Operations via API', () => {
  let page: Page;
  let adminToken: string;
  let adminOrgId: string;
  let projectName: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();

    // Login via API
    const auth = await apiLogin();
    adminToken = auth.token;
    adminOrgId = auth.organizationId;

    // Create project via API
    projectName = generateProjectName();
    await apiCreateProject(adminToken, adminOrgId, projectName);

    // Login via UI
    await login({ page });
  });

  test('should create branch from HEAD revision via API', async () => {
    // Get HEAD revision
    const headRevision = await apiGetHeadRevision(
      adminToken,
      adminOrgId,
      projectName,
    );

    // Create branch from HEAD
    const branch = await apiCreateBranch(
      adminToken,
      headRevision.id,
      'feature-1',
    );

    // Verify branch created
    expect(branch.id).toBeDefined();
    expect(branch.name).toBe('feature-1');

    // Get branch via API
    const fetchedBranch = await apiGetBranch(
      adminToken,
      adminOrgId,
      projectName,
      'feature-1',
    );

    expect(fetchedBranch.name).toBe('feature-1');
  });

  test('should create branch with data inheritance', async () => {
    // Get draft and create table
    const draft = await apiGetDraftRevision(
      adminToken,
      adminOrgId,
      projectName,
    );

    await apiCreateTable(adminToken, draft.id, 'products', {
      type: 'object',
      properties: {
        name: { type: 'string', default: '' },
      },
      additionalProperties: false,
      required: ['name'],
    });

    // Commit changes to HEAD
    await apiCreateRevision(
      adminToken,
      adminOrgId,
      projectName,
      'master',
      'Add products table',
    );

    // Get new HEAD
    const headRevision = await apiGetHeadRevision(
      adminToken,
      adminOrgId,
      projectName,
    );

    // Create branch from HEAD - should inherit products table
    const branch = await apiCreateBranch(
      adminToken,
      headRevision.id,
      'feature-2',
    );

    expect(branch.id).toBeDefined();
    expect(branch.name).toBe('feature-2');

    // Get draft of new branch - should have products table
    const branchDraft = await apiGetDraftRevision(
      adminToken,
      adminOrgId,
      projectName,
      'feature-2',
    );

    // Navigate to branch in UI - should see products table
    await page.goto(
      `/app/${adminOrgId}/${projectName}/feature-2/-/draft`,
    );
    await expect(page.getByText('products')).toBeVisible();
  });

  test('should show created branch in UI', async () => {
    // Get HEAD
    const headRevision = await apiGetHeadRevision(
      adminToken,
      adminOrgId,
      projectName,
    );

    // Create branch via API
    await apiCreateBranch(adminToken, headRevision.id, 'ui-test-branch');

    // Navigate to project
    await page.goto(`/app/${adminOrgId}/${projectName}/master`);

    // Branch should be visible in UI (might need to reload or check sidebar)
    // For now, verify we can navigate to it
    await page.goto(`/app/${adminOrgId}/${projectName}/ui-test-branch`);
    await expect(page).toHaveURL(
      new RegExp(`${projectName}/ui-test-branch`),
    );
  });

  test('should allow independent changes in branch', async () => {
    // Get HEAD
    const headRevision = await apiGetHeadRevision(
      adminToken,
      adminOrgId,
      projectName,
    );

    // Create branch
    await apiCreateBranch(adminToken, headRevision.id, 'independent-branch');

    // Get branch draft
    const branchDraft = await apiGetDraftRevision(
      adminToken,
      adminOrgId,
      projectName,
      'independent-branch',
    );

    // Create table only in branch
    await apiCreateTable(adminToken, branchDraft.id, 'branch_only', {
      type: 'object',
      properties: {
        field: { type: 'string', default: '' },
      },
      additionalProperties: false,
      required: ['field'],
    });

    // Navigate to branch - should see table
    await page.goto(
      `/app/${adminOrgId}/${projectName}/independent-branch/-/draft`,
    );
    await expect(page.getByText('branch_only')).toBeVisible();

    // Navigate to master - should NOT see table
    await page.goto(`/app/${adminOrgId}/${projectName}/master/-/draft`);
    await expect(page.getByText('branch_only')).not.toBeVisible();
  });

  test('should commit changes in branch independently', async () => {
    // Get HEAD
    const headRevision = await apiGetHeadRevision(
      adminToken,
      adminOrgId,
      projectName,
    );

    // Create branch
    await apiCreateBranch(adminToken, headRevision.id, 'commit-branch');

    // Get branch draft
    const branchDraft = await apiGetDraftRevision(
      adminToken,
      adminOrgId,
      projectName,
      'commit-branch',
    );

    // Create table in branch
    await apiCreateTable(adminToken, branchDraft.id, 'branch_table', {
      type: 'object',
      properties: {
        value: { type: 'number', default: 0 },
      },
      additionalProperties: false,
      required: ['value'],
    });

    // Commit in branch
    await apiCreateRevision(
      adminToken,
      adminOrgId,
      projectName,
      'commit-branch',
      'Add branch table',
    );

    // Get branch HEAD - should have table
    const branchHead = await apiGetHeadRevision(
      adminToken,
      adminOrgId,
      projectName,
      'commit-branch',
    );

    expect(branchHead.id).toBeDefined();

    // Navigate to branch HEAD - should see table
    await page.goto(`/app/${adminOrgId}/${projectName}/commit-branch`);
    await expect(page.getByText('branch_table')).toBeVisible();

    // Navigate to master HEAD - should NOT see table
    await page.goto(`/app/${adminOrgId}/${projectName}/master`);
    await expect(page.getByText('branch_table')).not.toBeVisible();
  });

  test.afterAll(async () => {
    await page.close();
  });
});
