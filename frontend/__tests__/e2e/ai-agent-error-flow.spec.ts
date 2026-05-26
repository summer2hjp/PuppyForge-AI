import { test, expect } from '@playwright/test';

test.describe('AI-Agent 错误处理 E2E系统测试（优化版）', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'e2e-test@puppyforge.ai');
    await page.fill('input[name="password"]', 'SecureE2E123!');
    await page.click('button[type="submit"]');
  });

  test('VisionAgent超时 - 显示重试按钮与友好提示', async ({ page }) => {
    await page.goto('/diagnosis');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('public/test-assets/puppy-test.jpg');

    await page.click('button:has-text("启动AI诊断")');

    // 模拟超时
    await expect(page.getByText('AI服务响应超时')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: '重试' })).toBeVisible();

    await page.click('button:has-text("重试")');
    await expect(page.getByText('正在重试...')).toBeVisible();
  });

  test('部分Agent失败 - 仍显示可用结果', async ({ page }) => {
    await page.goto('/diagnosis');

    await page.setInputFiles('input[type="file"]', 'public/test-assets/puppy-test.jpg');
    await page.click('button:has-text("启动AI诊断")');

    await expect(page.getByText('部分诊断完成')).toBeVisible();
    await expect(page.getByText('灵魂特质')).toBeVisible();
    await expect(page.getByText('警告：图像分析服务暂不可用')).toBeVisible();
  });

  test('全Agent崩溃 - 安全降级页面', async ({ page }) => {
    await page.goto('/diagnosis');
    // 模拟严重错误
    await page.route('**/api/diagnosis/**', route => route.fulfill({ status: 500 }));

    await page.setInputFiles('input[type="file"]', 'public/test-assets/puppy-test.jpg');
    await page.click('button:has-text("启动AI诊断")');

    await expect(page.getByText('AI诊断服务暂时不可用')).toBeVisible();
    await expect(page.getByText('建议稍后重试或联系支持')).toBeVisible();
  });
});
