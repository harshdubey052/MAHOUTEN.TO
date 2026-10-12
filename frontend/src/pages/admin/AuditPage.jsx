import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ShieldAlert, Clock, UserCheck } from 'lucide-react';
import { adminApi } from '../../api/index.js';

export default function AuditPage() {
  const { data: logsData, isLoading } = useQuery({
    queryKey: ['adminAuditLogs'],
    queryFn: () => adminApi.auditLogs(),
  });

  const logs = Array.isArray(logsData) ? logsData : logsData?.results || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-white">Security & Audit Logs</h1>
        <p className="text-zinc-400 text-sm">
          Trace administrative changes, content updates, user bans, and stream modifications.
        </p>
      </div>

      <div className="bg-surface rounded-2xl border border-surface-border overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-surface-card text-xs uppercase font-semibold text-zinc-400 border-b border-surface-border">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Admin</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Target Resource</th>
                <th className="px-6 py-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {isLoading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-4 h-14 bg-surface/40" />
                  </tr>
                ))
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="px-6 py-4 text-xs font-mono text-zinc-400">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Recent'}
                    </td>
                    <td className="px-6 py-4 font-semibold text-white">
                      {log.admin_email || 'System'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-semibold uppercase">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-zinc-300">
                      {log.resource_type}: {log.resource_id}
                    </td>
                    <td className="px-6 py-4 text-xs text-zinc-400 max-w-sm truncate">
                      {typeof log.details === 'object'
                        ? JSON.stringify(log.details)
                        : String(log.details || '—')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    No audit records registered yet.
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

