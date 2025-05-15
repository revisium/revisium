import { test } from '@playwright/test';
import { login } from 'e2e/utils/login';
import { TablePage } from './pages/TablePage';

test('Create a new table', async ({ page }) => {
  await login({ page });

  const tablePage = new TablePage(page);
  await tablePage.openProject();
  const tableName = 'user';
  const nameOfTheField = 'name';
  await tablePage.createTable(tableName,nameOfTheField);
});
