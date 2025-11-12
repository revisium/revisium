import { test, expect, Page } from '@playwright/test';
import { createProject } from 'e2e/utils/createProject';
import { generateProjectName } from 'e2e/utils/generateProjectName';
import { login } from 'e2e/utils/login';
import { removeProject } from 'e2e/utils/removeProject';

const projectName = generateProjectName();

test.describe.skip('Workflow - Blog CMS', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    await login({ page });
  });

  test.describe('Complete Blog CMS Setup', () => {
    test('Step 1: Create blog project', async () => {
      await createProject({ page, projectName });
      await page.goto(`/app/admin/${projectName}/master`);
      await expect(page).toHaveURL(new RegExp(`${projectName}/master`));
      await expect(page.getByTestId('create-table-button')).toBeVisible();
    });

    test('Step 2: Create authors table', async () => {
      // Create table with schema
      await page.getByTestId('create-table-button').click();
      await page.getByTestId('0').fill('authors');

      // Add field: name (string)
      await page.getByTestId('0-create-field-button').click();
      await page.getByTestId('0-0').fill('name');
      await page.getByTestId('0-0-select-type-button').click();
      await page.getByTestId('0-0-menu-type-String').click();

      // Add field: email (string)
      await page.getByTestId('0-create-field-button').click();
      await page.getByTestId('0-1').fill('email');
      await page.getByTestId('0-1-select-type-button').click();
      await page.getByTestId('0-1-menu-type-String').click();

      // Add field: bio (string)
      await page.getByTestId('0-create-field-button').click();
      await page.getByTestId('0-2').fill('bio');
      await page.getByTestId('0-2-select-type-button').click();
      await page.getByTestId('0-2-menu-type-String').click();

      // Save and return to list
      await page.getByTestId('schema-editor-approve-button').click();
      await page.getByTestId('back-to-table-list-button').click();

      // Verify table created
      await expect(page.getByText('authors')).toBeVisible();
    });

    test('Step 3: Create categories table', async () => {
      // Create table with schema
      await page.getByTestId('create-table-button').click();
      await page.getByTestId('0').fill('categories');

      // Add field: name (string)
      await page.getByTestId('0-create-field-button').click();
      await page.getByTestId('0-0').fill('name');
      await page.getByTestId('0-0-select-type-button').click();
      await page.getByTestId('0-0-menu-type-String').click();

      // Add field: slug (string)
      await page.getByTestId('0-create-field-button').click();
      await page.getByTestId('0-1').fill('slug');
      await page.getByTestId('0-1-select-type-button').click();
      await page.getByTestId('0-1-menu-type-String').click();

      // Add field: description (string)
      await page.getByTestId('0-create-field-button').click();
      await page.getByTestId('0-2').fill('description');
      await page.getByTestId('0-2-select-type-button').click();
      await page.getByTestId('0-2-menu-type-String').click();

      // Save and return to list
      await page.getByTestId('schema-editor-approve-button').click();
      await page.getByTestId('back-to-table-list-button').click();

      // Verify table created
      await expect(page.getByText('categories')).toBeVisible();
    });

    test('Step 4: Create posts table with foreign keys', async () => {
      // Create table with schema
      await page.getByTestId('create-table-button').click();
      await page.getByTestId('0').fill('posts');

      // Add field: title (string, default type)
      await page.getByTestId('0-create-field-button').click();
      await page.getByTestId('0-0').fill('title');

      // Add field: author (foreign key to authors)
      await page.getByTestId('0-create-field-button').click();
      await page.getByTestId('0-1').fill('author');
      await page.getByTestId('0-1-select-type-button').click();
      await page.getByTestId('0-1-menu-type-ForeignKeyString').click();
      await page.getByTestId('0-1-0-connect-foreign-key').click();
      await page.getByTestId('table-authors-select').click();

      // Add field: categories (array of foreign keys)
      await page.getByTestId('0-create-field-button').click();
      await page.getByTestId('0-2').fill('categories');
      await page.getByTestId('0-2-select-type-button').click();
      await page.getByTestId('0-2-menu-type-Array').click();
      await page.getByRole('paragraph').filter({ hasText: 'string' }).click();
      await page.getByTestId('0-2-menu-type-ForeignKeyString').last().click();
      await page.getByTestId('0-2-0-0-connect-foreign-key').click();
      await page.getByTestId('table-categories-select').click();

      // Save and return to list
      await page.getByTestId('schema-editor-approve-button').click();
      await page.getByTestId('back-to-table-list-button').click();

      // Verify all tables created
      await expect(page.getByText('authors')).toBeVisible();
      await expect(page.getByText('categories')).toBeVisible();
      await expect(page.getByText('posts')).toBeVisible();
    });

    test.skip('Step 5: Add sample authors', async () => {
      // Navigate to authors table
      await page.getByTestId('table-authors-link').click();

      // Create author: john-doe
      await page.getByTestId('create-row-button').click();
      await page.getByTestId('0').fill('john-doe');
      await page.getByTestId('approve-create-row-button').click();
      await page.getByTestId('back-to-row-list-button').click();

      // Create author: jane-smith
      await page.getByTestId('create-row-button').click();
      await page.getByTestId('0').fill('jane-smith');
      await page.getByTestId('approve-create-row-button').click();
      await page.getByTestId('back-to-row-list-button').click();

      // Verify authors visible in list
      await expect(page.getByText('john-doe')).toBeVisible();
      await expect(page.getByText('jane-smith')).toBeVisible();
    });

    test.skip('Step 6: Add sample categories', async () => {
      // Navigate back to table list via breadcrumb
      await page.getByTestId('breadcrumb-branch-master').click();
      await expect(page.getByTestId('create-table-button')).toBeVisible();

      // Navigate to categories table
      await page.getByTestId('table-categories-link').click();

      // Create category: tech
      await page.getByTestId('create-row-button').click();
      await page.getByTestId('0').fill('tech');
      await page.getByTestId('approve-create-row-button').click();
      await page.getByTestId('back-to-row-list-button').click();

      // Create category: news
      await page.getByTestId('create-row-button').click();
      await page.getByTestId('0').fill('news');
      await page.getByTestId('approve-create-row-button').click();
      await page.getByTestId('back-to-row-list-button').click();

      // Verify categories visible
      await expect(page.getByText('tech')).toBeVisible();
      await expect(page.getByText('news')).toBeVisible();
    });

    test.skip('Step 7: Add sample posts', async () => {
      // Navigate back to table list via breadcrumb
      await page.getByTestId('breadcrumb-branch-master').click();
      await expect(page.getByTestId('create-table-button')).toBeVisible();

      // Navigate to posts table
      await page.getByTestId('table-posts-link').click();

      // Create post: first-post
      await page.getByTestId('create-row-button').click();
      await page.getByTestId('0').fill('first-post');
      await page.getByTestId('approve-create-row-button').click();
      await page.getByTestId('back-to-row-list-button').click();

      // Create post: second-post
      await page.getByTestId('create-row-button').click();
      await page.getByTestId('0').fill('second-post');
      await page.getByTestId('approve-create-row-button').click();
      await page.getByTestId('back-to-row-list-button').click();

      // Verify posts visible
      await expect(page.getByText('first-post')).toBeVisible();
      await expect(page.getByText('second-post')).toBeVisible();
    });

    test.skip('Step 9: Create first revision', async () => {
      // TODO: Click "Create Revision" button
      // Enter message: "Initial blog content"
      // Verify revision created
      // Verify draft is now empty (no changes)
    });

    test.skip('Step 10: Enable GraphQL endpoint', async () => {
      // TODO: Find endpoints section
      // Enable GraphQL endpoint
      // Verify URL generated
      // Copy URL for later use
    });

    test.skip('Step 11: Query blog data via GraphQL', async () => {
      // TODO: Open Apollo Sandbox or use API
      // Execute query to fetch posts with authors
      // Verify data returned correctly
      // Verify foreign key relationships resolved
    });

    test.skip('Step 12: Create draft branch for new content', async () => {
      // TODO: Create branch: "draft-posts"
      // Verify branch created from current revision
      // Switch to new branch
    });

    test.skip('Step 13: Add more posts in draft branch', async () => {
      // TODO: In draft-posts branch
      // Add 2-3 more posts
      // Verify posts exist in this branch
    });

    test.skip('Step 14: Create revision in draft branch', async () => {
      // TODO: Create revision: "Added draft posts"
      // Verify revision created in branch
    });

    test.skip('Step 15: Switch between branches', async () => {
      // TODO: Switch to master branch
      // Verify only original posts visible
      // Switch to draft-posts branch
      // Verify all posts visible
    });

    test.skip('Step 16: Test public access', async () => {
      // TODO: Make project public (if not already)
      // Test GraphQL endpoint without auth
      // Verify read access works
    });
  });

  test.afterAll(async () => {
    await removeProject({ page, projectName });
    await page.close();
  });
});
