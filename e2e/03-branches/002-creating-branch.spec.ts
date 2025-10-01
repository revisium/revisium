import { test, expect, Page } from '@playwright/test';
import { createProject } from 'e2e/utils/createProject';
import { generateProjectName } from 'e2e/utils/generateProjectName';
import { login } from 'e2e/utils/login';
import { removeProject } from 'e2e/utils/removeProject';

const projectName = generateProjectName();
const branchName = 'feature-branch';

test.describe('Branches - Creating Branch', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();

    await login({ page });
    await createProject({ page, projectName });
  });

  test.skip('should show create branch button', async () => {
    // TODO: Look for create branch button/input
    // Verify it's visible
  });

  test.skip('should create branch with valid name', async () => {
    // TODO: Click create branch
    // Fill branch name
    // Submit
    // Verify branch created
  });

  test.skip('should appear in sidebar after creation', async () => {
    // TODO: After creating branch
    // Check sidebar for new branch
    // Verify it's listed
  });

  test.skip('should navigate to new branch', async () => {
    // TODO: After creating branch
    // Verify URL contains branch name
    // Verify branch is active
  });

  test.skip('should inherit data from parent', async () => {
    // TODO: Create table in master
    // Create branch
    // Verify table exists in new branch
  });

  test.describe('Validation', () => {
    test.skip('should reject invalid branch name', async () => {
      // TODO: Try to create branch with invalid chars
      // Verify error message
    });

    test.skip('should reject duplicate branch name', async () => {
      // TODO: Create branch
      // Try to create another with same name
      // Verify error
    });

    test.skip('should reject empty branch name', async () => {
      // TODO: Try to submit empty name
      // Verify validation error
    });
  });

  test.afterAll(async () => {
    await removeProject({ page, projectName });
    await page.close();
  });
});
