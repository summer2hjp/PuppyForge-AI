export interface ApiError {
  message: string;
}

export function jsonResponse(data: any, status = 200) {
  const ResponseCtor = globalThis.Response;
  if (typeof ResponseCtor === 'function') {
    return new ResponseCtor(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return {
    status,
    async json() {
      return data;
    },
  };
}

export async function parseBody(request: any) {
  if (!request) return null;

  try {
    if (typeof request.json === 'function') {
      const body = await request.json();
      if (body && typeof body === 'object') return body as Record<string, any>;
    }
  } catch {
    // fall through to mocked request bodies
  }

  const body = request.body;
  if (!body) return null;
  if (typeof body === 'object') return body as Record<string, any>;
  if (typeof body === 'string') {
    try {
      const parsed = JSON.parse(body);
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, any>) : null;
    } catch {
      return null;
    }
  }

  return null;
}

export function getBearerToken(request: any): string | null {
  const authHeader = request?.headers?.get?.('authorization') ?? request?.headers?.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.split(' ')[1];
}
