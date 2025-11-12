import { test, expect, Page } from '@playwright/test';
import { login } from 'e2e/utils/login';
import {
  apiLogin,
  apiCreateProject,
  apiGetDraftRevision,
  apiCreateTable,
  apiGetTable,
  apiGetTableSchema,
  apiUpdateTable,
  apiRenameTable,
  apiDeleteTable,
} from 'e2e/utils/apiHelpers';
import { generateProjectName } from 'e2e/utils/generateProjectName';

test.describe.skip('Tables - CRUD Operations via API', () => {
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

  test('should get table by ID via API', async () => {
    // Create table via API
    await apiCreateTable(adminToken, draftRevisionId, 'customers', {
      type: 'object',
      properties: {
        name: { type: 'string', default: '' },
        email: { type: 'string', default: '' },
      },
      additionalProperties: false,
      required: ['email', 'name'],
    });

    // Get the table metadata
    const table = await apiGetTable(
      adminToken,
      draftRevisionId,
      'customers',
    );

    // Get the table schema
    const schema = await apiGetTableSchema(
      adminToken,
      draftRevisionId,
      'customers',
    );

    // Verify table data
    expect(table.id).toBe('customers');
    expect(schema.type).toBe('object');
    expect(schema.properties.name).toBeDefined();
    expect(schema.properties.email).toBeDefined();
  });

  test('should update table schema via API', async () => {
    // Create table via API
    await apiCreateTable(adminToken, draftRevisionId, 'orders', {
      type: 'object',
      properties: {
        total: { type: 'number', default: 0 },
      },
      additionalProperties: false,
      required: ['total'],
    });

    // Update the table schema (change type of existing field)
    await apiUpdateTable(adminToken, draftRevisionId, 'orders', [
      {
        op: 'replace',
        path: '/properties/total',
        value: {
          type: 'string',
          default: '',
        },
      },
    ]);

    // Get updated schema
    const updatedSchema = await apiGetTableSchema(
      adminToken,
      draftRevisionId,
      'orders',
    );

    // Verify updated schema - total changed from number to string
    expect(updatedSchema.properties.total).toBeDefined();
    expect(updatedSchema.properties.total.type).toBe('string');
    // Default value migrated from 0 to empty string
    expect(updatedSchema.properties.total.default).toBe('');
  });

  test('should show updated table schema in UI', async () => {
    // Create table via API
    await apiCreateTable(adminToken, draftRevisionId, 'products', {
      type: 'object',
      properties: {
        name: { type: 'string', default: '' },
      },
      additionalProperties: false,
      required: ['name'],
    });

    // Navigate to project page
    await page.goto(`/app/${adminOrgId}/${projectName}/master/-/draft`);

    // Table should be visible
    await expect(page.getByText('products')).toBeVisible();
  });

  test('should rename table via API', async () => {
    // Create table via API
    await apiCreateTable(adminToken, draftRevisionId, 'old_name', {
      type: 'object',
      properties: {
        value: { type: 'string', default: '' },
      },
      additionalProperties: false,
      required: ['value'],
    });

    // Rename the table
    await apiRenameTable(
      adminToken,
      draftRevisionId,
      'old_name',
      'new_name',
    );

    // Old name should not exist
    try {
      await apiGetTable(adminToken, draftRevisionId, 'old_name');
      throw new Error('Expected get to fail after rename');
    } catch (error: any) {
      expect(error.message).toContain('Get table failed');
    }

    // New name should exist
    const renamed = await apiGetTable(
      adminToken,
      draftRevisionId,
      'new_name',
    );
    expect(renamed.id).toBe('new_name');
  });

  test('should delete table via API', async () => {
    // Create table via API
    await apiCreateTable(adminToken, draftRevisionId, 'temp_table', {
      type: 'object',
      properties: {
        data: { type: 'string', default: '' },
      },
      additionalProperties: false,
      required: ['data'],
    });

    // Verify table exists
    const beforeDelete = await apiGetTable(
      adminToken,
      draftRevisionId,
      'temp_table',
    );
    expect(beforeDelete.id).toBe('temp_table');

    // Delete the table
    await apiDeleteTable(adminToken, draftRevisionId, 'temp_table');

    // Try to get deleted table - should fail
    try {
      await apiGetTable(adminToken, draftRevisionId, 'temp_table');
      throw new Error('Expected get to fail after delete');
    } catch (error: any) {
      expect(error.message).toContain('Get table failed');
    }
  });

  test('should not show deleted table in UI', async () => {
    // Get fresh draft revision
    const freshDraft = await apiGetDraftRevision(
      adminToken,
      adminOrgId,
      projectName,
    );

    // Navigate to page first
    await page.goto(`/app/${adminOrgId}/${projectName}/master/-/draft`);

    // Create table via API
    await apiCreateTable(adminToken, freshDraft.id, 'to_delete', {
      type: 'object',
      properties: {
        field: { type: 'string', default: '' },
      },
      additionalProperties: false,
      required: ['field'],
    });

    // Reload to see created table
    await page.reload();
    await expect(page.getByText('to_delete')).toBeVisible();

    // Delete the table via API
    await apiDeleteTable(adminToken, freshDraft.id, 'to_delete');

    // Reload to bypass cache
    await page.reload();

    // Deleted table should not be visible
    await expect(page.getByText('to_delete')).not.toBeVisible();
  });

  test.afterAll(async () => {
    await page.close();
  });
});
