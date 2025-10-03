import { test, expect, Page } from '@playwright/test';
import { createProject } from 'e2e/utils/createProject';
import { generateProjectName } from 'e2e/utils/generateProjectName';
import { login } from 'e2e/utils/login';
import { removeProject } from 'e2e/utils/removeProject';

const projectName = generateProjectName();

test.describe.skip('creating project', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();

    await login({ page });
    await createProject({ page, projectName });
  });

  test.skip('should be on list', async () => {
    await expect(page.getByTestId(`project-${projectName}-link`)).toBeVisible();
  });

  test('remove button should not be visible', async () => {
    await expect(
      page.getByTestId(`remove-project-${projectName}-button`),
    ).not.toBeVisible();
  });

  test.skip('remove button should be visible', async () => {
    await page.getByTestId(`project-${projectName}`).hover();
    await expect(
      page.getByTestId(`remove-project-${projectName}-button`),
    ).toBeVisible();
  });

  test.skip('clicking on button should be changed url', async () => {
    await page.getByTestId(`project-${projectName}-link`).click();
    await expect(page).toHaveURL(`${projectName}/master`);
  });

  test.afterEach(async () => {
    await removeProject({ page, projectName });
  });
});
