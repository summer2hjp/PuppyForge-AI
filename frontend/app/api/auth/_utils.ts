import { NextResponse } from 'next/server';

export interface ApiError {
  message: string;
}

export function jsonResponse(data: any, status = 200) {
  return NextResponse.json(data, { 
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function parseBody(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object') return null;
    return body as Record<string, any>;
  } catch {
    return null;
  }
}

export function getBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.split(' ')[1];
}
