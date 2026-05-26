import { test, expect } from '@playwright/test';

test.describe('认证流程 E2E系统测试', () => {
  test('完整注册 → 登录 → 跳转首页流程', async ({ page }) => {
    await page.goto('/');

    // 导航到注册页
    await page.click('text=注册');
    await expect(page).toHaveURL('/register');

    // 填写注册信息
    await page.fill('input[name="email"]', 'e2e-test@puppyforge.ai');
    await page.fill('input[name="password"]', 'SecureE2E123!');
    await page.fill('input[name="confirmPassword"]', 'SecureE2E123!');
    await page.click('button[type="submit"]');

    // 验证注册成功
    await expect(page.getByText('注册成功')).toBeVisible();

    // 跳转登录页
    await page.click('text=登录');
    await expect(page).toHaveURL('/login');

    // 执行登录
    await page.fill('input[name="email"]', 'e2e-test@puppyforge.ai');
    await page.fill('input[name="password"]', 'SecureE2E123!');
    await page.click('button[type="submit"]');

    // 验证登录成功并跳转仪表盘
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('欢迎回来')).toBeVisible();
  });

  test('登录失败 - 错误凭证', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'wrong@puppyforge.ai');
    await page.fill('input[name="password"]', 'wrongpass');
    await page.click('button[type="submit"]');

    await expect(page.getByText('邮箱或密码错误')).toBeVisible();
  });
});
