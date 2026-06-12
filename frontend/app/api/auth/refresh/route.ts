import type { NextRequest } from 'next/server';
import { refreshAccessToken } from '@/lib/auth';
import { jsonResponse, parseBody } from '../_utils';

export async function POST(request: NextRequest) {
  const body = await parseBody(request);

  if (!body?.refreshToken) {
    return jsonResponse({ message: 'Refresh token is required' }, 400);
  }

  try {
    const data = await refreshAccessToken(body.refreshToken);
    if (!data) {
      return jsonResponse({ message: 'Refresh failed' }, 401);
    }

    return jsonResponse({
      token: data.token,
      refreshToken: data.refreshToken,
      user: data.user,
    });
  } catch (error) {
    return jsonResponse({ message: 'Backend service unavailable' }, 503);
  }
}
