import { test, expect, Page } from '@playwright/test';
import { createProject } from 'e2e/utils/createProject';
import { generateProjectName } from 'e2e/utils/generateProjectName';
import { login } from 'e2e/utils/login';
import { removeProject } from 'e2e/utils/removeProject';

const projectName = generateProjectName();

test.describe('Branches - Default Branch', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();

    await login({ page });
    await createProject({ page, projectName });
  });

  test.skip('should have master branch by default', async () => {
    // After project creation, should be on master branch
    await expect(page).toHaveURL(new RegExp(`${projectName}/master`));
  });

  test.skip('should show master branch in sidebar', async () => {
    // TODO: Check sidebar for master branch
    // Verify it's highlighted/selected
  });

  test.skip('should have draft revision', async () => {
    // TODO: Verify draft revision exists
    // Check revisions card or URL
  });

  test.skip('should be able to make changes in draft', async () => {
    // TODO: Create table or row
    // Verify changes saved
    // Verify draft has changes indicator
  });

  test.afterAll(async () => {
    await removeProject({ page, projectName });
    await page.close();
  });
});
