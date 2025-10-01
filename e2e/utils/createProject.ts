import { Page } from '@playwright/test';

export const createProject = async ({
  projectName,
  page,
}: {
  page: Page;
  projectName: string;
  branchName?: string;
  fromRevisionId?: string;
}) => {
  await page.goto('/');
  await page.getByTestId('create-project-button').click();
  await page.getByTestId('create-project-name-input').click();
  await page.getByTestId('create-project-name-input').fill(projectName);
  await page.getByTestId('create-project-approve-button').click();
  await page.waitForURL(/admin.*master/);
};
