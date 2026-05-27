// ========================================
// AI 视觉分析引擎 - 多模态健康诊断核心
// ========================================

// ✅ 修复：导出正确的类型接口
export interface VisionAnalysis {
  puppy_id: string;
  description: string;
  timestamp: string;
  image_base64?: string;
  image_url?: string;
  // ✅ 新增：AI 分析结果字段（供组件使用）
  breed?: string;
  emotionalState?: string;
  recommendation?: string;
  summary?: string;
  healthScore?: number;
  diagnosis?: any;
}

export interface VisionAnalyzerOptions {
  model?: 'grok-vision' | 'gpt-4v' | 'claude-3';
  confidence_threshold?: number;
  include_metadata?: boolean;
}

/**
 * 分析宠物照片 - 返回结构化健康诊断结果
 */
export async function analyzePetPhoto(
  file: File,
  options: VisionAnalyzerOptions = {}
): Promise<VisionAnalysis> {
  const {
    model = 'grok-vision',
    confidence_threshold = 0.7,
    include_metadata = true
  } = options;

  // 模拟 API 调用（替换为真实后端）
  await new Promise(resolve => setTimeout(resolve, 1500));

  // 生成唯一 ID
  const puppy_id = `puppy_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  
  // 模拟分析结果
  const mockResult: VisionAnalysis = {
    puppy_id,
    description: '通过多模态视觉分析，该宠物表现出健康活泼的状态。',
    timestamp: new Date().toISOString(),
    image_url: URL.createObjectURL(file),
    // ✅ 新增字段，供组件直接使用
    breed: '混合品种',
    emotionalState: 'happy',
    recommendation: '保持当前饮食和运动习惯，建议每周进行一次健康检查。',
    summary: '• 毛发状态: 健康有光泽\n• 眼睛状态: 明亮无分泌物\n• 行为表现: 活泼好动，反应灵敏',
    healthScore: 92,
    diagnosis: {
      confidence: 0.94,
      tags: ['healthy', 'active', 'well-groomed']
    }
  };

  return mockResult;
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
