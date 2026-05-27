'use client';

import { useState } from 'react';
import { analyzePetImage, type PetImageAnalysis } from '@/lib/vision';

interface VisionAnalyzerProps {
  onAnalysisComplete: (result: PetImageAnalysis) => void;
}

export function VisionAnalyzer({ onAnalysisComplete }: VisionAnalyzerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<PetImageAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const runAnalyze = async (selected: File) => {
    setLoading(true);
    setError(null);
    try {
      const analysis = await analyzePetImage(selected);
      setResult(analysis);
      onAnalysisComplete(analysis);
    } catch {
      setError('分析失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const onFileChange = (selected?: File) => {
    if (!selected) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(selected.type)) {
      setError('仅支持JPG、PNG、WEBP格式');
      setFile(null);
      return;
    }
    setError(null);
    setFile(selected);
    void runAnalyze(selected);
  };

  const onAnalyze = async () => {
    if (!file) return;
    await runAnalyze(file);
  };

  return (
    <div>
      <input
        data-testid="image-upload"
        type="file"
        onChange={(e) => onFileChange(e.target.files?.[0])}
      />
      <button onClick={onAnalyze} disabled={!file || loading}>
        开始分析
      </button>

      {error && <p>{error}</p>}
      {result && (
        <div>
          <p>{result.healthScore}</p>
          {result.traits.map((trait) => (
            <p key={trait}>{trait}</p>
          ))}
        </div>
      )}
    </div>
  );
}

export default VisionAnalyzer;
