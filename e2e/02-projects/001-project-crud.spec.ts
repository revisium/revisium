import { test, expect, Page } from '@playwright/test';
import { generateProjectName } from 'e2e/utils/generateProjectName';
import { login } from 'e2e/utils/login';

test.describe('Projects - CRUD Operations', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    await login({ page });
  });

  test('should show create project button', async () => {
    await expect(page.getByTestId('create-project-button')).toBeVisible();
  });

  test('should create project with valid name', async () => {
    const projectName = generateProjectName();
    await page.getByTestId('create-project-button').click();
    await page.getByTestId('create-project-name-input').fill(projectName);
    await page.getByTestId('create-project-approve-button').click();

    // Project should appear in the list
    await expect(page.getByTestId(`project-${projectName}`)).toBeVisible();
  });

  test('should appear in projects list', async () => {
    const projectName = generateProjectName();
    // Create project first
    await page.getByTestId('create-project-button').click();
    await page.getByTestId('create-project-name-input').fill(projectName);
    await page.getByTestId('create-project-approve-button').click();

    // Navigate back to home
    await page.goto('/');

    // Verify project exists in list
    await expect(page.getByTestId(`project-${projectName}`)).toBeVisible();
  });

  test.skip('should navigate to project when clicked', async () => {
    const projectName = generateProjectName();
    // Create project
    await page.getByTestId('create-project-button').click();
    await page.getByTestId('create-project-name-input').fill(projectName);
    await page.getByTestId('create-project-approve-button').click();

    // Click project
    await page.getByTestId(`project-${projectName}`).click();

    // Should be on project page
    await expect(page).toHaveURL(new RegExp(`/${projectName}`));
  });

  test.skip('should delete project', async () => {
    // TODO: Create project
    // Hover over project card
    // Click delete button
    // Confirm deletion
    // Verify project removed from list
  });

  test.skip('should validate empty project name', async () => {
    // TODO: Click create project
    // Leave name empty
    // Try to submit
    // Verify validation error
  });

  test.skip('should reject duplicate project name', async () => {
    // TODO: Create project with name
    // Try to create another with same name
    // Verify error message
  });

  test.skip('should reject invalid project name characters', async () => {
    // TODO: Try to create project with invalid chars (spaces, special chars)
    // Verify validation error
  });

  test.afterEach(async () => {
    await page.close();
  });
});
