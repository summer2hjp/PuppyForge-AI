import { test, expect } from '@playwright/test';

test.describe('PuppyForge AI E2E 集成测试', () => {

  test('首页加载 — 页面标题和核心元素', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/PuppyForge/);
    // 首页主页内容应该渲染
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('AuthModal — 登录弹窗打开验证', async ({ page }) => {
    await page.goto('/');
    // 等待页面加载
    await page.waitForLoadState('networkidle');
    // 点击登录/注册按钮触发弹窗
    const authTrigger = page.locator('button, a', { hasText: /登录|注册|开始|Login|Register|Sign/i }).first();
    if (await authTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
      await authTrigger.click();
      await page.waitForTimeout(1000);
    }
    // 验证弹窗或页面中存在 auth 相关元素
    const hasAuthForm = await page.locator('input[type="email"], input[name="email"], input[placeholder*="邮箱"], input[placeholder*="Email"]').isVisible({ timeout: 3000 }).catch(() => false);
    if (!hasAuthForm) {
      // 可能未登录状态直接显示主页，检查是否有聊天输入框
      const chatInput = page.locator('textarea, input[placeholder*="输入"], input[placeholder*="message"]').first();
      await expect(chatInput).toBeAttached({ timeout: 5000 });
    }
  });

  test('新模块: 宠物锻造 Forge 页面', async ({ page }) => {
    const response = await page.goto('/forge');
    expect(response?.status()).toBe(200);
    // 验证页面标题包含关键文字
    await expect(page.locator('h1')).toContainText(/锻造|Forge|铸造/i);
  });

  test('新模块: 记忆时间线 Memory 页面', async ({ page }) => {
    const response = await page.goto('/memory');
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toContainText(/记忆|Memory|时间线/i);
  });

  test('新模块: 叛逆模式 Rebel 页面', async ({ page }) => {
    const response = await page.goto('/rebel');
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toContainText(/叛逆|Rebel/i);
  });

  test('新模块: 视觉诊断 Diagnosis 页面', async ({ page }) => {
    const response = await page.goto('/diagnosis');
    expect(response?.status()).toBe(200);
    // 诊断页面使用 h2 作为主标题
    await expect(page.locator('h2')).toContainText(/诊断|Diagnosis|视觉/i);
  });

  test('新模块: 互动记录 Interact 页面', async ({ page }) => {
    const response = await page.goto('/interact');
    expect(response?.status()).toBe(200);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('导航路由: Profile 页面', async ({ page }) => {
    const response = await page.goto('/profile');
    expect(response?.status()).toBe(200);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('错误路由: 不存在的页面返回 404', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist');
    // 404 页面的内容验证
    await expect(page.locator('body')).toContainText(/404/);
  });

  test('各模块页面导航跳转', async ({ page }) => {
    // 测试路由跳转：主页 → Forge → Memory → Rebel → 主页
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.goto('/forge');
    await expect(page.locator('h1')).toBeVisible({ timeout: 5000 });

    await page.goto('/memory');
    await expect(page.locator('h1')).toBeVisible({ timeout: 5000 });

    await page.goto('/rebel');
    await expect(page.locator('h1')).toBeVisible({ timeout: 5000 });

    await page.goto('/diagnosis');
    await expect(page.locator('h2')).toBeVisible({ timeout: 5000 });

    await page.goto('/interact');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('PWA Manifest 可访问', async ({ page }) => {
    const response = await page.goto('/manifest.webmanifest');
    expect(response?.status()).toBe(200);
    const json = await response?.json();
    expect(json).toBeDefined();
    expect(json.name).toContain('PuppyForge');
  });
});
