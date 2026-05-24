// lib/vision-analyzer.ts
// ========================================
// 宠物照片视觉分析模块 - 灵魂扫描引擎
// ========================================

import { VisionAnalysisResult } from '../ai-agents/types';

export interface ImageUploadOptions {
  maxSizeMB?: number;
  allowedTypes?: string[];
}

/**
 * 分析宠物照片
 * @param imageFile 上传的图片文件
 * @param options 配置选项
 */
export async function analyzePetPhoto(
  imageFile: File,
  options: ImageUploadOptions = {}
): Promise<VisionAnalysisResult> {
  console.log('🔍 宠物照片灵魂扫描启动...');
  
  const { 
    maxSizeMB = 10,
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  } = options;

  // 验证文件类型
  if (!allowedTypes.includes(imageFile.type)) {
    throw new Error(`不支持的文件类型：${imageFile.type}`);
  }

  // 验证文件大小
  const sizeMB = imageFile.size / (1024 * 1024);
  if (sizeMB > maxSizeMB) {
    throw new Error(`文件过大，最大支持 ${maxSizeMB}MB`);
  }

  // TODO: 集成真实的多模态 AI (GPT-4o / Grok Vision)
  // const formData = new FormData();
  // formData.append('image', imageFile);
  // const response = await callVisionAPI(formData);

  // Mock 返回结果
  return {
    breed: '未知混血',
    emotionalState: '略带叛逆',
    recommendation: '需要更多自由空间',
    summary: '从照片来看，这只小狗眼神中透露着独立和一丝倔强，建议给予更多探索空间'
  };
}

/**
 * 将图片转换为 Base64
 */
export function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 压缩图片
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1920,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // 计算缩放比例
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('无法获取 canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('压缩失败'));
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
