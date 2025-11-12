import { test, expect, Page } from '@playwright/test';
import { login } from 'e2e/utils/login';
import {
  apiLogin,
  apiCreateProject,
  apiGetDraftRevision,
  apiCreateTable,
  apiCreateRow,
  apiGetRow,
  apiUpdateRow,
  apiDeleteRow,
} from 'e2e/utils/apiHelpers';
import { generateProjectName } from 'e2e/utils/generateProjectName';

test.describe.skip('Rows - CRUD Operations via API', () => {
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

    // Create table with schema
    await apiCreateTable(adminToken, draftRevisionId, 'products', {
      type: 'object',
      properties: {
        name: { type: 'string', default: '' },
        price: { type: 'number', default: 0 },
        inStock: { type: 'boolean', default: false },
      },
      additionalProperties: false,
      required: ['inStock', 'name', 'price'], // Sorted alphabetically
    });

    // Login via UI
    await login({ page });
  });

  test('should get row by ID via API', async () => {
    // Create row via API
    const created = await apiCreateRow(
      adminToken,
      draftRevisionId,
      'products',
      {
        name: 'Laptop',
        price: 999,
        inStock: true,
      },
      'product-1',
    );

    // Get the row
    const row = await apiGetRow(
      adminToken,
      draftRevisionId,
      'products',
      'product-1',
    );

    // Verify row data
    expect(row.id).toBe('product-1');
    expect(row.data.name).toBe('Laptop');
    expect(row.data.price).toBe(999);
    expect(row.data.inStock).toBe(true);
  });

  test('should update row via API', async () => {
    // Create row via API
    await apiCreateRow(
      adminToken,
      draftRevisionId,
      'products',
      {
        name: 'Phone',
        price: 499,
        inStock: false,
      },
      'product-2',
    );

    // Update the row
    await apiUpdateRow(adminToken, draftRevisionId, 'products', 'product-2', {
      name: 'Phone Pro',
      price: 599,
      inStock: true,
    });

    // Get updated row
    const updated = await apiGetRow(
      adminToken,
      draftRevisionId,
      'products',
      'product-2',
    );

    // Verify updated data
    expect(updated.data.name).toBe('Phone Pro');
    expect(updated.data.price).toBe(599);
    expect(updated.data.inStock).toBe(true);
  });

  test('should show updated row in UI', async () => {
    // Navigate to DRAFT table page first (to establish cache)
    await page.goto(
      `/app/${adminOrgId}/${projectName}/master/-/draft/products`,
    );

    // Create and update row via API
    await apiCreateRow(
      adminToken,
      draftRevisionId,
      'products',
      {
        name: 'Tablet',
        price: 299,
        inStock: false,
      },
      'product-3',
    );

    await apiUpdateRow(adminToken, draftRevisionId, 'products', 'product-3', {
      name: 'Tablet Pro',
      price: 399,
      inStock: true,
    });

    // Reload page to bypass UI cache
    await page.reload();

    // Updated values should be visible
    await expect(page.getByText('Tablet Pro')).toBeVisible();
    await expect(page.getByText('399')).toBeVisible();
  });

  test('should delete row via API', async () => {
    // Create row via API
    await apiCreateRow(
      adminToken,
      draftRevisionId,
      'products',
      {
        name: 'Keyboard',
        price: 79,
        inStock: true,
      },
      'product-4',
    );

    // Verify row exists
    const beforeDelete = await apiGetRow(
      adminToken,
      draftRevisionId,
      'products',
      'product-4',
    );
    expect(beforeDelete.id).toBe('product-4');

    // Delete the row
    await apiDeleteRow(adminToken, draftRevisionId, 'products', 'product-4');

    // Try to get deleted row - should fail
    try {
      await apiGetRow(adminToken, draftRevisionId, 'products', 'product-4');
      throw new Error('Expected get to fail after delete');
    } catch (error: any) {
      expect(error.message).toContain('Get row failed');
    }
  });

  test('should not show deleted row in UI', async () => {
    // Get fresh draft revision (may have changed after previous operations)
    const freshDraft = await apiGetDraftRevision(
      adminToken,
      adminOrgId,
      projectName,
    );

    // Navigate to page first (to establish cache)
    await page.goto(
      `/app/${adminOrgId}/${projectName}/master/-/draft/products`,
    );

    // Create row via API
    await apiCreateRow(
      adminToken,
      freshDraft.id,
      'products',
      {
        name: 'Mouse',
        price: 29,
        inStock: true,
      },
      'product-5',
    );

    // Reload to see created row
    await page.reload();
    await expect(page.getByText('Mouse')).toBeVisible();

    // Delete the row via API
    await apiDeleteRow(adminToken, freshDraft.id, 'products', 'product-5');

    // Reload to bypass cache and verify deletion
    await page.reload();

    // Deleted row should not be visible
    await expect(page.getByText('Mouse')).not.toBeVisible();
  });

  test.afterAll(async () => {
    await page.close();
  });
});
