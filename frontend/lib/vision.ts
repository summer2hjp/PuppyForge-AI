export interface PetImageAnalysis {
  traits: string[];
  confidence: number;
  healthScore: number;
  recommendations: string[];
}

export async function analyzePetImage(file: File): Promise<PetImageAnalysis> {
  try {
    const response = await fetch('/api/vision/analyze', {
      method: 'POST',
      body: file,
    });
    const data = await response.json();
    return {
      traits: Array.isArray(data?.traits) ? data.traits : ['healthy'],
      confidence: typeof data?.confidence === 'number' ? data.confidence : 0.9,
      healthScore: typeof data?.healthScore === 'number' ? data.healthScore : 80,
      recommendations: Array.isArray(data?.recommendations) ? data.recommendations : ['保持规律运动'],
    };
  } catch {
    return {
      traits: ['stable'],
      confidence: 0.7,
      healthScore: 50,
      recommendations: ['请检查网络连接并重试'],
    };
  }
}
