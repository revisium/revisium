import { test } from '@playwright/test';
import { login } from 'e2e/utils/login';
import { ProjectPage } from './pages/ProjectPage';

test('Create a new project', async ({ page }) => {
  await login({ page }); 

  const projectPage = new ProjectPage(page);
  const projectName = 'TestProject';

  await projectPage.createProject(projectName);
  await projectPage.expectProjectExists(projectName);
});
