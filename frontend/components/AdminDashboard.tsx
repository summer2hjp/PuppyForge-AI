// ========================================
// 管理员仪表盘 - 系统监控
// ========================================

'use client';

import { useState, useEffect } from 'react';
import { Users, Settings, Shield } from 'lucide-react';

// ✅ 修复：添加 'superadmin' 到角色联合类型
type UserRole = 'user' | 'moderator' | 'admin' | 'superadmin';

interface User {
  id: string;
  email: string;
  role: UserRole;  // ✅ 修复：使用扩展后的类型
  created_at: string;
  last_active: string;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<{ role: UserRole } | null>(null);

  useEffect(() => {
    // 模拟获取当前用户
    const mockUser = { role: 'superadmin' as UserRole };
    setCurrentUser(mockUser);
    
    // 模拟获取用户列表
    setUsers([
      { id: '1', email: 'user@example.com', role: 'user', created_at: '2024-01-01', last_active: '2024-01-15' },
      { id: '2', email: 'mod@example.com', role: 'moderator', created_at: '2024-01-02', last_active: '2024-01-14' },
    ]);
  }, []);

  // ✅ 修复：'superadmin' 现在在 UserRole 类型中
  if (currentUser?.role === 'admin' || currentUser?.role === 'superadmin') {
    return (
      <div className="p-8 bg-zinc-950 border border-emerald-500/30 rounded-3xl">
        <h2 className="text-3xl font-bold text-emerald-400 mb-6">
          🔐 管理员控制台
        </h2>
        
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="p-6 bg-zinc-900 rounded-2xl border border-zinc-700">
            <Users className="w-8 h-8 text-cyan-400 mb-4" />
            <div className="text-2xl font-bold text-white">1,234</div>
            <div className="text-zinc-400 text-sm">总用户</div>
          </div>
          <div className="p-6 bg-zinc-900 rounded-2xl border border-zinc-700">
            <Shield className="w-8 h-8 text-purple-400 mb-4" />
            <div className="text-2xl font-bold text-white">89</div>
            <div className="text-zinc-400 text-sm">待审核</div>
          </div>
          <div className="p-6 bg-zinc-900 rounded-2xl border border-zinc-700">
            <Settings className="w-8 h-8 text-yellow-400 mb-4" />
            <div className="text-2xl font-bold text-white">12</div>
            <div className="text-zinc-400 text-sm">系统警报</div>
          </div>
        </div>

        {/* 用户管理表格 */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-700">
                <th className="p-4 text-zinc-400 font-medium">邮箱</th>
                <th className="p-4 text-zinc-400 font-medium">角色</th>
                <th className="p-4 text-zinc-400 font-medium">最后活跃</th>
                <th className="p-4 text-zinc-400 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-zinc-800 hover:bg-zinc-900/50">
                  <td className="p-4 text-white">{user.email}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      user.role === 'superadmin' ? 'bg-red-500/20 text-red-300' :
                      user.role === 'admin' ? 'bg-purple-500/20 text-purple-300' :
                      user.role === 'moderator' ? 'bg-cyan-500/20 text-cyan-300' :
                      'bg-zinc-700 text-zinc-300'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 text-zinc-400 text-sm">
                    {new Date(user.last_active).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="p-4">
                    <button className="text-cyan-400 hover:text-cyan-300 text-sm">
                      编辑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ✅ 修复：'superadmin' 现在在类型检查中有效
  if (currentUser?.role !== 'admin' && currentUser?.role !== 'superadmin') {
    return (
      <div className="p-8 text-center text-zinc-400">
        🔒 权限不足，需要管理员角色访问
      </div>
    );
  }

  return null;
}
