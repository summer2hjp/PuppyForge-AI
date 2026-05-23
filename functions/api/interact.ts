import { verify } from 'jsonwebtoken';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const token = context.request.headers.get('authorization')?.split(' ')[1];
  if (!token) return new Response('Unauthorized', { status: 401 });

  try {
    const payload = verify(token, context.env.JWT_SECRET) as any;
    const puppyId = payload.puppy_id;
    
    // 边缘算力限流 (KV 原子操作)
    const quotaKey = `quota:${payload.sub}:${new Date().toISOString().split('T')[0]}`;
    const used = parseInt(await context.env.COMPUTE_QUOTA.get(quotaKey) || "0");
    if (used + 50 > payload.compute_quota) return new Response('Quota Exceeded', { status: 429 });
    await context.env.COMPUTE_QUOTA.put(quotaKey, String(used + 50), { expirationTtl: 86400 });

    // 路由到该宠物的专属 Durable Object
    const id = context.env.PUPPY_BRAIN.idFromName(puppyId);
    const stub = context.env.PUPPY_BRAIN.get(id);
    
    // 将请求透传给宠物的“灵魂”
    return stub.fetch(context.request);
  } catch {
    return new Response('Forbidden', { status: 403 });
  }
};
