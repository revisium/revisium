import { test, expect, Page } from '@playwright/test';
import { login } from 'e2e/utils/login';
import {
  apiLogin,
  apiCreateProject,
  apiGetDraftRevision,
  apiGetHeadRevision,
  apiCreateTable,
  apiCreateRow,
  apiCreateRevision,
  apiRevertChanges,
  apiCreateBranch,
  apiGetBranch,
} from 'e2e/utils/apiHelpers';
import { generateProjectName } from 'e2e/utils/generateProjectName';

test.describe('Workflow - Git-like Version Control via API', () => {
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

  test('Step 1: Verify initial HEAD state', async () => {
    // Get HEAD revision
    const headRevision = await apiGetHeadRevision(
      adminToken,
      adminOrgId,
      projectName,
    );

    // Get draft revision
    const draftRevision = await apiGetDraftRevision(
      adminToken,
      adminOrgId,
      projectName,
    );

    // Verify both exist
    expect(headRevision.id).toBeDefined();
    expect(draftRevision.id).toBeDefined();

    // Navigate to project in UI
    await page.goto(`/app/${adminOrgId}/${projectName}/master`);

    // Verify we're on master branch
    await expect(page).toHaveURL(new RegExp(`${projectName}/master`));
  });

  test('Step 2: First change creates DRAFT', async () => {
    // Get current draft
    const draft = await apiGetDraftRevision(
      adminToken,
      adminOrgId,
      projectName,
    );

    // Create first table
    await apiCreateTable(adminToken, draft.id, 'users', {
      type: 'object',
      properties: {
        name: { type: 'string', default: '' },
      },
      additionalProperties: false,
      required: ['name'],
    });

    // Get updated draft and HEAD
    const newDraft = await apiGetDraftRevision(
      adminToken,
      adminOrgId,
      projectName,
    );
    const head = await apiGetHeadRevision(adminToken, adminOrgId, projectName);

    // Verify DRAFT and HEAD are now different (changes exist)
    expect(newDraft.id).not.toBe(head.id);

    // Navigate to draft in UI
    await page.goto(`/app/${adminOrgId}/${projectName}/master/-/draft`);

    // Verify table visible
    await expect(page.getByText('users')).toBeVisible();
  });

  test('Step 3: Multiple changes accumulate in DRAFT', async () => {
    // Get current draft
    const draft = await apiGetDraftRevision(
      adminToken,
      adminOrgId,
      projectName,
    );

    // Create second table
    await apiCreateTable(adminToken, draft.id, 'posts', {
      type: 'object',
      properties: {
        title: { type: 'string', default: '' },
      },
      additionalProperties: false,
      required: ['title'],
    });

    // Reload page
    await page.reload();

    // Verify both tables visible in draft
    await expect(page.getByText('users')).toBeVisible();
    await expect(page.getByText('posts')).toBeVisible();
  });

  test('Step 4: Add rows to tables', async () => {
    // Get current draft
    const draft = await apiGetDraftRevision(
      adminToken,
      adminOrgId,
      projectName,
    );

    // Add rows
    await apiCreateRow(
      adminToken,
      draft.id,
      'users',
      { name: 'Alice' },
      'user-1',
    );
    await apiCreateRow(
      adminToken,
      draft.id,
      'posts',
      { title: 'First Post' },
      'post-1',
    );

    // Verify rows created (by getting draft again - it should be different)
    const newDraft = await apiGetDraftRevision(
      adminToken,
      adminOrgId,
      projectName,
    );

    // Draft should still exist with changes
    const head = await apiGetHeadRevision(adminToken, adminOrgId, projectName);
    expect(newDraft.id).not.toBe(head.id);
  });

  test('Step 5: Revert changes back to HEAD', async () => {
    // Revert all changes
    await apiRevertChanges(adminToken, adminOrgId, projectName);

    // Get new draft and HEAD
    const draft = await apiGetDraftRevision(
      adminToken,
      adminOrgId,
      projectName,
    );
    const head = await apiGetHeadRevision(adminToken, adminOrgId, projectName);

    // After revert, draft is reset (changes discarded)
    expect(draft.id).toBeDefined();
    expect(head.id).toBeDefined();

    // Navigate to HEAD in UI
    await page.goto(`/app/${adminOrgId}/${projectName}/master`);

    // Tables should be gone (reverted)
    await expect(page.getByText('users')).not.toBeVisible();
    await expect(page.getByText('posts')).not.toBeVisible();
  });

  test('Step 6: Create new DRAFT cycle after revert', async () => {
    // Get current draft
    const draft = await apiGetDraftRevision(
      adminToken,
      adminOrgId,
      projectName,
    );

    // Create table "products"
    await apiCreateTable(adminToken, draft.id, 'products', {
      type: 'object',
      properties: {
        name: { type: 'string', default: '' },
        price: { type: 'number', default: 0 },
      },
      additionalProperties: false,
      required: ['name'],
    });

    // Verify new DRAFT created
    const newDraft = await apiGetDraftRevision(
      adminToken,
      adminOrgId,
      projectName,
    );
    const head = await apiGetHeadRevision(adminToken, adminOrgId, projectName);

    expect(newDraft.id).not.toBe(head.id);

    // Navigate to draft
    await page.goto(`/app/${adminOrgId}/${projectName}/master/-/draft`);
    await expect(page.getByText('products')).toBeVisible();
  });

  test('Step 7: Commit changes creates new HEAD', async () => {
    // Get HEAD before commit
    const oldHead = await apiGetHeadRevision(
      adminToken,
      adminOrgId,
      projectName,
    );

    // Commit changes
    const revision = await apiCreateRevision(
      adminToken,
      adminOrgId,
      projectName,
      'master',
      'Added products table',
    );

    // Verify commit created
    expect(revision.id).toBeDefined();

    // Verify HEAD updated (different from before)
    const newHead = await apiGetHeadRevision(
      adminToken,
      adminOrgId,
      projectName,
    );
    expect(newHead.id).not.toBe(oldHead.id);

    // Navigate to HEAD
    await page.goto(`/app/${adminOrgId}/${projectName}/master`);

    // Products table should be visible in HEAD
    await expect(page.getByText('products')).toBeVisible();
  });

  test('Step 8: HEAD is editable - creates new DRAFT', async () => {
    // Get current draft (should equal HEAD)
    const draft = await apiGetDraftRevision(
      adminToken,
      adminOrgId,
      projectName,
    );

    // Create another table in HEAD
    await apiCreateTable(adminToken, draft.id, 'categories', {
      type: 'object',
      properties: {
        name: { type: 'string', default: '' },
      },
      additionalProperties: false,
      required: ['name'],
    });

    // Verify new DRAFT created
    const newDraft = await apiGetDraftRevision(
      adminToken,
      adminOrgId,
      projectName,
    );
    const head = await apiGetHeadRevision(adminToken, adminOrgId, projectName);

    expect(newDraft.id).not.toBe(head.id);
  });

  test('Step 9: Second commit creates revision history', async () => {
    // Get HEAD before second commit
    const oldHead = await apiGetHeadRevision(
      adminToken,
      adminOrgId,
      projectName,
    );

    // Get current draft
    const draft = await apiGetDraftRevision(
      adminToken,
      adminOrgId,
      projectName,
    );

    // Add more data
    await apiCreateRow(
      adminToken,
      draft.id,
      'categories',
      { name: 'Electronics' },
      'cat-1',
    );

    // Commit second time
    const revision2 = await apiCreateRevision(
      adminToken,
      adminOrgId,
      projectName,
      'master',
      'Added categories and data',
    );

    // Verify new commit created
    expect(revision2.id).toBeDefined();

    // Verify HEAD updated (different from before)
    const newHead = await apiGetHeadRevision(
      adminToken,
      adminOrgId,
      projectName,
    );
    expect(newHead.id).not.toBe(oldHead.id);
  });

  test('Step 10: Create branch from HEAD', async () => {
    // Get HEAD revision
    const head = await apiGetHeadRevision(adminToken, adminOrgId, projectName);

    // Create branch from HEAD
    const branch = await apiCreateBranch(adminToken, head.id, 'feature-branch');

    // Verify branch created
    expect(branch.id).toBeDefined();
    expect(branch.name).toBe('feature-branch');

    // Get branch via API to verify
    const fetchedBranch = await apiGetBranch(
      adminToken,
      adminOrgId,
      projectName,
      'feature-branch',
    );

    expect(fetchedBranch.name).toBe('feature-branch');
    expect(fetchedBranch.id).toBe(branch.id);

    // Navigate to branch in UI
    await page.goto(`/app/${adminOrgId}/${projectName}/feature-branch`);

    // Verify we're on the branch
    await expect(page).toHaveURL(new RegExp(`${projectName}/feature-branch`));
  });

  test.afterAll(async () => {
    await page.close();
  });
});
