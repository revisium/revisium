import { api } from 'e2e/utils/api';
import { nanoid } from 'nanoid';

/**
 * Admin user constants
 * Each user automatically gets an organization with organizationId === username
 */
export const ADMIN_USERNAME = 'admin';
export const ADMIN_PASSWORD = 'admin';
export const ADMIN_ORGANIZATION_ID = 'admin'; // organizationId === username

/**
 * Login and get access token
 * Returns both token and organizationId (which equals username)
 */
export const apiLogin = async (
  username: string = ADMIN_USERNAME,
  password: string = ADMIN_PASSWORD,
) => {
  const response = await api.api.login({
    emailOrUsername: username,
    password,
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }

  return {
    token: response.data.accessToken,
    organizationId: username, // organizationId === username
    username,
  };
};

/**
 * Get current user info
 */
export const apiGetMe = async (token: string) => {
  const response = await api.api.me({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Get me failed: ${response.status}`);
  }

  return response.data;
};

/**
 * Helper: Get organizationId from username
 * Since organizationId === username, this is just for clarity
 */
export const getOrganizationIdFromUsername = (username: string): string => {
  return username;
};

/**
 * Create a test user with organization
 * Note: Organization is created automatically with organizationId === username
 */
export const apiCreateUser = async (
  adminToken: string,
  roleId: 'systemAdmin' | 'systemFullApiRead' | 'systemUser' = 'systemUser',
  email?: string,
) => {
  const userId = `user-${nanoid()}`;
  const username = `test-${userId}`;
  const password = 'testpassword';

  const response = await api.api.createUser(
    {
      username,
      password,
      roleId,
      ...(email && { email }),
    },
    {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Create user failed: ${response.status}`);
  }

  // Login to get user token
  const loginResponse = await api.api.login({
    emailOrUsername: email || username,
    password,
  });

  return {
    username,
    email,
    password,
    token: loginResponse.data.accessToken,
    organizationId: username, // organizationId === username
  };
};

/**
 * Create a project via API
 * Note: organizationId === username (auto-created for each user)
 * For admin: organizationId = 'admin'
 */
export const apiCreateProject = async (
  token: string,
  organizationId: string,
  projectName?: string,
  branchName: string = 'master',
) => {
  const name = projectName || `project-${nanoid()}`;

  const response = await api.api.createProject(
    organizationId,
    { fromRevisionId: '' }, // query parameter
    {
      projectName: name,
      branchName,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Create project failed: ${response.status}`);
  }

  // Get root branch
  const branchResponse = await api.api.rootBranch(organizationId, name, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!branchResponse.ok) {
    throw new Error(`Get root branch failed: ${branchResponse.status}`);
  }

  return {
    projectName: name,
    project: response.data,
    organizationId,
    rootBranch: branchResponse.data,
  };
};

/**
 * Delete a project via API
 */
export const apiDeleteProject = async (
  token: string,
  organizationId: string,
  projectName: string,
) => {
  const response = await api.api.deleteProject(organizationId, projectName, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Delete project failed: ${response.status}`);
  }

  return response.data;
};

/**
 * Create a table via API
 */
export const apiCreateTable = async (
  token: string,
  revisionId: string,
  tableId: string,
  schema: object,
) => {
  const response = await api.api.createTable(
    revisionId,
    {
      tableId,
      schema,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Create table failed: ${response.status}`);
  }

  return response.data;
};

/**
 * Get table by ID (metadata only)
 */
export const apiGetTable = async (
  token: string,
  revisionId: string,
  tableId: string,
) => {
  const response = await fetch(
    `http://localhost:8080/api/revision/${revisionId}/tables/${tableId}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Get table failed: ${response.status} - ${error}`);
  }

  return response.json();
};

/**
 * Get table schema
 */
export const apiGetTableSchema = async (
  token: string,
  revisionId: string,
  tableId: string,
) => {
  const response = await fetch(
    `http://localhost:8080/api/revision/${revisionId}/tables/${tableId}/schema`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Get table schema failed: ${response.status} - ${error}`);
  }

  return response.json();
};

/**
 * Update table schema using JSON Patch
 * @param patches - Array of JSON Patch operations
 * Example: [{ op: 'replace', path: '/properties/name', value: { type: 'string', default: '' } }]
 */
export const apiUpdateTable = async (
  token: string,
  revisionId: string,
  tableId: string,
  patches: Array<{ op: string; path: string; value?: any }>,
) => {
  const response = await fetch(
    `http://localhost:8080/api/revision/${revisionId}/tables/${tableId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ patches }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Update table failed: ${response.status} - ${error}`);
  }

  return response.json();
};

/**
 * Rename table
 */
export const apiRenameTable = async (
  token: string,
  revisionId: string,
  tableId: string,
  nextTableId: string,
) => {
  const response = await fetch(
    `http://localhost:8080/api/revision/${revisionId}/tables/${tableId}/rename`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ nextTableId }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Rename table failed: ${response.status} - ${error}`);
  }

  return response.json();
};

/**
 * Delete table
 */
export const apiDeleteTable = async (
  token: string,
  revisionId: string,
  tableId: string,
) => {
  const response = await fetch(
    `http://localhost:8080/api/revision/${revisionId}/tables/${tableId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Delete table failed: ${response.status} - ${error}`);
  }

  return response.json();
};

/**
 * Get draft revision for a branch
 */
export const apiGetDraftRevision = async (
  token: string,
  organizationId: string,
  projectName: string,
  branchName: string = 'master',
) => {
  const response = await api.api.draftRevision(
    organizationId,
    projectName,
    branchName,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Get draft revision failed: ${response.status}`);
  }

  return response.data;
};

/**
 * Get HEAD revision for a branch
 */
export const apiGetHeadRevision = async (
  token: string,
  organizationId: string,
  projectName: string,
  branchName: string = 'master',
) => {
  const response = await api.api.headRevision(
    organizationId,
    projectName,
    branchName,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Get HEAD revision failed: ${response.status}`);
  }

  return response.data;
};

/**
 * Create revision (commit)
 */
export const apiCreateRevision = async (
  token: string,
  organizationId: string,
  projectName: string,
  branchName: string = 'master',
  comment: string = '',
) => {
  const response = await api.api.createRevision(
    organizationId,
    projectName,
    branchName,
    { comment },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Create revision failed: ${response.status}`);
  }

  return response.data;
};

/**
 * Revert changes (go back to HEAD)
 */
export const apiRevertChanges = async (
  token: string,
  organizationId: string,
  projectName: string,
  branchName: string = 'master',
) => {
  const response = await api.api.revertChanges(
    organizationId,
    projectName,
    branchName,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Revert changes failed: ${response.status}`);
  }

  return response.data;
};

/**
 * Create a row via API
 */
export const apiCreateRow = async (
  token: string,
  revisionId: string,
  tableId: string,
  data: object,
  rowId?: string,
) => {
  // Note: Use /create-row endpoint, not /rows (which is for querying)
  const response = await fetch(
    `http://localhost:8080/api/revision/${revisionId}/tables/${tableId}/create-row`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        rowId: rowId || nanoid(),
        data,
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Create row failed: ${response.status} - ${error}`);
  }

  return response.json();
};

/**
 * Get a row by ID
 */
export const apiGetRow = async (
  token: string,
  revisionId: string,
  tableId: string,
  rowId: string,
) => {
  const response = await fetch(
    `http://localhost:8080/api/revision/${revisionId}/tables/${tableId}/rows/${rowId}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Get row failed: ${response.status} - ${error}`);
  }

  return response.json();
};

/**
 * Update a row
 */
export const apiUpdateRow = async (
  token: string,
  revisionId: string,
  tableId: string,
  rowId: string,
  data: object,
) => {
  const response = await fetch(
    `http://localhost:8080/api/revision/${revisionId}/tables/${tableId}/rows/${rowId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ data }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Update row failed: ${response.status} - ${error}`);
  }

  return response.json();
};

/**
 * Delete a row
 */
export const apiDeleteRow = async (
  token: string,
  revisionId: string,
  tableId: string,
  rowId: string,
) => {
  const response = await fetch(
    `http://localhost:8080/api/revision/${revisionId}/tables/${tableId}/rows/${rowId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Delete row failed: ${response.status} - ${error}`);
  }

  return response.json();
};

/**
 * Add user to organization
 */
export const apiAddUserToOrganization = async (
  token: string,
  organizationId: string,
  userId: string,
  roleId:
    | 'organizationOwner'
    | 'organizationAdmin'
    | 'developer'
    | 'editor'
    | 'reader',
) => {
  const response = await api.api.addUserToOrganization(
    organizationId,
    {
      userId,
      roleId,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Add user to organization failed: ${response.status}`);
  }

  return response.data;
};

/**
 * Add user to project
 */
export const apiAddUserToProject = async (
  token: string,
  organizationId: string,
  projectName: string,
  userId: string,
  roleId: 'developer' | 'editor' | 'reader',
) => {
  const response = await api.api.addUserToProject(
    organizationId,
    projectName,
    {
      userId,
      roleId,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Add user to project failed: ${response.status}`);
  }

  return response.data;
};

/**
 * Create a branch from a revision
 */
export const apiCreateBranch = async (
  token: string,
  revisionId: string,
  branchName: string,
) => {
  const response = await api.api.createBranch(
    revisionId,
    { branchName },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Create branch failed: ${response.status}`);
  }

  return response.data;
};

/**
 * Get branch by name
 */
export const apiGetBranch = async (
  token: string,
  organizationId: string,
  projectName: string,
  branchName: string,
) => {
  const response = await api.api.branch(
    organizationId,
    projectName,
    branchName,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Get branch failed: ${response.status}`);
  }

  return response.data;
};

/**
 * Get endpoints for a revision
 */
export const apiGetEndpoints = async (
  token: string,
  revisionId: string,
) => {
  const response = await api.api.endpoints(revisionId, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Get endpoints failed: ${response.status}`);
  }

  return response.data;
};

/**
 * Create an endpoint
 */
export const apiCreateEndpoint = async (
  token: string,
  revisionId: string,
  type: 'GRAPHQL' | 'REST_API',
) => {
  const response = await api.api.createEndpoint(
    revisionId,
    { type },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Create endpoint failed: ${response.status}`);
  }

  return response.data;
};

/**
 * Delete an endpoint
 */
export const apiDeleteEndpoint = async (
  token: string,
  endpointId: string,
) => {
  const response = await api.api.deleteEndpoint(endpointId, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Delete endpoint failed: ${response.status}`);
  }

  return response.data;
};
