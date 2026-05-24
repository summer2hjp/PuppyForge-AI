import { z } from 'zod';
import { swarmOrchestrator, InteractionEvent } from '../ai-agents/swarm-orchestrator';

export const VisionAnalysisSchema = z.object({
  puppy_id: z.string(),
  image_base64: z.string().optional(),
  image_url: z.string().optional(),
  description: z.string().min(1),
  timestamp: z.string().default(() => new Date().toISOString()),
});

export type VisionAnalysis = z.infer<typeof VisionAnalysisSchema>;

class VisionAnalyzer {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  async analyze(imageFile: File | null, description: string, puppyId: string): Promise<VisionAnalysis & { diagnosis: any }> {
    let imageData: string | null = null;

    if (imageFile) {
      // 前端压缩 + Base64
      imageData = await this._fileToBase64(imageFile);
    }

    const analysis: VisionAnalysis = {
      puppy_id: puppyId,
      image_base64: imageData || undefined,
      image_url: undefined,
      description,
    };

    // 1. 前端初步验证
    const validated = VisionAnalysisSchema.parse(analysis);

    // 2. 触发 Swarm Orchestrator（进入后端神经闭环）
    const event: InteractionEvent = {
      puppy_id: puppyId,
      action: "vision_diagnosis",
      context: description + (imageData ? " [image attached]" : ""),
    };

    const swarmResult = await swarmOrchestrator.run(puppyId, event);

    return {
      ...validated,
      diagnosis: swarmResult.diagnosis || {},
    };
  }

  private _fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // 实时预览分析（可选轻量版）
  async quickPreview(file: File): Promise<string> {
    // 可集成浏览器 Canvas 简单特征提取（颜色、亮度等）
    return "初步视觉特征：毛色光泽、皮肤可见区域";
  }
}

export const visionAnalyzer = new VisionAnalyzer();
export default visionAnalyzer;
