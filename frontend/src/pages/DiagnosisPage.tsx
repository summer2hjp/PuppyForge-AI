import { useState } from 'react';

export default function DiagnosisPage() {
  const [image, setImage] = useState(null);
  const [analysis, setAnalysis] = useState('');

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    // Simulate Grok vision call
    setAnalysis('Analyzing with Grok... High risk of parvovirus detected in feces sample. Urgent vet visit recommended.');
  };

  return (
    <div>
      <h1>🐶 PuppyForge AI Diagnosis</h1>
      <input type="file" accept="image/*" onChange={handleUpload} />
      {image && <img src={image} alt="upload" />}
      <div>{analysis}</div>
    </div>
  );
}
