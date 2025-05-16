import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.getByTestId('login-emailOrUsername-input');
    this.passwordInput = page.getByTestId('login-password-input');
    this.loginButton = page.locator('button', { hasText: 'Login' });
  }

  async login(username: string, password: string) {
    await this.page.goto('http://localhost:8080/');
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
