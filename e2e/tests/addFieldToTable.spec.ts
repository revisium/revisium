import { test, expect } from '@playwright/test';
import { login } from '../utils/login';
import { TableSettingsPage } from './pages/TableSettingsPage';

test('add field to user table and set types', async ({ page }) => {
  await login({ page });

  const tableSettings = new TableSettingsPage(page);

  await page.getByTestId('project-admin-TestProject-link').click();
  await tableSettings.openTableSettings('user');
  await tableSettings.addField('phone', 0);
  await tableSettings.backToTableList();
  await tableSettings.setFieldType(0, 'Number');
  await tableSettings.setFieldType(1, 'Number');
  await tableSettings.approveSchemaChanges();

  await expect(page.getByText('idnumber')).toBeVisible();
  await page.getByText('phonenumber').click();
});

test('delete table', async ({ page }) => {
  await login({ page });

  await page.getByTestId('project-admin-TestProject-link').click();
  await page.getByTestId('remove-table-button-user').click();

  await expect(page.getByTestId('table-settings-button-user')).toHaveCount(0);
});
