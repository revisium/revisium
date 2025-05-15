import { Page, expect, Locator } from '@playwright/test';

export class ProjectPage {
  readonly page: Page;
  readonly createProjectButton: Locator;
  readonly projectNameInput: Locator;
  readonly approveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createProjectButton = page.getByTestId('create-project-button');
    this.projectNameInput = page.getByTestId('create-project-name-input');
    this.approveButton = page.getByTestId('create-project-approve-button');
  }

  async createProject(projectName: string) {
    await this.createProjectButton.click();
    await this.projectNameInput.fill(projectName);
    await this.approveButton.click();
  }

  async expectProjectExists(projectName: string) {
    const projectLink = this.page.getByTestId(`project-admin-${projectName}-link`);
    await expect(projectLink).toBeVisible();
  }
}
