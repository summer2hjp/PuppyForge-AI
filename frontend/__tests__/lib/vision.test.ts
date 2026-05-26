import { analyzePetImage } from '@/lib/vision';

global.fetch = jest.fn();

describe('Vision分析工具单元测试', () => {
  it('成功调用多模态分析API', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ traits: ['playful'], confidence: 0.88 })
    });

    const result = await analyzePetImage(new File([], 'puppy.jpg'));
    expect(result.traits).toContain('playful');
  });

  it('API失败时返回默认值', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error());
    const result = await analyzePetImage(new File([], 'puppy.jpg'));
    expect(result).toHaveProperty('traits');
  });
});
