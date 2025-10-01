import { test, expect, Page } from '@playwright/test';
import { createProject } from 'e2e/utils/createProject';
import { generateProjectName } from 'e2e/utils/generateProjectName';
import { login } from 'e2e/utils/login';
import { removeProject } from 'e2e/utils/removeProject';

const projectName = generateProjectName();

test.describe('Workflow - Simple Table Creation via UI', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    await login({ page });
  });

  test('Step 1: Create project', async () => {
    await createProject({ page, projectName });
    await page.goto(`/app/admin/${projectName}/master`);
    await expect(page).toHaveURL(new RegExp(`${projectName}/master`));
  });

  test('Step 2: Create table "users" with simple fields', async () => {
    // Click create table button
    await page.getByTestId('create-table-button').click();

    // Enter table name in root field (testId='0')
    await page.getByTestId('0').fill('users');

    // Add first field "name" (string)
    await page.getByTestId('0-create-field-button').click();
    await page.getByTestId('0-0').fill('name');
    await page.getByTestId('0-0-select-type-button').click();
    await page.getByTestId('0-0-menu-type-String').click();

    // Add second field "age" (number)
    await page.getByTestId('0-create-field-button').click();
    await page.getByTestId('0-1').fill('age');
    await page.getByTestId('0-1-select-type-button').click();
    await page.getByTestId('0-1-menu-type-Number').click();

    // Add third field "active" (boolean)
    await page.getByTestId('0-create-field-button').click();
    await page.getByTestId('0-2').fill('active');
    await page.getByTestId('0-2-select-type-button').click();
    await page.getByTestId('0-2-menu-type-Boolean').click();

    // Approve/save table creation
    await page.getByTestId('schema-editor-approve-button').click();

    // Return to table list
    await page.getByTestId('back-to-table-list-button').click();

    // Verify table appears in list
    await expect(page.getByText('users')).toBeVisible();

    // Should be in DRAFT mode
    await expect(page).toHaveURL(new RegExp('draft'));
  });

  test('Step 3: Create table "posts" with nested object', async () => {
    // Wait for create-table-button to be available
    await expect(page.getByTestId('create-table-button')).toBeVisible();

    // Create second table
    await page.getByTestId('create-table-button').click();
    await page.getByTestId('0').fill('posts');

    // Add field "title" (string)
    await page.getByTestId('0-create-field-button').click();
    await page.getByTestId('0-0').fill('title');
    await page.getByTestId('0-0-select-type-button').click();
    await page.getByTestId('0-0-menu-type-String').click();

    // Add field "metadata" (object)
    await page.getByTestId('0-create-field-button').click();
    await page.getByTestId('0-1').fill('metadata');
    await page.getByTestId('0-1-select-type-button').click();
    await page.getByTestId('0-1-menu-type-Object').click();

    // Add nested field "views" (number) inside metadata
    await page.getByTestId('0-1-create-field-button').click();
    await page.getByTestId('0-1-0').fill('views');
    await page.getByTestId('0-1-0-select-type-button').click();
    await page.getByTestId('0-1-0-menu-type-Number').click();

    // Approve/save table creation
    await page.getByTestId('schema-editor-approve-button').click();

    // Return to table list
    await page.getByTestId('back-to-table-list-button').click();

    // Verify both tables visible
    await expect(page.getByText('users')).toBeVisible();
    await expect(page.getByText('posts')).toBeVisible();
  });

  test('Step 4: Delete a field from users table', async () => {
    // Hover on table to show menu button
    await page.getByTestId('table-users').hover();

    // Open table menu and edit schema
    await page.getByTestId('table-list-menu-users').click();
    await page.getByText('Edit schema').click();

    // Wait for schema editor to load
    await expect(
      page.getByTestId('schema-editor-approve-button'),
    ).toBeVisible();

    // Delete the "age" field (index 1)
    await page.getByTestId('0-1-setting-button').click({ force: true });
    await page.getByText('Delete').click();

    // Approve the changes
    await page.getByTestId('schema-editor-approve-button').click();

    // Return to table list
    await page.getByTestId('back-to-table-list-button').click();

    // Verify still in DRAFT
    await expect(page).toHaveURL(new RegExp('draft'));
  });

  test.afterAll(async () => {
    await removeProject({ page, projectName });
    await page.close();
  });
});
