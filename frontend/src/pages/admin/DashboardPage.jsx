import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Film, PlaySquare, Users, Eye, TrendingUp, Calendar } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { adminApi } from '../../api/index.js';

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => adminApi.stats(),
  });

  // Prepare chart data (mock 7-day spread based on stats views)
  const viewsWeek = stats?.views_week || 420;
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const chartData = days.map((day, i) => ({
    name: day,
    views: Math.round((viewsWeek / 7) * (0.8 + Math.sin(i) * 0.4)),
  }));

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-surface rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-surface rounded-2xl" />
          ))}
        </div>
        <div className="h-72 bg-surface rounded-2xl" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Anime Shows',
      value: stats?.total_shows || 0,
      icon: Film,
      color: 'from-purple-500/20 to-purple-600/10 text-purple-400 border-purple-500/20',
    },
    {
      title: 'Total Episodes',
      value: stats?.total_episodes || 0,
      icon: PlaySquare,
      color: 'from-fuchsia-500/20 to-fuchsia-600/10 text-fuchsia-400 border-fuchsia-500/20',
    },
    {
      title: 'Registered Users',
      value: stats?.total_users || 0,
      icon: Users,
      color: 'from-pink-500/20 to-pink-600/10 text-pink-400 border-pink-500/20',
    },
    {
      title: 'Views Today',
      value: stats?.views_today || 0,
      icon: Eye,
      color: 'from-cyan-500/20 to-cyan-600/10 text-cyan-400 border-cyan-500/20',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-3xl font-black tracking-tight text-white">Platform Dashboard</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Real-time metrics, active streaming analytics, and catalog health.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className={`p-5 rounded-2xl bg-gradient-to-br ${card.color} border bg-surface/40 flex items-center justify-between shadow-lg`}
            >
              <div className="space-y-1">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  {card.title}
                </span>
                <p className="text-3xl font-black text-white">{card.value}</p>
              </div>
              <div className="p-3 rounded-xl bg-surface/80 border border-white/5">
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart Section */}
      <div className="p-6 rounded-2xl bg-surface border border-surface-border shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">Weekly Stream Traffic</h2>
          </div>
          <span className="text-xs text-zinc-400">Total this week: ~{viewsWeek} streams</span>
        </div>

        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#26262e" vertical={false} />
              <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} />
              <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181f',
                  borderColor: '#2e2e38',
                  borderRadius: '12px',
                  color: '#fff',
                }}
              />
              <Bar dataKey="views" fill="#a855f7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Watched */}
        <div className="p-6 rounded-2xl bg-surface border border-surface-border shadow-xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Film className="w-4 h-4 text-purple-400" /> Most Watched Titles
          </h2>
          <div className="divide-y divide-zinc-800">
            {stats?.most_watched && stats.most_watched.length > 0 ? (
              stats.most_watched.map((item, i) => (
                <div key={i} className="py-3 flex items-center justify-between text-sm">
                  <span className="font-semibold text-zinc-200">{item.title}</span>
                  <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-md">
                    {item.views || 0} views
                  </span>
                </div>
              ))
            ) : (
              <p className="py-6 text-sm text-zinc-500 text-center">No streaming data recorded yet</p>
            )}
          </div>
        </div>

        {/* Recently Added Episodes */}
        <div className="p-6 rounded-2xl bg-surface border border-surface-border shadow-xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-400" /> Recently Added Episodes
          </h2>
          <div className="divide-y divide-zinc-800">
            {stats?.recent_episodes && stats.recent_episodes.length > 0 ? (
              stats.recent_episodes.map((ep, i) => (
                <div key={i} className="py-3 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-semibold text-zinc-200">{ep.title}</p>
                    <p className="text-xs text-zinc-500">{ep.anime_title}</p>
                  </div>
                  <span className="text-xs text-zinc-400">
                    {ep.created_at ? new Date(ep.created_at).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
              ))
            ) : (
              <p className="py-6 text-sm text-zinc-500 text-center">No recent episodes added</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

