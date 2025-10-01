import { test, expect, Page } from '@playwright/test';
import { login } from 'e2e/utils/login';
import {
  apiLogin,
  apiCreateProject,
  apiGetDraftRevision,
  apiCreateTable,
} from 'e2e/utils/apiHelpers';
import { generateProjectName } from 'e2e/utils/generateProjectName';

test.describe('Tables - With API Setup', () => {
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

  test.skip('should show table created via API', async () => {
    // Create table via API
    const draftRevision = await apiGetDraftRevision(
      adminToken,
      adminOrgId,
      projectName,
    );

    await apiCreateTable(adminToken, draftRevision.id, 'users', {
      type: 'object',
      properties: {
        name: { type: 'string', default: '' },
        email: { type: 'string', default: '' },
      },
      additionalProperties: false,
      required: [],
    });

    // Navigate to project
    await page.goto(`/`);
    await page.getByTestId(`project-${projectName}`).click();

    // Table should be visible
    await expect(page.getByText('users')).toBeVisible();
  });

  test.skip('should show multiple tables', async () => {
    const draftRevision = await apiGetDraftRevision(
      adminToken,
      adminOrgId,
      projectName,
    );

    // Create multiple tables
    await apiCreateTable(adminToken, draftRevision.id, 'posts', {
      type: 'object',
      properties: {
        title: { type: 'string', default: '' },
      },
      additionalProperties: false,
      required: [],
    });

    await apiCreateTable(adminToken, draftRevision.id, 'comments', {
      type: 'object',
      properties: {
        text: { type: 'string', default: '' },
      },
      additionalProperties: false,
      required: [],
    });

    // Navigate to project
    await page.goto(`/`);
    await page.getByTestId(`project-${projectName}`).click();

    // All tables should be visible
    await expect(page.getByText('posts')).toBeVisible();
    await expect(page.getByText('comments')).toBeVisible();
  });

  test.afterAll(async () => {
    await page.close();
  });
});
