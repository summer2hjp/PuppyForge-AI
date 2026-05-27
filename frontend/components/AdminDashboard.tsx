// ========================================
// 管理员仪表盘 - 系统监控与用户管理
// ========================================

'use client';

import { useState, useEffect } from 'react';
import { Users, Shield, Settings, Activity } from 'lucide-react';

// ✅ 修复 TS2367：扩展角色联合类型，必须包含 'admin' 和 'superadmin'
type UserRole = 'user' | 'moderator' | 'admin' | 'superadmin';

interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  last_active: string;
  status: 'online' | 'offline' | 'active';
}

// Mock 数据（实际应从 API 获取）
const MOCK_CURRENT_USER = {
  id: 'curr_1',
  email: 'admin@puppyforge.ai',
  role: 'superadmin' as UserRole,
};

const MOCK_USERS: User[] = [
  { id: '1', email: 'user1@example.com', role: 'user', created_at: '2024-01-01', last_active: '2024-01-15', status: 'online' },
  { id: '2', email: 'mod1@example.com', role: 'moderator', created_at: '2024-01-02', last_active: '2024-01-14', status: 'active' },
  { id: '3', email: 'admin1@example.com', role: 'admin', created_at: '2023-12-10', last_active: '2024-01-15', status: 'online' },
  { id: '4', email: 'user2@example.com', role: 'user', created_at: '2024-01-05', last_active: '2024-01-10', status: 'offline' },
];

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; role: UserRole } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模拟异步获取数据
    const timer = setTimeout(() => {
      setCurrentUser(MOCK_CURRENT_USER);
      setUsers(MOCK_USERS);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // ✅ 修复 TS2367：currentUser.role 类型现在包含 'admin'/'superadmin'，比较安全
  const isAuthorized = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

  if (loading) {
    return (
      <div className="p-8 bg-zinc-950 border border-emerald-500/30 rounded-3xl flex items-center justify-center min-h-[400px]">
        <div className="text-emerald-400 animate-pulse font-medium">🔐 正在验证管理员权限...</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="p-8 text-center bg-zinc-900/50 border border-zinc-700 rounded-2xl min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <Shield className="w-16 h-16 text-zinc-500" />
        <h3 className="text-xl font-bold text-zinc-300">权限不足</h3>
        <p className="text-zinc-500 text-sm">仅管理员 (Admin) 或超级管理员 (Superadmin) 可访问此面板。</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-zinc-950 border border-emerald-500/30 rounded-3xl space-y-8">
      {/* 头部 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold text-emerald-400 flex items-center gap-3">
          <Settings className="w-8 h-8" />
          管理员控制台
        </h2>
        <div className="px-4 py-2 bg-zinc-900 rounded-full border border-zinc-700 text-sm text-zinc-400">
          当前身份: <span className="text-emerald-300 font-medium">{currentUser?.email}</span>
        </div>
      </div>

      {/* 数据看板 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<Users />} title="总用户数" value="1,234" color="cyan" />
        <StatCard icon={<Shield />} title="待审核" value="89" color="purple" />
        <StatCard icon={<Activity />} title="在线会话" value="42" color="emerald" />
        <StatCard icon={<Settings />} title="系统警报" value="3" color="yellow" />
      </div>

      {/* 用户管理表格 */}
      <div className="overflow-x-auto bg-zinc-900/30 border border-zinc-700 rounded-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-700 bg-zinc-800/50">
              <th className="p-4 text-zinc-400 font-medium">邮箱</th>
              <th className="p-4 text-zinc-400 font-medium">角色</th>
              <th className="p-4 text-zinc-400 font-medium">状态</th>
              <th className="p-4 text-zinc-400 font-medium">最后活跃</th>
              <th className="p-4 text-zinc-400 font-medium text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-zinc-800 hover:bg-zinc-800/30 transition">
                <td className="p-4 text-white font-medium">{user.email}</td>
                <td className="p-4"><RoleBadge role={user.role} /></td>
                <td className="p-4"><StatusBadge status={user.status} /></td>
                <td className="p-4 text-zinc-400 text-sm">{user.last_active}</td>
                <td className="p-4 text-right">
                  <button className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg text-sm transition">
                    管理
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

// ========================================
// 辅助子组件
// ========================================

function StatCard({ icon, title, value, color }: { icon: React.ReactNode; title: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    yellow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  };

  return (
    <div className={`p-6 rounded-2xl border ${colorMap[color] || colorMap.cyan}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-zinc-900 rounded-xl">{icon}</div>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-zinc-400 text-sm mt-1">{title}</div>
    </div>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const styles: Record<UserRole, string> = {
    user: 'bg-zinc-700/50 text-zinc-300',
    moderator: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
    admin: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
    superadmin: 'bg-red-500/20 text-red-300 border border-red-500/30',
  };
  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${styles[role]}`}>
      {role}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const dotColor = status === 'online' ? 'bg-emerald-500' : status === 'active' ? 'bg-yellow-500' : 'bg-zinc-500';
  return (
    <span className="flex items-center gap-2 text-sm text-zinc-300">
      <span className={`w-2 h-2 rounded-full ${dotColor} ${status === 'online' ? 'animate-pulse' : ''}`} />
      {status}
    </span>
  );
}
