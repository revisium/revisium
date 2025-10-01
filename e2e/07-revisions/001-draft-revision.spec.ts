import { test, expect, Page } from '@playwright/test';
import { createProject } from 'e2e/utils/createProject';
import { generateProjectName } from 'e2e/utils/generateProjectName';
import { login } from 'e2e/utils/login';
import { removeProject } from 'e2e/utils/removeProject';

const projectName = generateProjectName();

test.describe('Revisions - Draft Revision', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();

    await login({ page });
    await createProject({ page, projectName });
  });

  test.skip('should have draft revision by default', async () => {
    // TODO: Check URL or revisions list
    // Verify draft revision exists
    // Verify it's the current revision
  });

  test.skip('should show draft indicator', async () => {
    // TODO: Look for "Draft" badge or indicator
    // Verify it's visible
  });

  test.skip('should allow making changes', async () => {
    // TODO: Create table or row
    // Verify changes saved in draft
    // Verify changes not in HEAD
  });

  test.skip('should show has changes indicator', async () => {
    // TODO: Make a change (create table)
    // Verify "has changes" indicator appears
    // Check revisions card or status
  });

  test.skip('should not affect HEAD revision', async () => {
    // TODO: Make changes in draft
    // Switch to HEAD revision
    // Verify changes not visible in HEAD
  });

  test.skip('should persist changes on page reload', async () => {
    // TODO: Make changes in draft
    // Reload page
    // Verify changes still there
  });

  test.afterAll(async () => {
    await removeProject({ page, projectName });
    await page.close();
  });
});
