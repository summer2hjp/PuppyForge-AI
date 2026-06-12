// ========================================
// AI 视觉分析引擎 - 多模态健康诊断核心
// ========================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface VisionAnalysis {
  puppy_id: string;
  description: string;
  timestamp: string;
  image_base64?: string;
  image_url?: string;
  breed?: string;
  emotionalState?: string;
  recommendation?: string;
  summary?: string;
  healthScore?: number;
  diagnosis?: { confidence?: number; tags?: string[] };
}

export interface VisionAnalyzerOptions {
  model?: 'grok-vision' | 'gpt-4v' | 'claude-3';
  confidence_threshold?: number;
  include_metadata?: boolean;
}

/**
 * 分析宠物照片 - 调用后端视觉诊断 API
 */
export async function analyzePetPhoto(
  file: File,
  options: VisionAnalyzerOptions = {}
): Promise<VisionAnalysis> {
  const { confidence_threshold = 0.7 } = options;

  const imageBase64 = await fileToBase64(file);

  const { fetchWithAuth } = await import('@/lib/api-client');
  const res = await fetchWithAuth(`${API_BASE}/api/v1/vision/vision/diagnose`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      soul_id: 'default',
      image: imageBase64,
    }),
  });

  if (!res.ok) {
    throw new Error(`诊断请求失败 (${res.status})`);
  }

  const data = await res.json();

  return {
    puppy_id: data.soul_id || `puppy_${Date.now()}`,
    description: data.summary || '',
    timestamp: new Date().toISOString(),
    image_url: URL.createObjectURL(file),
    breed: data.breed,
    emotionalState: data.emotional_state,
    recommendation: data.recommendations?.[0] || '',
    summary: data.summary || '',
    healthScore: data.health_score,
    diagnosis: {
      confidence: confidence_threshold,
      tags: data.issues || [],
    },
  };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

/**
 * 批量分析多张照片（队列处理）
 */
export async function batchAnalyzePhotos(
  files: File[],
  options: VisionAnalyzerOptions = {}
): Promise<VisionAnalysis[]> {
  const results: VisionAnalysis[] = [];
  
  for (const file of files) {
    try {
      const result = await analyzePetPhoto(file, options);
      results.push(result);
    } catch (error) {
      console.error(`分析失败 ${file.name}:`, error);
      // 继续处理其他文件
    }
  }
  
  return results;
}

/**
 * 获取分析历史记录（模拟）
 */
export async function getAnalysisHistory(puppyId: string, limit = 10): Promise<VisionAnalysis[]> {
  // 模拟从数据库获取
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return Array.from({ length: Math.min(limit, 5) }, (_, i) => ({
    puppy_id: puppyId,
    description: `第 ${i + 1} 次健康诊断记录`,
    timestamp: new Date(Date.now() - i * 86400000).toISOString(),
    breed: ['金毛', '柯基', '柴犬', '混合'][i % 4],
    emotionalState: ['happy', 'calm', 'energetic'][i % 3],
    recommendation: '定期健康检查，保持均衡饮食',
    healthScore: 85 + i * 2
  }));
}
