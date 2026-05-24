'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'superadmin') {
      fetch('http://localhost:8000/auth/admin/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('puppy_token')}` }
      })
      .then(res => res.json())
      .then(setUsers);
    }
  }, [user]);

  if (user?.role !== 'admin' && user?.role !== 'superadmin') {
    return <div className="text-red-500">权限不足</div>;
  }

  return (
    <div className="p-8 bg-zinc-950 min-h-screen text-white">
      <h1 className="text-4xl font-bold mb-8 flex items-center gap-4">
        🛠️ PuppyForge Admin Panel
      </h1>

      <div className="bg-zinc-900 rounded-3xl p-8">
        <h2 className="text-2xl mb-6">用户管理</h2>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-4">邮箱</th>
              <th className="text-left py-4">角色</th>
              <th className="text-left py-4">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u: any) => (
              <tr key={u.id} className="border-b border-white/10">
                <td className="py-4">{u.email}</td>
                <td className="py-4">{u.role}</td>
                <td>
                  <button 
                    onClick={() => fetch(`/auth/admin/promote/${u.id}`, { method: 'POST' })}
                    className="px-4 py-2 bg-purple-600 rounded-xl text-sm hover:bg-purple-500"
                  >
                    提升为 Admin
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
