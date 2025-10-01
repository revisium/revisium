import { test, expect, Page } from '@playwright/test';
import { createProject } from 'e2e/utils/createProject';
import { generateProjectName } from 'e2e/utils/generateProjectName';
import { login } from 'e2e/utils/login';
import { removeProject } from 'e2e/utils/removeProject';

const projectName = generateProjectName();

test.describe('Endpoints - Enabling GraphQL', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();

    await login({ page });
    await createProject({ page, projectName });
  });

  test.skip('should enable GraphQL endpoint', async () => {
    // TODO: Find GraphQL toggle switch
    // Click to enable
    // Verify enabled state
  });

  test.skip('should show GraphQL URL after enabling', async () => {
    // TODO: Enable GraphQL endpoint
    // Verify URL is displayed
    // Verify URL format correct
  });

  test.skip('should have copy URL button', async () => {
    // TODO: Enable GraphQL
    // Find copy button
    // Click copy
    // Verify copied to clipboard (check for toast/notification)
  });

  test.skip('should show Apollo Sandbox button', async () => {
    // TODO: Enable GraphQL
    // Verify "Open in Apollo Sandbox" button visible
  });

  test.skip('should disable GraphQL endpoint', async () => {
    // TODO: Enable GraphQL
    // Click toggle to disable
    // Verify disabled state
    // Verify URL hidden
  });

  test.skip('should persist endpoint state on reload', async () => {
    // TODO: Enable GraphQL
    // Reload page
    // Verify still enabled
  });

  test.afterAll(async () => {
    await removeProject({ page, projectName });
    await page.close();
  });
});
