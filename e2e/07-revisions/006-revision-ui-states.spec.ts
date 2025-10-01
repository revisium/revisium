import { test, expect, Page } from '@playwright/test';
import { createProject } from 'e2e/utils/createProject';
import { generateProjectName } from 'e2e/utils/generateProjectName';
import { login } from 'e2e/utils/login';
import { removeProject } from 'e2e/utils/removeProject';

const projectName = generateProjectName();

test.describe('Revisions - UI States and Indicators', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();

    await login({ page });
    await createProject({ page, projectName });
  });

  test.describe('Revision Badges', () => {
    test.skip('should show HEAD badge when no changes', async () => {
      // TODO: Check for HEAD badge in UI
      // Should be visible in initial state
      // Location: near revision info or in header
    });

    test.skip('should show DRAFT badge when has changes', async () => {
      // TODO: Make a change
      // Check for DRAFT badge
      // Should replace HEAD badge
      // Different color/style from HEAD
    });

    test.skip('should toggle between HEAD and DRAFT badges', async () => {
      // TODO: HEAD state → HEAD badge
      // Make change → DRAFT badge
      // Commit → HEAD badge
      // Make change → DRAFT badge
      // Revert → HEAD badge
    });

    test.skip('should show revision ID/name in badge', async () => {
      // TODO: Check badge text
      // Should include revision identifier
      // Format: "HEAD" or "DRAFT" with revision info
    });
  });

  test.describe('Has Changes Indicator', () => {
    test.skip('should show "has changes" indicator in DRAFT', async () => {
      // TODO: Make change
      // Look for "has changes" indicator
      // Verify it's visible
      // Check text/icon
    });

    test.skip('should show change count', async () => {
      // TODO: Make 1 change → shows "1 change"
      // Make 2nd change → shows "2 changes"
      // Make 3rd change → shows "3 changes"
    });

    test.skip('should hide indicator in HEAD mode', async () => {
      // TODO: In HEAD (no changes)
      // Verify "has changes" indicator not visible
    });

    test.skip('should update count in real-time', async () => {
      // TODO: Start with 0 changes
      // Create table → 1 change (verify count updates)
      // Add row → 2 changes (verify count updates)
      // Delete table → 3 changes (verify count updates)
    });

    test.skip('should show list of changes on hover/click', async () => {
      // TODO: Make multiple changes
      // Hover over "has changes" indicator
      // Verify tooltip/dropdown shows change list
      // Format: "Created table X", "Added row Y"
    });
  });

  test.describe('Commit Button States', () => {
    test.skip('should be disabled in HEAD mode', async () => {
      // TODO: In HEAD (no changes)
      // Find commit/create revision button
      // Verify it's disabled
      // Check disabled styling
    });

    test.skip('should be enabled in DRAFT mode', async () => {
      // TODO: Make change → DRAFT
      // Find commit button
      // Verify it's enabled
      // Verify clickable
    });

    test.skip('should show tooltip when disabled', async () => {
      // TODO: Hover over disabled commit button
      // Verify tooltip: "No changes to commit" or similar
    });

    test.skip('should show tooltip when enabled', async () => {
      // TODO: In DRAFT, hover commit button
      // Verify tooltip: "Commit N changes" or similar
    });

    test.skip('should disable after successful commit', async () => {
      // TODO: In DRAFT, click commit
      // Complete commit
      // Verify button becomes disabled
      // Now in HEAD mode
    });
  });

  test.describe('Revert Button States', () => {
    test.skip('should be disabled in HEAD mode', async () => {
      // TODO: In HEAD (no changes)
      // Find revert button
      // Verify it's disabled
    });

    test.skip('should be enabled in DRAFT mode', async () => {
      // TODO: Make change → DRAFT
      // Find revert button
      // Verify it's enabled
    });

    test.skip('should show tooltip when disabled', async () => {
      // TODO: Hover over disabled revert button
      // Verify tooltip: "No changes to revert"
    });

    test.skip('should show tooltip when enabled', async () => {
      // TODO: In DRAFT, hover revert button
      // Verify tooltip: "Discard N changes" or similar
    });

    test.skip('should disable after successful revert', async () => {
      // TODO: In DRAFT, click revert
      // Confirm discard
      // Verify button becomes disabled
      // Now in HEAD mode
    });
  });

  test.describe('Breadcrumb Navigation', () => {
    test.skip('should show HEAD in breadcrumb when no changes', async () => {
      // TODO: Check breadcrumb path
      // Should include "HEAD" or revision name
      // Format: Project / Branch / HEAD
    });

    test.skip('should show DRAFT in breadcrumb when has changes', async () => {
      // TODO: Make change → DRAFT
      // Check breadcrumb path
      // Should show "DRAFT" instead of "HEAD"
      // Format: Project / Branch / DRAFT
    });

    test.skip('should be clickable to navigate', async () => {
      // TODO: Click breadcrumb items
      // Navigate to project, branch, etc.
      // Verify navigation works
    });
  });

  test.describe('URL Reflects State', () => {
    test.skip('should show HEAD in URL when no changes', async () => {
      // TODO: In HEAD mode
      // Check current URL
      // Format: /{project}/{branch} or /{project}/{branch}/-/head
    });

    test.skip('should show draft in URL when has changes', async () => {
      // TODO: Make change → DRAFT
      // Check current URL
      // Should contain "draft"
      // Format: /{project}/{branch}/-/draft
    });

    test.skip('should update URL on commit', async () => {
      // TODO: DRAFT mode with URL /project/branch/-/draft
      // Commit changes
      // Verify URL changes to HEAD format
    });

    test.skip('should update URL on revert', async () => {
      // TODO: DRAFT mode with URL /project/branch/-/draft
      // Revert changes
      // Verify URL changes to HEAD format
    });
  });

  test.describe('Revision Selector', () => {
    test.skip('should show current revision in selector', async () => {
      // TODO: Look for revision dropdown/selector
      // Verify shows "HEAD" or "DRAFT"
      // Verify shows revision ID if available
    });

    test.skip('should highlight current revision', async () => {
      // TODO: Open revision selector
      // Current revision should be highlighted/selected
      // Different styling from other revisions
    });

    test.skip('should show DRAFT at top of list', async () => {
      // TODO: When in DRAFT, open selector
      // DRAFT should be first in list
      // Or marked as "current working state"
    });

    test.skip('should show HEAD in list', async () => {
      // TODO: Open revision selector
      // HEAD revision should be visible
      // Marked with HEAD badge/indicator
    });
  });

  test.describe('Unsaved Changes Warning', () => {
    test.skip('should warn when leaving page with unsaved changes', async () => {
      // TODO: Make changes → DRAFT
      // Try to navigate away (click browser back)
      // Verify warning dialog appears
      // Message: "You have unsaved changes"
    });

    test.skip('should allow cancel navigation', async () => {
      // TODO: DRAFT with changes
      // Try to leave page
      // Click "Cancel" in warning dialog
      // Verify stayed on page
      // Verify changes still present
    });

    test.skip('should allow confirm navigation', async () => {
      // TODO: DRAFT with changes
      // Try to leave page
      // Click "Leave" in warning dialog
      // Verify navigated away
      // Return to project → verify changes still in DRAFT
    });

    test.skip('should not warn in HEAD mode', async () => {
      // TODO: In HEAD (no changes)
      // Navigate away
      // Verify no warning shown
      // Navigation happens immediately
    });

    test.skip('should not warn after commit', async () => {
      // TODO: In DRAFT → Commit → HEAD
      // Navigate away
      // Verify no warning
    });
  });

  test.afterAll(async () => {
    await removeProject({ page, projectName });
    await page.close();
  });
});
