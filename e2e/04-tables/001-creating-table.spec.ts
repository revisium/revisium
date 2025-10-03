import { test, expect, Page } from '@playwright/test';
import { createProject } from 'e2e/utils/createProject';
import { generateProjectName } from 'e2e/utils/generateProjectName';
import { login } from 'e2e/utils/login';
import { removeProject } from 'e2e/utils/removeProject';

test.describe.skip('Tables - Creating Table', () => {
  let page: Page;
  let projectName: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    projectName = generateProjectName();

    await login({ page });
    await createProject({ page, projectName });
  });

  test('should show create table button', async () => {
    // Navigate to project to ensure we're on the right page
    await page.goto(`/${projectName}/master`);
    await expect(page.getByTestId('create-table-button')).toBeVisible();
  });

  test('should create table with valid name', async () => {
    const tableName = 'users';
    await page.goto(`/${projectName}/master`);

    await page.getByTestId('create-table-button').click();
    await page.getByTestId('create-table-name-input').fill(tableName);
    await page.getByTestId('create-table-approve-button').click();

    // Should navigate to table page or show table in list
    await expect(page.getByTestId(`table-${tableName}`)).toBeVisible();
  });

  test('should appear in tables list', async () => {
    const tableName = 'posts';
    await page.goto(`/${projectName}/master`);

    // Create table
    await page.getByTestId('create-table-button').click();
    await page.getByTestId('create-table-name-input').fill(tableName);
    await page.getByTestId('create-table-approve-button').click();

    // Check main area for table
    await expect(page.getByTestId(`table-${tableName}`)).toBeVisible();
  });

  test.skip('should appear in sidebar', async () => {
    // TODO: After creating table
    // Check sidebar for table
    // Verify it's listed under Tables section
  });

  test.skip('should navigate to table page', async () => {
    // TODO: After creating table
    // Click table link
    // Verify URL contains table name
    // Verify on table page
  });

  test.skip('should have empty schema initially', async () => {
    // TODO: After creating table
    // Open schema editor
    // Verify no fields defined
  });

  test.describe('System Tables', () => {
    test.skip('should show _schema table', async () => {
      // TODO: Check for _schema system table
      // Verify it exists
      // Verify it's marked as system table
    });

    test.skip('should show _migration table', async () => {
      // TODO: Check for _migration system table
      // Verify it exists
    });
  });

  test.describe('Validation', () => {
    test.skip('should reject invalid table name', async () => {
      // TODO: Try to create table with invalid chars/spaces
      // Verify error message
    });

    test.skip('should reject duplicate table name', async () => {
      // TODO: Create table
      // Try to create another with same name
      // Verify error
    });

    test.skip('should reject empty table name', async () => {
      // TODO: Try to submit without name
      // Verify validation error
    });

    test.skip('should reject reserved table names', async () => {
      // TODO: Try to create table with system name (_schema, _migration)
      // Verify error
    });
  });

  test.afterAll(async () => {
    await removeProject({ page, projectName });
    await page.close();
  });
});
