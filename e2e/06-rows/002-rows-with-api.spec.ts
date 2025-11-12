import { test, expect, Page } from '@playwright/test';
import { login } from 'e2e/utils/login';
import {
  apiLogin,
  apiCreateProject,
  apiGetDraftRevision,
  apiCreateTable,
  apiCreateRow,
  apiCreateRevision,
} from 'e2e/utils/apiHelpers';
import { generateProjectName } from 'e2e/utils/generateProjectName';

test.describe.skip('Rows - With API Setup', () => {
  let page: Page;
  let adminToken: string;
  let adminOrgId: string;
  let projectName: string;
  let draftRevisionId: string;

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

    // Get draft revision
    const draftRevision = await apiGetDraftRevision(
      adminToken,
      adminOrgId,
      projectName,
    );
    draftRevisionId = draftRevision.id;

    // Create table with schema
    await apiCreateTable(adminToken, draftRevisionId, 'users', {
      type: 'object',
      properties: {
        name: { type: 'string', default: '' },
        email: { type: 'string', default: '' },
        age: { type: 'number', default: 0 },
      },
      additionalProperties: false,
      required: ['age', 'email', 'name'], // All fields required (sorted alphabetically)
    });

    // Login via UI
    await login({ page });
  });

  test('should show row created via API in DRAFT', async () => {
    // Create row via API in DRAFT
    await apiCreateRow(
      adminToken,
      draftRevisionId,
      'users',
      {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
      },
      'user-1',
    );

    // Navigate to DRAFT table page
    await page.goto(`/app/${adminOrgId}/${projectName}/master/-/draft/users`);

    // Row should be visible in DRAFT
    await expect(page.getByText('John Doe')).toBeVisible();
  });

  test('should show multiple rows in DRAFT', async () => {
    // Create multiple rows in DRAFT
    await apiCreateRow(
      adminToken,
      draftRevisionId,
      'users',
      {
        name: 'Alice Smith',
        email: 'alice@example.com',
        age: 25,
      },
      'user-2',
    );

    await apiCreateRow(
      adminToken,
      draftRevisionId,
      'users',
      {
        name: 'Bob Johnson',
        email: 'bob@example.com',
        age: 35,
      },
      'user-3',
    );

    // Navigate to DRAFT table page
    await page.goto(`/app/${adminOrgId}/${projectName}/master/-/draft/users`);

    // All rows should be visible in DRAFT
    await expect(page.getByText('Alice Smith')).toBeVisible();
    await expect(page.getByText('Bob Johnson')).toBeVisible();
  });

  test('should commit rows and show in HEAD', async () => {
    // Create row in DRAFT
    await apiCreateRow(
      adminToken,
      draftRevisionId,
      'users',
      {
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        age: 28,
      },
      'user-4',
    );

    // Commit changes
    await apiCreateRevision(
      adminToken,
      adminOrgId,
      projectName,
      'master',
      'Add Charlie',
    );

    // Navigate to table page
    await page.goto(`/app/${adminOrgId}/${projectName}/master/users`);

    // Row should be visible in HEAD
    await expect(page.getByText('Charlie Brown')).toBeVisible();
  });

  test.afterAll(async () => {
    await page.close();
  });
});
