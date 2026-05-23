import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export const config = { runtime: 'edge' }; // 在全球边缘节点运行

export default async function handler(req: NextRequest) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  if (!token) return new Response('Unauthorized', { status: 401 });

  try {
    // 边缘极速鉴权
    jwt.verify(token, process.env.JWT_SECRET!); 
    
    // 流式代理到后端的 Docker 集群
    const backendUrl = process.env.BACKEND_WS_URL || 'http://forge-api:8000/api/v1/interact';
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: await req.text(),
    });

    // 将后端的流式响应直接 pipe 给前端 (零延迟透传)
    return new Response(response.body, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
  } catch {
    return new Response('Token Invalid', { status: 403 });
  }
}
