import { calculateTraitDrift, predictFutureTraits } from '@/utils/trait-drift';

describe('PuppySoul Trait漂移计算工具单元测试', () => {
  const baseTraits = {
    energy: 0.75,
    loyalty: 0.85,
    curiosity: 0.65,
    calmness: 0.70,
  };

  it('正常trait漂移计算 - 小幅正向变化', () => {
    const events = [
      { type: 'exercise', impact: 0.12 },
      { type: 'social', impact: 0.08 },
    ];

    const result = calculateTraitDrift(baseTraits, events);

    expect(result.energy).toBeGreaterThan(baseTraits.energy);
    expect(result.loyalty).toBeCloseTo(0.88, 1);
    expect(result).toHaveProperty('driftMagnitude');
  });

  it('多事件叠加 - 显著trait漂移', () => {
    const strongEvents = [
      { type: 'stress', impact: -0.25 },
      { type: 'play', impact: 0.18 },
    ];

    const result = calculateTraitDrift(baseTraits, strongEvents);

    expect(result.calmness).toBeLessThan(0.65);
    expect(result.curiosity).toBeGreaterThan(0.70);
  });

  it('未来trait预测 - 7天趋势', () => {
    const prediction = predictFutureTraits(baseTraits, 7);

    expect(prediction).toHaveProperty('day7');
    expect(prediction.day7.energy).toBeDefined();
    expect(Array.isArray(prediction.trend)).toBe(true);
  });

  it('极端输入 - 边界值处理', () => {
    const zeroTraits = { energy: 0, loyalty: 0 };
    const result = calculateTraitDrift(zeroTraits, [{ type: 'extreme', impact: 0.4 }]);

    expect(result.energy).toBeGreaterThan(0);
    expect(result.energy).toBeLessThanOrEqual(1);
  });
});
