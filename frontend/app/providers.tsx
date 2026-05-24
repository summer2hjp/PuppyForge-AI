'use client';

import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      {/* 后续可加入 Zustand Provider、QueryClient 等 */}
    </>
  );
}
