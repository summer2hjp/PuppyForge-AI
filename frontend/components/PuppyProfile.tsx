// components/PuppyProfile.tsx
// ========================================
// 小狗档案管理组件
// ========================================

'use client';

import { useState } from 'react';
import { Dog, Edit2, Save, X } from 'lucide-react';

interface PuppyProfile {
  id: string;
  name: string;
  breed?: string;
  birthDate?: string;
  gender?: 'male' | 'female';
  weightKg?: number;
  avatar?: string;
}

interface PuppyProfileCardProps {
  profile?: PuppyProfile;
  onSave?: (profile: PuppyProfile) => void;
}

export default function PuppyProfileCard({ 
  profile, 
  onSave 
}: PuppyProfileCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<PuppyProfile>(profile || {
    id: '1',
    name: '',
    breed: '',
    birthDate: '',
    gender: 'male',
    weightKg: undefined,
  });

  const handleSave = () => {
    onSave?.(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(profile || {
      id: '1',
      name: '',
      breed: '',
      birthDate: '',
      gender: 'male',
      weightKg: undefined,
    });
    setIsEditing(false);
  };

  return (
    <div className="bg-zinc-900 border border-pink-500/30 rounded-3xl p-8 hover:border-pink-500 transition-all">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl text-pink-400 flex items-center gap-2">
          <Dog className="w-6 h-6" />
          小狗档案
        </h2>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="编辑档案"
          >
            <Edit2 className="w-5 h-5 text-zinc-400" />
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="p-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
              aria-label="保存"
            >
              <Save className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={handleCancel}
              className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
              aria-label="取消"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">名字</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-pink-500"
              placeholder="输入小狗名字"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">品种</label>
            <input
              type="text"
              value={formData.breed || ''}
              onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-pink-500"
              placeholder="例如：金毛、哈士奇"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">出生日期</label>
              <input
                type="date"
                value={formData.birthDate || ''}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-pink-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">性别</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-pink-500"
              >
                <option value="male">公</option>
                <option value="female">母</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">体重 (kg)</label>
            <input
              type="number"
              step="0.1"
              value={formData.weightKg || ''}
              onChange={(e) => setFormData({ ...formData, weightKg: parseFloat(e.target.value) })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-pink-500"
              placeholder="0.0"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-4xl">
              🐶
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">
                {profile?.name || '未命名'}
              </h3>
              <p className="text-zinc-400">{profile?.breed || '未知品种'}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-zinc-800">
            <div>
              <div className="text-xs text-zinc-500">性别</div>
              <div className="text-white font-semibold">
                {profile?.gender === 'male' ? '公' : profile?.gender === 'female' ? '母' : '未知'}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">体重</div>
              <div className="text-white font-semibold">
                {profile?.weightKg ? `${profile.weightKg} kg` : '未知'}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">年龄</div>
              <div className="text-white font-semibold">
                {profile?.birthDate ? calculateAge(profile.birthDate) : '未知'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function calculateAge(birthDate: string): string {
  const birth = new Date(birthDate);
  const now = new Date();
  const diffMs = now.getTime() - birth.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 30) return `${diffDays} 天`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} 个月`;
  return `${Math.floor(diffDays / 365)} 岁`;
}
