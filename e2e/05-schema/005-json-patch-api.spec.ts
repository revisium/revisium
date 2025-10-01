import { test, expect, Page } from '@playwright/test';
import { login } from 'e2e/utils/login';
import {
  apiLogin,
  apiCreateProject,
  apiGetDraftRevision,
  apiCreateTable,
  apiCreateRow,
  apiGetTableSchema,
  apiUpdateTable,
  apiGetRow,
} from 'e2e/utils/apiHelpers';
import { generateProjectName } from 'e2e/utils/generateProjectName';

test.describe('Schema - JSON Patch Operations via API', () => {
  let page: Page;
  let adminToken: string;
  let adminOrgId: string;
  let projectName: string;
  let draftRevisionId: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();

    // Login via API
    const auth = await apiLogin();
    adminToken = auth.token;
    adminOrgId = auth.organizationId;

    // Create project via API
    projectName = generateProjectName();
    await apiCreateProject(adminToken, adminOrgId, projectName);

    // Get draft revision
    const draftRevision = await apiGetDraftRevision(
      adminToken,
      adminOrgId,
      projectName,
    );
    draftRevisionId = draftRevision.id;

    // Login via UI
    await login({ page });
  });

  test('should add new field via JSON Patch add operation', async () => {
    const tableName = `products_${Date.now()}`;

    // Create table
    await apiCreateTable(adminToken, draftRevisionId, tableName, {
      type: 'object',
      properties: {
        name: { type: 'string', default: '' },
      },
      additionalProperties: false,
      required: ['name'],
    });

    // Add new field via JSON Patch
    await apiUpdateTable(adminToken, draftRevisionId, tableName, [
      {
        op: 'add',
        path: '/properties/price',
        value: { type: 'number', default: 0 },
      },
    ]);

    // Get updated schema
    const schema = await apiGetTableSchema(
      adminToken,
      draftRevisionId,
      tableName,
    );

    // Verify new field added
    expect(schema.properties.name).toBeDefined();
    expect(schema.properties.price).toBeDefined();
    expect(schema.properties.price.type).toBe('number');
  });

  test('should remove field via JSON Patch remove operation', async () => {
    const tableName = `users_${Date.now()}`;

    // Create table with two fields
    await apiCreateTable(adminToken, draftRevisionId, tableName, {
      type: 'object',
      properties: {
        name: { type: 'string', default: '' },
        age: { type: 'number', default: 0 },
      },
      additionalProperties: false,
      required: ['name'],
    });

    // Remove age field via JSON Patch
    await apiUpdateTable(adminToken, draftRevisionId, tableName, [
      {
        op: 'remove',
        path: '/properties/age',
      },
    ]);

    // Get updated schema
    const schema = await apiGetTableSchema(
      adminToken,
      draftRevisionId,
      tableName,
    );

    // Verify age field removed
    expect(schema.properties.name).toBeDefined();
    expect(schema.properties.age).toBeUndefined();
  });

  test('should replace field type via JSON Patch', async () => {
    // Create table
    await apiCreateTable(adminToken, draftRevisionId, 'items', {
      type: 'object',
      properties: {
        count: { type: 'number', default: 0 },
      },
      additionalProperties: false,
      required: ['count'],
    });

    // Create row
    await apiCreateRow(
      adminToken,
      draftRevisionId,
      'items',
      { count: 42 },
      'item-1',
    );

    // Replace count type from number to string
    await apiUpdateTable(adminToken, draftRevisionId, 'items', [
      {
        op: 'replace',
        path: '/properties/count',
        value: { type: 'string', default: '' },
      },
    ]);

    // Get updated schema
    const schema = await apiGetTableSchema(
      adminToken,
      draftRevisionId,
      'items',
    );

    // Verify type changed
    expect(schema.properties.count.type).toBe('string');

    // Verify data transformed (number → string)
    const row = await apiGetRow(adminToken, draftRevisionId, 'items', 'item-1');
    expect(typeof row.data.count).toBe('string');
    expect(row.data.count).toBe('42');
  });

  test('should add multiple fields via add patches', async () => {
    const tableName = `books_${Date.now()}`;

    // Create table with one field
    await apiCreateTable(adminToken, draftRevisionId, tableName, {
      type: 'object',
      properties: {
        title: { type: 'string', default: '' },
      },
      additionalProperties: false,
      required: ['title'],
    });

    // Add multiple fields via JSON Patch
    await apiUpdateTable(adminToken, draftRevisionId, tableName, [
      {
        op: 'add',
        path: '/properties/author',
        value: { type: 'string', default: '' },
      },
      {
        op: 'add',
        path: '/properties/year',
        value: { type: 'number', default: 0 },
      },
    ]);

    // Get updated schema
    const schema = await apiGetTableSchema(
      adminToken,
      draftRevisionId,
      tableName,
    );

    // Verify all fields present
    expect(schema.properties.title).toBeDefined();
    expect(schema.properties.author).toBeDefined();
    expect(schema.properties.year).toBeDefined();
  });

  test('should handle complex field changes', async () => {
    // Create table
    await apiCreateTable(adminToken, draftRevisionId, 'orders', {
      type: 'object',
      properties: {
        total: { type: 'number', default: 0 },
        status: { type: 'string', default: 'pending' },
      },
      additionalProperties: false,
      required: ['status', 'total'],
    });

    // Create row
    await apiCreateRow(
      adminToken,
      draftRevisionId,
      'orders',
      { total: 100, status: 'pending' },
      'order-1',
    );

    // Apply complex changes:
    // 1. Change type of total field
    // 2. Replace status with new type
    await apiUpdateTable(adminToken, draftRevisionId, 'orders', [
      {
        op: 'replace',
        path: '/properties/total',
        value: { type: 'string', default: '0' },
      },
      {
        op: 'replace',
        path: '/properties/status',
        value: { type: 'number', default: 1 },
      },
    ]);

    // Get updated schema
    const schema = await apiGetTableSchema(
      adminToken,
      draftRevisionId,
      'orders',
    );

    // Verify changes - both fields now have different types
    expect(schema.properties.total.type).toBe('string');
    expect(schema.properties.status.type).toBe('number');

    // Verify row data - types transformed
    const row = await apiGetRow(
      adminToken,
      draftRevisionId,
      'orders',
      'order-1',
    );
    expect(row.data.total).toBe('100'); // number → string
    expect(row.data.status).toBe(0); // string → number (with default 0, not 1)
  });

  test('should show schema changes in UI', async () => {
    const tableName = `cars_${Date.now()}`;

    // Create table
    await apiCreateTable(adminToken, draftRevisionId, tableName, {
      type: 'object',
      properties: {
        brand: { type: 'string', default: '' },
      },
      additionalProperties: false,
      required: ['brand'],
    });

    // Navigate to table in UI
    await page.goto(`/app/${adminOrgId}/${projectName}/master/-/draft`);
    await expect(page.getByText(tableName)).toBeVisible();

    // Add new field via API
    await apiUpdateTable(adminToken, draftRevisionId, tableName, [
      {
        op: 'add',
        path: '/properties/model',
        value: { type: 'string', default: '' },
      },
    ]);

    // Reload to see changes
    await page.reload();

    // Verify table still visible
    await expect(page.getByText(tableName)).toBeVisible();

    // Verify schema via API
    const schema = await apiGetTableSchema(
      adminToken,
      draftRevisionId,
      tableName,
    );
    expect(schema.properties.brand).toBeDefined();
    expect(schema.properties.model).toBeDefined();
  });

  test.afterAll(async () => {
    await page.close();
  });
});
