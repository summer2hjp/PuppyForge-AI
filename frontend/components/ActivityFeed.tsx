// components/ActivityFeed.tsx
'use client';

import { Activity, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'diagnosis' | 'prediction' | 'growth' | 'alert';
  title: string;
  description: string;
  timestamp: Date;
}

interface ActivityFeedProps {
  activities?: ActivityItem[];
}

export default function ActivityFeed({ activities = [] }: ActivityFeedProps) {
  const defaultActivities: ActivityItem[] = [
    {
      id: '1',
      type: 'diagnosis',
      title: 'AI 诊断完成',
      description: '健康评分 92/100，状态优秀',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
    },
    {
      id: '2',
      type: 'prediction',
      title: '30 天预测更新',
      description: '风险等级：低，建议保持当前护理方案',
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
    },
    {
      id: '3',
      type: 'growth',
      title: '成长计划生成',
      description: '今日任务：增加 15 分钟户外活动',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
  ];

  const feedItems = activities.length > 0 ? activities : defaultActivities;

  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'diagnosis':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'prediction':
        return <Activity className="w-5 h-5 text-blue-400" />;
      case 'growth':
        return <Clock className="w-5 h-5 text-purple-400" />;
      case 'alert':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8">
      <h2 className="text-xl text-zinc-300 mb-6 flex items-center gap-2">
        <Activity className="w-5 h-5" />
        活动动态
      </h2>
      
      <div className="space-y-4">
        {feedItems.map((item) => (
          <div 
            key={item.id}
            className="flex items-start gap-4 p-4 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 transition-colors"
          >
            <div className="flex-shrink-0 mt-1">
              {getIcon(item.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-white font-semibold truncate">
                  {item.title}
                </h3>
                <span className="text-xs text-zinc-500 flex-shrink-0">
                  {formatTime(item.timestamp)}
                </span>
              </div>
              <p className="text-zinc-400 text-sm">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
