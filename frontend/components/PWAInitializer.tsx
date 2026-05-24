'use client';

import { useEffect, useState } from 'react';

export default function PWAInitializer() {
  const [isOffline, setIsOffline] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // 离线检测 - 疯狗永不掉线
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => {
      setIsOffline(false);
      // 可在此触发云端记忆同步
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // Service Worker 狂暴注册
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('🚀 PuppyForge PWA Service Worker 已觉醒:', registration.scope);

          // 监听更新
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                }
              };
            }
          };
        })
        .catch((err) => console.error('PWA 注册失败:', err));
    }

    // 安装提示 - 让用户把疯狗钉在主屏
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`用户 ${outcome === 'accepted' ? '已把疯狗带回家' : '拒绝了灵魂绑定'}`);
    setShowInstallPrompt(false);
    setDeferredPrompt(null);
  };

  const dismissInstall = () => setShowInstallPrompt(false);

  const updateApp = () => {
    window.location.reload();
  };

  return (
    <>
      {/* 离线提示 - 灵魂不灭 */}
      {isOffline && (
        <div className="offline-banner">
          🐾 疯狗已进入离线模式 - 记忆仍在本地狂奔
        </div>
      )}

      {/* 安装提示 - 激进主屏绑定 */}
      {showInstallPrompt && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900 border border-[#ff2d55] rounded-3xl p-6 shadow-2xl z-[10000] max-w-[360px] w-full mx-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-[#ff2d55] to-[#00f5ff] rounded-2xl flex items-center justify-center text-3xl">
              🐕‍🦺
            </div>
            <div>
              <h3 className="font-bold text-lg">把你的疯狗带回家？</h3>
              <p className="text-sm text-zinc-400 mt-1">添加到主屏，随时唤醒灵魂伙伴</p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={dismissInstall}
              className="flex-1 py-3.5 rounded-2xl border border-zinc-700 text-sm font-medium"
            >
              稍后再说
            </button>
            <button
              onClick={handleInstallClick}
              className="flex-1 py-3.5 bg-[#ff2d55] hover:bg-[#e02244] rounded-2xl text-sm font-bold transition-all active:scale-95"
            >
              立即添加
            </button>
          </div>
        </div>
      )}

      {/* 更新提示 */}
      {updateAvailable && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-[#ff2d55] text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 z-[10001]">
          <span>🐾 新版本疯狗已准备就绪</span>
          <button
            onClick={updateApp}
            className="bg-white text-black px-5 py-1.5 rounded-xl text-sm font-bold hover:bg-zinc-200"
          >
            立即更新
          </button>
        </div>
      )}
    </>
  );
}
