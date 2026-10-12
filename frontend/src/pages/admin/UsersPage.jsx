import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, Search, Shield, Ban, CheckCircle } from 'lucide-react';
import { adminApi } from '../../api/index.js';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['adminUsers', search],
    queryFn: () => adminApi.users({ search: search || undefined }),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => adminApi.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
  });

  const users = usersData?.results || (Array.isArray(usersData) ? usersData : []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-white">Users & Roles</h1>
        <p className="text-zinc-400 text-sm">
          Manage platform accounts, ban bad actors, and assign admin privileges.
        </p>
      </div>

      <div className="flex items-center gap-4 bg-surface p-3 rounded-2xl border border-surface-border">
        <Search className="w-5 h-5 text-zinc-400 ml-2" />
        <input
          type="text"
          placeholder="Search users by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none text-sm text-white placeholder-zinc-500 focus:outline-none w-full"
        />
      </div>

      <div className="bg-surface rounded-2xl border border-surface-border overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-surface-card text-xs uppercase font-semibold text-zinc-400 border-b border-surface-border">
              <tr>
                <th className="px-6 py-4">User Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {isLoading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-4 h-14 bg-surface/40" />
                  </tr>
                ))
              ) : users.length > 0 ? (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-white">{u.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                          u.role === 'admin'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                            : 'bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        {u.role || 'user'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.is_banned ? (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-semibold">
                          Banned
                        </span>
                      ) : (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-semibold">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-zinc-400 text-xs">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {/* Role Toggle */}
                      <button
                        onClick={() =>
                          updateUserMutation.mutate({
                            id: u.id,
                            data: { role: u.role === 'admin' ? 'user' : 'admin' },
                          })
                        }
                        className="px-3 py-1.5 rounded-lg bg-surface-card hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-colors"
                      >
                        {u.role === 'admin' ? 'Demote to User' : 'Make Admin'}
                      </button>

                      {/* Ban Toggle */}
                      <button
                        onClick={() =>
                          updateUserMutation.mutate({
                            id: u.id,
                            data: { is_banned: !u.is_banned },
                          })
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          u.is_banned
                            ? 'bg-green-600/20 hover:bg-green-600 text-green-300 hover:text-white'
                            : 'bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white'
                        }`}
                      >
                        {u.is_banned ? 'Unban' : 'Ban'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    No users found matching query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

