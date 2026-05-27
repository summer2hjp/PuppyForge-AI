type Traits = Record<string, number>;
type DriftEvent = { type: string; impact: number };

export function calculateTraitDrift(baseTraits: Traits, events: DriftEvent[]) {
  const result: Record<string, number> = { ...baseTraits };
  let totalImpact = 0;

  for (const event of events) {
    totalImpact += Math.abs(event.impact);
    if (event.type === 'exercise') {
      result.energy = clamp((result.energy ?? 0.5) + event.impact * 0.2);
      result.loyalty = clamp((result.loyalty ?? 0.8) + event.impact * 0.375);
    } else if (event.type === 'social') {
      result.loyalty = clamp((result.loyalty ?? 0.7) + event.impact * 0.1);
      result.calmness = clamp((result.calmness ?? 0.7) + event.impact * 0.05);
    } else if (event.type === 'stress') {
      result.calmness = clamp((result.calmness ?? 0.7) + event.impact * 0.3);
      result.energy = clamp((result.energy ?? 0.6) + event.impact * 0.1);
    } else if (event.type === 'play') {
      result.curiosity = clamp((result.curiosity ?? 0.6) + event.impact * 0.4);
      result.energy = clamp((result.energy ?? 0.6) + event.impact * 0.05);
    } else {
      result.energy = clamp((result.energy ?? 0.5) + event.impact * 0.2);
    }
  }

  return {
    ...result,
    driftMagnitude: Number((totalImpact / Math.max(events.length, 1)).toFixed(3)),
  };
}

export function predictFutureTraits(baseTraits: Traits, days: number) {
  const day7 = {
    ...baseTraits,
    energy: clamp((baseTraits.energy ?? 0.6) + Math.min(days, 7) * 0.01),
  };

  const trend = Array.from({ length: Math.max(1, days) }, (_, index) => ({
    day: index + 1,
    energy: clamp((baseTraits.energy ?? 0.6) + (index + 1) * 0.01),
  }));

  return { day7, trend };
}

function clamp(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return Number(value.toFixed(3));
}
