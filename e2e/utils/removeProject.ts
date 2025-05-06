import { Page } from "@playwright/test";

export const removeProject = async ({
  projectName,
  page,
}: {
  page: Page;
  projectName: string;
}) => {
  await page.goto("/");
  await page.getByTestId(`project-${projectName}`).hover();
  await page.getByTestId(`remove-project-${projectName}-button`).click();
};
