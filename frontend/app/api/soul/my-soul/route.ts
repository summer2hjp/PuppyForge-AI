import { NextRequest } from 'next/server';
import { jsonResponse } from '../../auth/_utils';

const BACKEND_URL = process.env.INTERNAL_BACKEND_URL || 'http://backend:8000';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    return jsonResponse({ message: 'No token' }, 401);
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/soul/my-soul`, {
      method: 'GET',
      headers: { Authorization: authHeader },
    });

    const data = await res.json();

    if (!res.ok) {
      return jsonResponse({ message: data.detail || 'Failed to load soul' }, res.status);
    }

    return jsonResponse(data);
  } catch (error) {
    console.error('[SOUL_PROXY_ERROR]', error);
    return jsonResponse({ message: 'Backend service unavailable' }, 503);
  }
}
