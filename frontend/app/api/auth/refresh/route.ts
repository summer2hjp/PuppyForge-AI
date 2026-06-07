import { NextRequest } from 'next/server';
import { jsonResponse, parseBody } from '../_utils';

const BACKEND_URL = process.env.INTERNAL_BACKEND_URL || 'http://backend:8000';

export async function POST(request: NextRequest) {
  const body = await parseBody(request);

  if (!body?.refreshToken) {
    return jsonResponse({ message: 'Refresh token is required' }, 400);
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: body.refreshToken }),
    });

    const data = await res.json();

    if (!res.ok) {
      return jsonResponse({ message: data.detail || 'Refresh failed' }, res.status);
    }

    return jsonResponse({
      token: data.token,
      refreshToken: data.refreshToken,
      user: data.user
    });
  } catch (error) {
    return jsonResponse({ message: 'Backend service unavailable' }, 503);
  }
}
