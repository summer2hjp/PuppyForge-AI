// Server Component — 强制 /auth/callback 动态渲染，禁止 Next.js 缓存
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AuthCallbackLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
