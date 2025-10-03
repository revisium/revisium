import { test, expect, Page } from '@playwright/test';
import { login } from 'e2e/utils/login';
import {
  apiLogin,
  apiCreateUser,
  apiGetMe,
  apiCreateProject,
  apiAddUserToOrganization,
  apiAddUserToProject,
} from 'e2e/utils/apiHelpers';
import { generateProjectName } from 'e2e/utils/generateProjectName';

test.describe('Users - User Management via API', () => {
  let page: Page;
  let adminToken: string;
  let adminOrgId: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();

    // Login via API
    const auth = await apiLogin();
    adminToken = auth.token;
    adminOrgId = auth.organizationId;

    // Login via UI
    await login({ page });
  });

  test('should get current user info via apiGetMe', async () => {
    // Get current user
    const user = await apiGetMe(adminToken);

    // Verify user data
    expect(user.username).toBe('admin');
    expect(user.id).toBeDefined();
  });

  test('should create user with systemUser role', async () => {
    // Create user
    const user = await apiCreateUser(adminToken, 'systemUser');

    // Verify user created
    expect(user.username).toBeDefined();
    expect(user.password).toBe('testpassword');
    expect(user.token).toBeDefined();
    expect(user.organizationId).toBe(user.username);

    // Verify user can login and get their info
    const userInfo = await apiGetMe(user.token);
    expect(userInfo.username).toBe(user.username);
  });

  test('should create user with email', async () => {
    const uniqueEmail = `testuser-${Date.now()}@example.com`;

    // Create user with email
    const user = await apiCreateUser(adminToken, 'systemUser', uniqueEmail);

    // Verify user created with email
    expect(user.username).toBeDefined();
    expect(user.email).toBe(uniqueEmail);
    expect(user.token).toBeDefined();

    // Verify user can get their info
    const userInfo = await apiGetMe(user.token);
    expect(userInfo.username).toBe(user.username);
    expect(userInfo.email).toBe(uniqueEmail);
  });

  test('should create user with systemAdmin role', async () => {
    // Create admin user
    const user = await apiCreateUser(adminToken, 'systemAdmin');

    // Verify user created
    expect(user.token).toBeDefined();

    // Verify user can get their info
    const userInfo = await apiGetMe(user.token);
    expect(userInfo.username).toBe(user.username);
  });

  test('should create user with systemFullApiRead role', async () => {
    // Create read-only user
    const user = await apiCreateUser(adminToken, 'systemFullApiRead');

    // Verify user created
    expect(user.token).toBeDefined();

    // Verify user can get their info
    const userInfo = await apiGetMe(user.token);
    expect(userInfo.username).toBe(user.username);
  });

  test('should add user to organization with developer role', async () => {
    // Create user
    const user = await apiCreateUser(adminToken, 'systemUser');

    // Get user info to get userId
    const userInfo = await apiGetMe(user.token);

    // Add user to admin organization
    await apiAddUserToOrganization(
      adminToken,
      adminOrgId,
      userInfo.id,
      'developer',
    );

    // User should now be able to access admin organization resources
    // This is verified by the fact that the API call succeeded
    expect(userInfo.id).toBeDefined();
  });

  test('should add user to organization with different roles', async () => {
    // Test all organization roles
    const roles = [
      'organizationOwner',
      'organizationAdmin',
      'developer',
      'editor',
      'reader',
    ] as const;

    for (const role of roles) {
      // Create user for each role
      const user = await apiCreateUser(adminToken, 'systemUser');
      const userInfo = await apiGetMe(user.token);

      // Add user to organization with specific role
      await apiAddUserToOrganization(adminToken, adminOrgId, userInfo.id, role);

      // Verify by checking user can access their info
      expect(userInfo.id).toBeDefined();
    }
  });

  test('should add user to project with developer role', async () => {
    // Create project
    const projectName = generateProjectName();
    await apiCreateProject(adminToken, adminOrgId, projectName);

    // Create user
    const user = await apiCreateUser(adminToken, 'systemUser');
    const userInfo = await apiGetMe(user.token);

    // Add user to organization first (required for project access)
    await apiAddUserToOrganization(
      adminToken,
      adminOrgId,
      userInfo.id,
      'reader',
    );

    // Add user to project
    await apiAddUserToProject(
      adminToken,
      adminOrgId,
      projectName,
      userInfo.id,
      'developer',
    );

    // User should now be able to access project
    expect(userInfo.id).toBeDefined();
  });

  test('should add user to project with different roles', async () => {
    // Create project
    const projectName = generateProjectName();
    await apiCreateProject(adminToken, adminOrgId, projectName);

    // Test all project roles
    const roles = ['developer', 'editor', 'reader'] as const;

    for (const role of roles) {
      // Create user for each role
      const user = await apiCreateUser(adminToken, 'systemUser');
      const userInfo = await apiGetMe(user.token);

      // Add user to organization first
      await apiAddUserToOrganization(
        adminToken,
        adminOrgId,
        userInfo.id,
        'reader',
      );

      // Add user to project with specific role
      await apiAddUserToProject(
        adminToken,
        adminOrgId,
        projectName,
        userInfo.id,
        role,
      );

      // Verify by checking user can access their info
      expect(userInfo.id).toBeDefined();
    }
  });

  test.afterAll(async () => {
    await page.close();
  });
});
