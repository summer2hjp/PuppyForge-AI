import { test, expect } from '@playwright/test';

test.describe('Vision分析 + Diagnosis E2E系统测试', () => {
  test.beforeEach(async ({ page }) => {
    // 登录（使用已注册账号）
    await page.goto('/login');
    await page.fill('input[name="email"]', 'e2e-test@puppyforge.ai');
    await page.fill('input[name="password"]', 'SecureE2E123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('上传宠物照片 → AI分析 → 生成诊断报告', async ({ page }) => {
    await page.goto('/diagnosis');

    // 上传图片
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('public/test-assets/puppy-test.jpg'); // 需准备测试图片

    // 点击分析按钮
    await page.click('button:has-text("开始分析")');

    // 等待分析完成
    await expect(page.getByText('分析完成')).toBeVisible({ timeout: 15000 });

    // 验证trait显示
    await expect(page.getByText('energetic')).toBeVisible();
    await expect(page.getByText('健康分数')).toBeVisible();

    // 验证3D雷达图加载
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('trait漂移实时更新', async ({ page }) => {
    await page.goto('/pet/123/soul');

    await expect(page.getByText('当前灵魂状态')).toBeVisible();

    // 模拟触发trait更新
    await page.click('button:has-text("模拟事件")');

    await expect(page.getByText('精力值提升')).toBeVisible();
  });
});
