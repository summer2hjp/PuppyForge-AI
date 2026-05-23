// components/NotificationToast.tsx
// ========================================
// 通知提示组件
// ========================================

'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertTriangle, Info, Bell } from 'lucide-react';

export type NotificationType = 'success' | 'warning' | 'error' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
}

interface NotificationToastProps {
  notifications?: Notification[];
  onDismiss?: (id: string) => void;
  autoDismiss?: boolean;
  duration?: number;
}

export default function NotificationToast({
  notifications = [],
  onDismiss,
  autoDismiss = true,
  duration = 5000,
}: NotificationToastProps) {
  const [localNotifications, setLocalNotifications] = useState<Notification[]>(notifications);

  useEffect(() => {
    setLocalNotifications(notifications);
  }, [notifications]);

  useEffect(() => {
    if (autoDismiss && localNotifications.length > 0) {
      const timer = setTimeout(() => {
        dismiss(localNotifications[0].id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [localNotifications, autoDismiss, duration]);

  const dismiss = (id: string) => {
    setLocalNotifications((prev) => prev.filter((n) => n.id !== id));
    onDismiss?.(id);
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getBorderColor = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/50';
      case 'warning':
        return 'border-yellow-500/50';
      case 'error':
        return 'border-red-500/50';
      case 'info':
        return 'border-blue-500/50';
    }
  };

  const getBgColor = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-900/30';
      case 'warning':
        return 'bg-yellow-900/30';
      case 'error':
        return 'bg-red-900/30';
      case 'info':
        return 'bg-blue-900/30';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md">
      {localNotifications.map((notification) => (
        <div
          key={notification.id}
          className={`${getBgColor(notification.type)} ${getBorderColor(notification.type)} 
            border rounded-xl p-4 shadow-lg backdrop-blur-sm animate-slide-in-right`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(notification.type)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-semibold text-sm mb-1">
                {notification.title}
              </h4>
              <p className="text-zinc-300 text-xs">{notification.message}</p>
            </div>
            <button
              onClick={() => dismiss(notification.id)}
              className="flex-shrink-0 p-1 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="关闭通知"
            >
              <X className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// 工具函数：创建通知
export function createNotification(
  type: NotificationType,
  title: string,
  message: string
): Notification {
  return {
    id: Date.now().toString(),
    type,
    title,
    message,
  };
}

// Hook: 使用通知
export function useNotification() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const add = (type: NotificationType, title: string, message: string) => {
    const notification = createNotification(type, title, message);
    setNotifications((prev) => [...prev, notification]);
    return notification.id;
  };

  const dismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const success = (title: string, message: string) => add('success', title, message);
  const warning = (title: string, message: string) => add('warning', title, message);
  const error = (title: string, message: string) => add('error', title, message);
  const info = (title: string, message: string) => add('info', title, message);

  return {
    notifications,
    add,
    dismiss,
    success,
    warning,
    error,
    info,
  };
}
