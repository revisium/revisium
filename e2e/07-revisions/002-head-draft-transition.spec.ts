import { test, expect, Page } from '@playwright/test';
import { createProject } from 'e2e/utils/createProject';
import { generateProjectName } from 'e2e/utils/generateProjectName';
import { login } from 'e2e/utils/login';
import { removeProject } from 'e2e/utils/removeProject';

const projectName = generateProjectName();

test.describe('Revisions - HEAD ↔ DRAFT Transition', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();

    await login({ page });
    await createProject({ page, projectName });
  });

  test.describe('Initial State - HEAD Mode', () => {
    test.skip('should start in HEAD mode with no changes', async () => {
      // TODO: After creating project
      // Verify in HEAD state (not draft)
      // URL should contain master or HEAD reference
    });

    test.skip('should show HEAD indicator badge', async () => {
      // TODO: Look for HEAD badge/indicator in UI
      // Verify it's visible
      // Verify "DRAFT" badge is not shown
    });

    test.skip('should have commit button disabled', async () => {
      // TODO: Find create revision/commit button
      // Verify it's disabled or not visible
      // Tooltip/hint: "No changes to commit"
    });

    test.skip('should have revert button disabled', async () => {
      // TODO: Find revert changes button
      // Verify it's disabled or not visible
      // No changes to revert yet
    });

    test.skip('should not show "has changes" indicator', async () => {
      // TODO: Check for "has changes" badge/indicator
      // Verify it's not shown
    });

    test.skip('should be editable (can create table)', async () => {
      // TODO: Verify create table button is clickable
      // HEAD mode should still allow editing
      // First edit will trigger DRAFT mode
    });
  });

  test.describe('Transition: HEAD → DRAFT', () => {
    test.skip('should transition to DRAFT on first change', async () => {
      // TODO: Make first change (create table)
      // Verify mode changed from HEAD to DRAFT
      // Check URL change
    });

    test.skip('should replace HEAD badge with DRAFT badge', async () => {
      // TODO: Before change: HEAD badge visible
      // Make change (create table)
      // After change: DRAFT badge visible, HEAD badge hidden
    });

    test.skip('should update URL from HEAD to draft', async () => {
      // TODO: Check URL before change (might be /master or /master/-/head)
      // Make change
      // Check URL after change (should be /master/-/draft)
    });

    test.skip('should show "has changes" indicator', async () => {
      // TODO: Make change
      // Verify "has changes" indicator appears
      // Should show count or list of changes
    });

    test.skip('should enable commit button', async () => {
      // TODO: Before change: commit button disabled
      // Make change
      // After change: commit button enabled
      // Can click to create revision
    });

    test.skip('should enable revert button', async () => {
      // TODO: Before change: revert button disabled
      // Make change
      // After change: revert button enabled
      // Can click to discard changes
    });
  });

  test.describe('DRAFT Mode Operations', () => {
    test.skip('should stay in DRAFT after multiple changes', async () => {
      // TODO: Make first change → DRAFT
      // Make second change → still DRAFT
      // Make third change → still DRAFT
      // Verify DRAFT mode persists
    });

    test.skip('should accumulate changes in DRAFT', async () => {
      // TODO: Create table 1 → 1 change
      // Create table 2 → 2 changes
      // Add row → 3 changes
      // Verify "has changes" indicator updates
    });

    test.skip('should persist DRAFT state on page reload', async () => {
      // TODO: Make changes → DRAFT mode
      // Reload page
      // Verify still in DRAFT mode
      // Verify changes still present
      // Verify indicators still shown
    });
  });

  test.describe('Transition: DRAFT → HEAD (via Commit)', () => {
    test.skip('should return to HEAD after commit', async () => {
      // TODO: Make changes → DRAFT
      // Click commit button
      // Confirm/submit
      // Verify returned to HEAD mode
    });

    test.skip('should replace DRAFT badge with HEAD badge', async () => {
      // TODO: In DRAFT: DRAFT badge visible
      // Commit changes
      // After commit: HEAD badge visible, DRAFT badge hidden
    });

    test.skip('should update URL from draft to HEAD', async () => {
      // TODO: In DRAFT: URL = /master/-/draft
      // Commit changes
      // After commit: URL = /master or /master/-/head
    });

    test.skip('should hide "has changes" indicator', async () => {
      // TODO: In DRAFT: "has changes" visible
      // Commit changes
      // After commit: indicator hidden
    });

    test.skip('should disable commit button', async () => {
      // TODO: In DRAFT: commit button enabled
      // Commit changes
      // After commit: commit button disabled (no changes)
    });

    test.skip('should disable revert button', async () => {
      // TODO: In DRAFT: revert button enabled
      // Commit changes
      // After commit: revert button disabled (no changes)
    });
  });

  test.describe('Transition: DRAFT → HEAD (via Revert)', () => {
    test.skip('should return to HEAD after revert', async () => {
      // TODO: Make changes → DRAFT
      // Click revert button
      // Confirm discard
      // Verify returned to HEAD mode
    });

    test.skip('should replace DRAFT badge with HEAD badge', async () => {
      // TODO: In DRAFT: DRAFT badge visible
      // Revert changes
      // After revert: HEAD badge visible, DRAFT badge hidden
    });

    test.skip('should update URL from draft to HEAD', async () => {
      // TODO: In DRAFT: URL = /master/-/draft
      // Revert changes
      // After revert: URL = /master or /master/-/head
    });

    test.skip('should hide "has changes" indicator', async () => {
      // TODO: In DRAFT: "has changes" visible
      // Revert changes
      // After revert: indicator hidden
    });

    test.skip('should disable commit button', async () => {
      // TODO: In DRAFT: commit button enabled
      // Revert changes
      // After revert: commit button disabled
    });

    test.skip('should disable revert button', async () => {
      // TODO: In DRAFT: revert button enabled
      // Revert changes
      // After revert: revert button disabled
    });
  });

  test.describe('New DRAFT Cycle', () => {
    test.skip('should allow new DRAFT cycle after commit', async () => {
      // TODO: Make changes → DRAFT
      // Commit → HEAD
      // Make new changes → DRAFT again
      // Verify new DRAFT cycle started
      // Verify can commit again
    });

    test.skip('should allow new DRAFT cycle after revert', async () => {
      // TODO: Make changes → DRAFT
      // Revert → HEAD
      // Make new changes → DRAFT again
      // Verify new DRAFT cycle started
      // Verify independent from previous DRAFT
    });
  });

  test.afterAll(async () => {
    await removeProject({ page, projectName });
    await page.close();
  });
});
