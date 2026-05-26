import { test, expect } from '@playwright/test';

test.describe('PetMemory 记忆系统 E2E测试', () => {
  test('添加记忆 → 查看记忆列表 → trait影响验证', async ({ page }) => {
    await page.goto('/pet/123/memory');

    await page.fill('textarea', '今天和小主人一起玩飞盘，非常开心！');
    await page.click('button:has-text("保存记忆")');

    await expect(page.getByText('记忆保存成功')).toBeVisible();

    // 检查记忆列表
    await expect(page.getByText('今天和小主人一起玩飞盘')).toBeVisible();

    // 验证trait受影响
    await expect(page.getByText('curiosity')).toBeVisible();
  });
});
