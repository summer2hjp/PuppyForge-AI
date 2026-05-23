// app/page.tsx
'use client';

import { useState } from 'react';
import { 
  HealthScoreCard, 
  RiskRadar, 
  QuickDiagnose, 
  ActivityFeed,
  ThemeToggle,
  PuppyProfileCard,
  HealthTrendChart,
  NotificationToast,
  useNotification
} from '../components';
import { VisionAnalysisResult } from '../ai-agents/types';

export default function PuppyForge() {
  const [healthScore, setHealthScore] = useState(92);
  const [riskLevel, setRiskLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('LOW');
  const [predictions, setPredictions] = useState<string[]>([
    '未来 7 天健康状况稳定',
    '30 天内无重大健康风险',
    '建议持续当前护理方案',
  ]);
  
  const notifications = useNotification();

  const handleDiagnosisComplete = (result: VisionAnalysisResult) => {
    console.log('诊断完成:', result);
    // 根据诊断结果更新状态
    if (result.emotionalState.includes('焦虑')) {
      setHealthScore(prev => Math.max(prev - 5, 0));
      notifications.warning('情绪波动', `检测到${result.emotionalState}，建议关注`);
    } else {
      notifications.success('诊断完成', result.recommendation);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white">
      {/* 通知系统 */}
      <NotificationToast {...notifications} />
      
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
              PUPPYFORGE AI
            </h1>
            <p className="text-zinc-400 mt-1">多智能体宠物健康诊断系统</p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* 小狗档案 */}
        <div className="mb-12">
          <PuppyProfileCard 
            profile={{
              id: '1',
              name: '旺财',
              breed: '金毛寻回犬',
              birthDate: '2023-06-15',
              gender: 'male',
              weightKg: 28.5,
            }}
            onSave={(profile) => {
              console.log('保存档案:', profile);
              notifications.success('档案已保存', `${profile.name}的信息已更新`);
            }}
          />
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <HealthScoreCard score={healthScore} trend="up" />
          <RiskRadar 
            riskLevel={riskLevel} 
            predictions={predictions}
            interventionWindow="72 小时"
          />
          <QuickDiagnose onDiagnosisComplete={handleDiagnosisComplete} />
        </div>
        
        {/* 健康趋势图 */}
        <div className="mb-12">
          <HealthTrendChart days={14} />
        </div>

        {/* Activity Feed */}
        <div className="mb-12">
          <ActivityFeed />
        </div>

        {/* Status Bar */}
        <div className="text-center py-8 border-t border-zinc-800">
          <p className="text-zinc-500 text-sm tracking-widest">
            MULTI-AGENT SYSTEM ONLINE • PWA READY • OFFLINE MODE ENABLED
          </p>
        </div>
      </div>
    </main>
  );
}