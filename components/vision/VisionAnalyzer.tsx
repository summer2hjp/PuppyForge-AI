// components/vision/VisionAnalyzer.tsx
import { useState } from 'react';

export default function VisionAnalyzer() {
  const [analysis, setAnalysis] = useState(null);

  const handlePhotoUpload = async (e: any) => {
    const file = e.target.files[0];
    // Call vision API + trigger swarm
    const result = await analyzePetPhoto(file);
    setAnalysis(result);
  };

  return (
    <div className="vision-module">
      <input type="file" accept="image/*" onChange={handlePhotoUpload} />
      {analysis && <div>灵魂视觉诊断: {analysis.summary}</div>}
    </div>
  );
}