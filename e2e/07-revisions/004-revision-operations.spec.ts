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
} from 'e2e/utils/apiHelpers';
import { generateProjectName } from 'e2e/utils/generateProjectName';

test.describe('Revisions - Operations via API', () => {
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

  test('should create revision (commit) via API', async () => {
    // Get initial HEAD revision
    const initialHead = await apiGetHeadRevision(
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

    // Create table in draft
    await apiCreateTable(adminToken, draftRevision.id, 'users', {
      type: 'object',
      properties: {
        name: { type: 'string', default: '' },
        email: { type: 'string', default: '' },
      },
      additionalProperties: false,
      required: ['email', 'name'],
    });

    // Create revision (commit)
    const newRevision = await apiCreateRevision(
      adminToken,
      adminOrgId,
      projectName,
      'master',
      'Add users table',
    );

    // Verify new revision created
    expect(newRevision.id).toBeDefined();
    // API does not return comment in response

    // Get new HEAD - should be different from initial
    const newHead = await apiGetHeadRevision(
      adminToken,
      adminOrgId,
      projectName,
    );

    expect(newHead.id).not.toBe(initialHead.id);
    // createRevision returns new revision ID which becomes the new HEAD
    // Note: there might be system tables that get committed as well
  });

  test('should create revision without comment', async () => {
    // Get draft
    const draft = await apiGetDraftRevision(
      adminToken,
      adminOrgId,
      projectName,
    );

    // Make changes - create another table
    await apiCreateTable(adminToken, draft.id, 'posts', {
      type: 'object',
      properties: {
        title: { type: 'string', default: '' },
      },
      additionalProperties: false,
      required: ['title'],
    });

    // Commit without comment
    const revision = await apiCreateRevision(
      adminToken,
      adminOrgId,
      projectName,
      'master',
      '',
    );

    // Verify revision created
    expect(revision.id).toBeDefined();
  });

  test('should create revision with row data', async () => {
    // Get draft
    const draft = await apiGetDraftRevision(
      adminToken,
      adminOrgId,
      projectName,
    );

    // Create table
    await apiCreateTable(adminToken, draft.id, 'products', {
      type: 'object',
      properties: {
        name: { type: 'string', default: '' },
        price: { type: 'number', default: 0 },
      },
      additionalProperties: false,
      required: ['name', 'price'],
    });

    // Add row
    await apiCreateRow(
      adminToken,
      draft.id,
      'products',
      {
        name: 'Laptop',
        price: 999,
      },
      'product-1',
    );

    // Commit
    const revision = await apiCreateRevision(
      adminToken,
      adminOrgId,
      projectName,
      'master',
      'Add products with data',
    );

    expect(revision.id).toBeDefined();
  });

  test('should revert changes via API', async () => {
    // Get draft and make changes
    const draft = await apiGetDraftRevision(
      adminToken,
      adminOrgId,
      projectName,
    );

    await apiCreateTable(adminToken, draft.id, 'temp_table', {
      type: 'object',
      properties: {
        data: { type: 'string', default: '' },
      },
      additionalProperties: false,
      required: ['data'],
    });

    // Navigate to DRAFT - should see temp_table
    await page.goto(`/app/${adminOrgId}/${projectName}/master/-/draft`);
    await expect(page.getByText('temp_table')).toBeVisible();

    // Revert changes
    await apiRevertChanges(adminToken, adminOrgId, projectName, 'master');

    // Reload to see reverted state
    await page.reload();

    // temp_table should no longer be visible (changes reverted)
    await expect(page.getByText('temp_table')).not.toBeVisible();
  });

  test('should show committed changes in UI', async () => {
    // Get draft
    const draft = await apiGetDraftRevision(
      adminToken,
      adminOrgId,
      projectName,
    );

    // Create table
    await apiCreateTable(adminToken, draft.id, 'comments', {
      type: 'object',
      properties: {
        text: { type: 'string', default: '' },
      },
      additionalProperties: false,
      required: ['text'],
    });

    // Commit
    await apiCreateRevision(
      adminToken,
      adminOrgId,
      projectName,
      'master',
      'Add comments table',
    );

    // Navigate to project HEAD
    await page.goto(`/app/${adminOrgId}/${projectName}/master`);

    // Table should be visible in HEAD
    await expect(page.getByText('comments')).toBeVisible();
  });

  test('should show draft changes only in draft view', async () => {
    // Get draft
    const draft = await apiGetDraftRevision(
      adminToken,
      adminOrgId,
      projectName,
    );

    // Create table but DON'T commit
    await apiCreateTable(adminToken, draft.id, 'draft_only_table', {
      type: 'object',
      properties: {
        field: { type: 'string', default: '' },
      },
      additionalProperties: false,
      required: ['field'],
    });

    // Navigate to HEAD - should NOT see draft table
    await page.goto(`/app/${adminOrgId}/${projectName}/master`);
    await expect(page.getByText('draft_only_table')).not.toBeVisible();

    // Navigate to DRAFT - should see table
    await page.goto(`/app/${adminOrgId}/${projectName}/master/-/draft`);
    await expect(page.getByText('draft_only_table')).toBeVisible();
  });

  test.afterAll(async () => {
    await page.close();
  });
});
