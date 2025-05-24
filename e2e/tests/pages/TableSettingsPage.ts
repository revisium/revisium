import { Page } from '@playwright/test';

export class TableSettingsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async openTableSettings(tableName: string) {
    await this.page.getByTestId(`table-settings-button-${tableName}`).click();
  }

  async addField(fieldName: string, index: number) {
    await this.page.getByTestId(`${index}-create-field-button`).click();
    await this.page.getByTestId(`${index}-1`).fill(fieldName);
  }

  async setFieldType(fieldIndex: number, type: string) {
    await this.page.getByTestId(`0-${fieldIndex}-select-type-button`).click();
    await this.page.getByTestId(`0-${fieldIndex}-menu-type-${type}`).click();
  }

  async approveSchemaChanges() {
    await this.page.getByTestId('schema-editor-approve-button').click();
  }

  async backToTableList() {
    await this.page.getByTestId('back-to-table-list-button').click();
  }
}
