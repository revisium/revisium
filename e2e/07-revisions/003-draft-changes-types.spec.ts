import { test, expect, Page } from '@playwright/test';
import { createProject } from 'e2e/utils/createProject';
import { generateProjectName } from 'e2e/utils/generateProjectName';
import { login } from 'e2e/utils/login';
import { removeProject } from 'e2e/utils/removeProject';

const projectName = generateProjectName();

test.describe('Revisions - Different Change Types Trigger DRAFT', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();

    await login({ page });
    await createProject({ page, projectName });
  });

  test.describe('Table Operations Trigger DRAFT', () => {
    test.skip('should trigger DRAFT when creating new table', async () => {
      // TODO: Verify in HEAD mode initially
      // Create new table
      // Verify transitioned to DRAFT mode
      // Verify DRAFT indicator visible
      // Verify URL changed to draft
    });

    test.skip('should trigger DRAFT when editing table schema', async () => {
      // TODO: Commit previous changes to go back to HEAD
      // Edit existing table schema
      // Verify transitioned to DRAFT mode
    });

    test.skip('should trigger DRAFT when renaming table', async () => {
      // TODO: Commit to HEAD
      // Rename existing table
      // Verify DRAFT mode triggered
    });

    test.skip('should trigger DRAFT when deleting table', async () => {
      // TODO: Commit to HEAD
      // Delete existing table
      // Verify DRAFT mode triggered
    });

    test.skip('should trigger DRAFT when copying table', async () => {
      // TODO: Commit to HEAD
      // Copy existing table
      // Verify DRAFT mode triggered
    });
  });

  test.describe('Schema Operations Trigger DRAFT', () => {
    test.skip('should trigger DRAFT when adding field to schema', async () => {
      // TODO: Create table and commit (in HEAD)
      // Open schema editor
      // Add new field
      // Save schema
      // Verify DRAFT mode triggered
    });

    test.skip('should trigger DRAFT when removing field from schema', async () => {
      // TODO: Table with schema in HEAD
      // Remove field from schema
      // Save
      // Verify DRAFT mode
    });

    test.skip('should trigger DRAFT when changing field type', async () => {
      // TODO: Table with schema in HEAD
      // Change field type (string → number)
      // Save
      // Verify DRAFT mode
    });

    test.skip('should trigger DRAFT when adding foreign key', async () => {
      // TODO: Table with schema in HEAD
      // Add foreign key field
      // Save
      // Verify DRAFT mode
    });

    test.skip('should trigger DRAFT when reordering fields', async () => {
      // TODO: Table with multiple fields in HEAD
      // Reorder fields via drag-drop
      // Save
      // Verify DRAFT mode
    });
  });

  test.describe('Row Operations Trigger DRAFT', () => {
    test.skip('should trigger DRAFT when creating new row', async () => {
      // TODO: Table with schema in HEAD
      // Create new row
      // Save row
      // Verify DRAFT mode triggered
    });

    test.skip('should trigger DRAFT when editing existing row', async () => {
      // TODO: Table with row in HEAD
      // Edit row data
      // Save changes
      // Verify DRAFT mode triggered
    });

    test.skip('should trigger DRAFT when deleting row', async () => {
      // TODO: Table with row in HEAD
      // Delete row
      // Confirm deletion
      // Verify DRAFT mode triggered
    });

    test.skip('should trigger DRAFT when copying row', async () => {
      // TODO: Table with row in HEAD
      // Copy row with new ID
      // Save copied row
      // Verify DRAFT mode triggered
    });

    test.skip('should trigger DRAFT when batch deleting rows', async () => {
      // TODO: Multiple rows in HEAD
      // Select multiple rows
      // Delete selected
      // Verify DRAFT mode
    });
  });

  test.describe('Multiple Changes Accumulate', () => {
    test.skip('should accumulate table and row changes', async () => {
      // TODO: Start in HEAD
      // Create table → DRAFT (1 change)
      // Add row → DRAFT (2 changes)
      // Verify both changes tracked
      // Verify "has changes" shows 2
    });

    test.skip('should accumulate schema and row changes', async () => {
      // TODO: Table in HEAD
      // Edit schema → DRAFT (1 change)
      // Add row → DRAFT (2 changes)
      // Edit another row → DRAFT (3 changes)
      // Verify all changes tracked
    });

    test.skip('should track mixed operations', async () => {
      // TODO: Start in HEAD
      // Create table A → DRAFT
      // Create table B → DRAFT
      // Add row to table A → DRAFT
      // Edit row in table A → DRAFT
      // Delete table B → DRAFT
      // Verify all 5 changes tracked
      // Verify correct change count/list
    });
  });

  test.describe('DRAFT State Persists', () => {
    test.skip('should preserve DRAFT after page reload', async () => {
      // TODO: Make changes → DRAFT
      // Note change count
      // Reload page
      // Verify still in DRAFT
      // Verify same change count
      // Verify all changes present
    });

    test.skip('should preserve DRAFT when navigating away and back', async () => {
      // TODO: Make changes in table A → DRAFT
      // Navigate to project list
      // Navigate back to project
      // Verify still in DRAFT
      // Verify changes preserved
    });

    test.skip('should preserve DRAFT when switching tables', async () => {
      // TODO: Table A with changes → DRAFT
      // Navigate to table B
      // Verify still in DRAFT (project-level)
      // Navigate back to table A
      // Verify changes still there
    });
  });

  test.describe('Commit Resets Change Tracking', () => {
    test.skip('should clear all changes after commit', async () => {
      // TODO: Make multiple changes → DRAFT
      // Note change list
      // Commit all changes
      // Verify back to HEAD
      // Verify change count = 0
      // Verify "has changes" hidden
    });

    test.skip('should allow new changes after commit', async () => {
      // TODO: Make changes → DRAFT → Commit → HEAD
      // Make new changes → New DRAFT
      // Verify new change tracking started
      // Verify previous changes not shown
    });
  });

  test.describe('Revert Clears All Changes', () => {
    test.skip('should discard all pending changes on revert', async () => {
      // TODO: Create table A → DRAFT
      // Create table B → DRAFT
      // Add rows → DRAFT
      // Revert all changes
      // Verify back to HEAD
      // Verify table A gone
      // Verify table B gone
      // Verify rows gone
      // Verify change count = 0
    });

    test.skip('should restore original state after revert', async () => {
      // TODO: Table X with row Y in HEAD (committed)
      // Edit row Y → DRAFT
      // Delete table X → DRAFT
      // Revert changes
      // Verify table X back
      // Verify row Y has original data
      // Verify no changes indicated
    });
  });

  test.afterAll(async () => {
    await removeProject({ page, projectName });
    await page.close();
  });
});
