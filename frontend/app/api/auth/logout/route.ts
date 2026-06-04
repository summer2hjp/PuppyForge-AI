import { NextResponse } from 'next/server';
// 如果是无状态 JWT，服务端其实不需要做太多，主要是前端清除存储。
// 如果需要实现黑名单机制，可以在这里将 token 存入 Redis/DB 直到过期。
// 这里仅做标准响应。

export async function POST() {
  // 生产环境建议：
  // 1. 获取 Header 中的 Token
  // 2. 将其加入黑名单 (Redis: SETEX blacklisted:<jti> <expire_time> 1)
  
  return NextResponse.json({ 
    message: '登出成功',
    success: true 
  });
}
