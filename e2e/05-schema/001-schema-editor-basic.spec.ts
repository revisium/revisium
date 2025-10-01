import { test, expect, Page } from '@playwright/test';
import { createProject } from 'e2e/utils/createProject';
import { generateProjectName } from 'e2e/utils/generateProjectName';
import { login } from 'e2e/utils/login';
import { removeProject } from 'e2e/utils/removeProject';

const projectName = generateProjectName();
const tableName = 'products';

test.describe('Schema Editor - Basic Operations', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();

    await login({ page });
    await createProject({ page, projectName });
  });

  test.skip('should open schema editor', async () => {
    // TODO: Create table
    // Find and click "Edit Schema" button
    // Verify schema editor opened
  });

  test.skip('should show empty schema initially', async () => {
    // TODO: Open schema editor for new table
    // Verify no fields shown
    // Verify "Add field" or similar option visible
  });

  test.skip('should add first field', async () => {
    // TODO: Open schema editor
    // Click add field
    // Enter field name "name"
    // Select type "string"
    // Verify field appears in editor
  });

  test.skip('should save schema', async () => {
    // TODO: Add field
    // Click save button
    // Verify success message or indicator
    // Verify schema persisted (reload and check)
  });

  test.skip('should show schema validation errors', async () => {
    // TODO: Try to add invalid field
    // Verify error message shown
    // Verify cannot save invalid schema
  });

  test.afterAll(async () => {
    await removeProject({ page, projectName });
    await page.close();
  });
});
