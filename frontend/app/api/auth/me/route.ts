import { NextRequest } from 'next/server';
import { jsonResponse } from '../_utils';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://192.168.3.160:8000';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    return jsonResponse({ authenticated: false, message: 'No token' }, 401);
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/auth/me`, {
      method: 'GET',
      headers: { 'Authorization': authHeader },
    });

    if (!res.ok) {
      return jsonResponse({ authenticated: false, message: 'Invalid token' }, 401);
    }

    const data = await res.json();
    return jsonResponse(data);
  } catch (error) {
    return jsonResponse({ authenticated: false, message: 'Backend error' }, 503);
  }
}
