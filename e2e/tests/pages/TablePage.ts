import { Page, Locator } from '@playwright/test';

export class TablePage {
  readonly page: Page;
  readonly createTableButton: Locator;
  readonly tableNameInput: Locator;
  readonly createFieldButton: Locator;
  readonly schemaEditorApproveButton: Locator;
  readonly projectLink: Locator;
  readonly inputField: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createTableButton = page.getByTestId('create-table-button');
    this.tableNameInput = page.getByTestId('0');
    this.createFieldButton = page.getByTestId('0-create-field-button');
    this.schemaEditorApproveButton = page.getByTestId('schema-editor-approve-button');
    this.projectLink = page.getByTestId('project-admin-TestProject-link');
    this.inputField = page.getByTestId('0-0');
  }

  async openProject() {
    await this.projectLink.click();
  }

  async createTable(tableName: string, nameOfTheField: string) {
    await this.createTableButton.click();
    await this.tableNameInput.fill(tableName);
    await this.createFieldButton.click();
    await this.inputField.click();
    await this.inputField.fill(nameOfTheField);
    await this.schemaEditorApproveButton.click();
  }

}
