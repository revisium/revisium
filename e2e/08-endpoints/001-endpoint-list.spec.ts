import { test, expect, Page } from '@playwright/test';
import { createProject } from 'e2e/utils/createProject';
import { generateProjectName } from 'e2e/utils/generateProjectName';
import { login } from 'e2e/utils/login';
import { removeProject } from 'e2e/utils/removeProject';

const projectName = generateProjectName();

test.describe('Endpoints - Endpoint List', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();

    await login({ page });
    await createProject({ page, projectName });
  });

  test.skip('should show endpoints card', async () => {
    // TODO: Look for endpoints card/section
    // Verify it's visible
  });

  test.skip('should show GraphQL endpoint item', async () => {
    // TODO: Check for GraphQL endpoint in list
    // Verify toggle switch visible
  });

  test.skip('should show REST endpoint item', async () => {
    // TODO: Check for REST endpoint in list
    // Verify toggle switch visible
  });

  test.skip('should show endpoint status (enabled/disabled)', async () => {
    // TODO: Check initial state of endpoints
    // Verify disabled by default or show current state
  });

  test.skip('should have toggle switches', async () => {
    // TODO: Verify toggle switches for each endpoint
    // Check they are interactive
  });

  test.afterAll(async () => {
    await removeProject({ page, projectName });
    await page.close();
  });
});
