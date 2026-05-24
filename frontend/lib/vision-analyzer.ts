import { z } from 'zod';
import { swarmOrchestrator, InteractionEvent } from '../ai-agents/swarm-orchestrator';

export const VisionAnalysisSchema = z.object({
  puppy_id: z.string().min(1),
  image_base64: z.string().optional(),
  image_url: z.string().url().optional(),
  description: z.string().min(5, "描述至少 5 个字符"),
  timestamp: z.string().default(() => new Date().toISOString()),
});

export type VisionAnalysis = z.infer<typeof VisionAnalysisSchema>;

class VisionAnalyzer {
  async analyze(
    imageFile: File | null, 
    description: string, 
    puppyId: string
  ): Promise<VisionAnalysis & { diagnosis: any; healthScore: number }> {
    
    let imageData: string | undefined = undefined;

    if (imageFile) {
      imageData = await this._fileToBase64WithCompress(imageFile);
    }

    const analysisInput: VisionAnalysis = {
      puppy_id: puppyId,
      image_base64: imageData,
      image_url: undefined,
      description: description.trim(),
    };

    // 严格验证
    const validated = VisionAnalysisSchema.parse(analysisInput);

    // 构造事件并触发完整神经闭环
    const event: InteractionEvent = {
      puppy_id: puppyId,
      action: "vision_diagnosis",
      context: description + (imageData ? " [包含图像]" : ""),
    };

    const swarmResult = await swarmOrchestrator.run(puppyId, event);

    return {
      ...validated,
      diagnosis: swarmResult.diagnosis,
      healthScore: swarmResult.health_score,
    };
  }

  private async _fileToBase64WithCompress(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // 轻量前端预分析（不调用后端）
  async quickPreview(file: File): Promise<string> {
    return "视觉特征提取中...（毛色、皮肤状况、姿势）";
  }
}

export const visionAnalyzer = new VisionAnalyzer();
export default visionAnalyzer;

/**
 * 便捷函数：分析宠物照片
 * @param imageFile - 图片文件
 * @param description - 描述文本（可选）
 * @param puppyId - 宠物 ID（可选，默认 'unknown'）
 */
export async function analyzePetPhoto(
  imageFile: File | null,
  description: string = '视觉健康检查',
  puppyId: string = 'unknown'
): Promise<VisionAnalysis & { diagnosis: any; healthScore: number }> {
  return visionAnalyzer.analyze(imageFile, description, puppyId);
}
