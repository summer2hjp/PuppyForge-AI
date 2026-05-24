const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const puppyAPI = {
  // 灵魂核心交互
  async interact(soulId: string, action: string, content: string) {
    const res = await fetch(`${API_BASE}/api/interact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ soulId, action, content }),
    });
    return res.json();
  },

  // 获取宠物状态
  async getSoul(soulId: string) {
    const res = await fetch(`${API_BASE}/api/soul/${soulId}`);
    return res.json();
  },

  // 进化请求
  async evolve(soulId: string) {
    const res = await fetch(`${API_BASE}/api/evolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ soulId }),
    });
    return res.json();
  },

  // 视觉诊断（VLM）
  async diagnoseImage(soulId: string, imageBase64: string) {
    const res = await fetch(`${API_BASE}/api/vision/diagnose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ soulId, image: imageBase64 }),
    });
    return res.json();
  },
};
