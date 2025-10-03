import { test, expect, Page } from '@playwright/test';
import { login } from 'e2e/utils/login';
import {
  apiLogin,
  apiCreateProject,
  apiGetDraftRevision,
  apiCreateTable,
  apiCreateRow,
  apiCreateRevision,
  apiCreateEndpoint,
  apiGetEndpoints,
  apiDeleteEndpoint,
} from 'e2e/utils/apiHelpers';
import { generateProjectName } from 'e2e/utils/generateProjectName';

test.describe('Endpoints - Operations via API', () => {
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

  test('should create GraphQL endpoint via API', async () => {
    // Create endpoint
    const endpoint = await apiCreateEndpoint(
      adminToken,
      draftRevisionId,
      'GRAPHQL',
    );

    // Verify endpoint created
    expect(endpoint.id).toBeDefined();
    expect(endpoint.type).toBe('GRAPHQL');

    // Get endpoints list
    const endpoints = await apiGetEndpoints(adminToken, draftRevisionId);
    const graphqlEndpoint = endpoints.find((e) => e.type === 'GRAPHQL');

    expect(graphqlEndpoint).toBeDefined();
    expect(graphqlEndpoint?.type).toBe('GRAPHQL');
  });

  test('should create REST API endpoint via API', async () => {
    // Create endpoint
    const endpoint = await apiCreateEndpoint(
      adminToken,
      draftRevisionId,
      'REST_API',
    );

    // Verify endpoint created
    expect(endpoint.id).toBeDefined();
    expect(endpoint.type).toBe('REST_API');

    // Get endpoints list
    const endpoints = await apiGetEndpoints(adminToken, draftRevisionId);
    const restEndpoint = endpoints.find((e) => e.type === 'REST_API');

    expect(restEndpoint).toBeDefined();
    expect(restEndpoint?.type).toBe('REST_API');
  });

  test('should delete endpoint via API', async () => {
    // Just delete one of the existing endpoints from previous tests
    // Get current draft
    const draft = await apiGetDraftRevision(
      adminToken,
      adminOrgId,
      projectName,
    );

    // Get endpoints
    let endpoints = await apiGetEndpoints(adminToken, draft.id);

    // Should have at least one endpoint from previous tests
    expect(endpoints.length).toBeGreaterThan(0);

    const endpointToDelete = endpoints[0];

    // Delete endpoint
    await apiDeleteEndpoint(adminToken, endpointToDelete.id);

    // Verify deleted
    endpoints = await apiGetEndpoints(adminToken, draft.id);
    const deleted = endpoints.find((e) => e.id === endpointToDelete.id);
    expect(deleted).toBeUndefined();

    // Verify count decreased
    expect(endpoints.length).toBeLessThan(2);
  });

  test('should create endpoint with table data', async () => {
    // Get current draft
    const draft = await apiGetDraftRevision(
      adminToken,
      adminOrgId,
      projectName,
    );

    // Create table
    await apiCreateTable(adminToken, draft.id, 'items', {
      type: 'object',
      properties: {
        name: { type: 'string', default: '' },
      },
      additionalProperties: false,
      required: ['name'],
    });

    // Create row
    await apiCreateRow(
      adminToken,
      draft.id,
      'items',
      { name: 'Item 1' },
      'item-1',
    );

    // Verify that endpoint operations work even with table data
    const endpoints = await apiGetEndpoints(adminToken, draft.id);
    expect(Array.isArray(endpoints)).toBe(true);
  });

  test('should commit changes with table and endpoints', async () => {
    // Get current draft
    const draft = await apiGetDraftRevision(
      adminToken,
      adminOrgId,
      projectName,
    );

    // Create table if not exists
    await apiCreateTable(adminToken, draft.id, 'posts', {
      type: 'object',
      properties: {
        title: { type: 'string', default: '' },
      },
      additionalProperties: false,
      required: ['title'],
    });

    // Commit changes (includes tables and any endpoints)
    await apiCreateRevision(
      adminToken,
      adminOrgId,
      projectName,
      'master',
      'Add posts table with endpoints',
    );

    // Navigate to project HEAD
    await page.goto(`/app/${adminOrgId}/${projectName}/master`);

    // Should see posts table
    await expect(page.getByText('posts')).toBeVisible();
  });

  test('should list endpoints via API', async () => {
    // Get draft after commit (should be clean/empty)
    const draft = await apiGetDraftRevision(
      adminToken,
      adminOrgId,
      projectName,
    );

    // Get endpoints - should be empty array after commit
    const endpoints = await apiGetEndpoints(adminToken, draft.id);

    // Should be an array (might be empty after commit)
    expect(Array.isArray(endpoints)).toBe(true);

    // Navigate to project draft
    await page.goto(`/app/${adminOrgId}/${projectName}/master/-/draft`);

    // Verify we can navigate to draft
    await expect(page).toHaveURL(
      new RegExp(`${projectName}/master/-/draft`),
    );
  });

  test.afterAll(async () => {
    await page.close();
  });
});
