import { test, expect } from '@playwright/test';

test.describe('AI-Agent 端到端系统测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'e2e-test@puppyforge.ai');
    await page.fill('input[name="password"]', 'SecureE2E123!');
    await page.click('button[type="submit"]');
  });

  test('完整AI-Agent诊断流程', async ({ page }) => {
    await page.goto('/diagnosis');

    // 上传图片触发VisionAgent
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('public/test-assets/puppy-test.jpg');

    await page.click('button:has-text("启动AI诊断")');

    // 等待Agent编排完成
    await expect(page.getByText('AI-Agent诊断完成')).toBeVisible({ timeout: 20000 });

    // 验证多Agent输出
    await expect(page.getByText('灵魂特质')).toBeVisible();
    await expect(page.getByText('健康建议')).toBeVisible();
    await expect(page.locator('canvas')).toBeVisible(); // RadarMesh

    // 检查trait漂移
    await expect(page.getByText(/未来7天/)).toBeVisible();
  });
});
