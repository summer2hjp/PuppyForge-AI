// 边缘 Pages Function (只做鉴权和路由)
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const token = context.request.headers.get('authorization')?.split(' ')[1];
  if (!token) return new Response('Unauthorized', { status: 401 });

  try {
    // 🛡️ 安全修复：显式指定算法，防止 JWT 算法混淆攻击 (Algorithm Confusion)
    const payload = verify(token, context.env.JWT_SECRET, { algorithms: ['HS256'] }) as any;
    const puppyId = payload.puppy_id;
    
    // 路由到该宠物的专属 Durable Object
    const id = context.env.PUPPY_BRAIN.idFromName(puppyId);
    const stub = context.env.PUPPY_BRAIN.get(id);
    
    // 🚀 将用户身份和配额信息通过 Header 传递给 DO，让 DO 去做原子扣减
    const newHeaders = new Headers(context.request.headers);
    newHeaders.set('X-User-Id', payload.sub);
    newHeaders.set('X-Compute-Quota', String(payload.compute_quota));
    newHeaders.set('X-Inference-Cost', '50'); // 本次请求预估消耗的算力

    const doRequest = new Request(context.request.url, {
      method: context.request.method,
      headers: newHeaders,
      body: context.request.body, // 透传 body (如图片/音频流)
    });

    return stub.fetch(doRequest);
  } catch (e) {
    return new Response('Forbidden', { status: 403 });
  }
};
