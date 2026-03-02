'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { TrendingUp, Send, Clock, AlertTriangle, Share2 } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { statsAPI } from '@/lib/api'
import { DashboardStats } from '@/types'

const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    statsAPI.dashboard()
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const kpis = stats ? [
    { label: 'Total Posts', value: stats.total_posts, icon: <TrendingUp size={20} />, color: '#6366f1' },
    { label: 'Published', value: stats.published_posts, icon: <Send size={20} />, color: '#10b981' },
    { label: 'Scheduled', value: stats.scheduled_posts, icon: <Clock size={20} />, color: '#f59e0b' },
    { label: 'Failed', value: stats.failed_posts, icon: <AlertTriangle size={20} />, color: '#ef4444' },
    { label: 'Platforms', value: stats.connected_platforms, icon: <Share2 size={20} />, color: '#3b82f6' },
  ] : []

  const chartData = stats ? [
    { name: 'Published', value: stats.published_posts },
    { name: 'Scheduled', value: stats.scheduled_posts },
    { name: 'Draft', value: stats.draft_posts },
    { name: 'Failed', value: stats.failed_posts },
  ] : []

  return (
    <AppLayout>
      <div className="p-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">Sizning ijtimoiy tarmoq statistikangiz</p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              {kpis.map((kpi, i) => (
                <motion.div
                  key={kpi.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -4 }}
                  className="glass rounded-2xl p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${kpi.color}20`, color: kpi.color }}>
                      {kpi.icon}
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-white">{kpi.value}</p>
                  <p className="text-slate-500 text-xs mt-1">{kpi.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="glass rounded-2xl p-6"
            >
              <h3 className="text-white font-semibold mb-5">Post Statistics</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <YAxis stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ background: '#161d2e', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12 }}
                    labelStyle={{ color: '#e2e8f0' }}
                    itemStyle={{ color: '#818cf8' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Connected platforms */}
            {stats && stats.platforms.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="glass rounded-2xl p-6 mt-5"
              >
                <h3 className="text-white font-semibold mb-4">Connected Platforms</h3>
                <div className="flex flex-wrap gap-3">
                  {stats.platforms.map((p, i) => (
                    <div key={i} className="px-4 py-2 rounded-xl text-sm" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>
                      {p.platform} · {p.account_name}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
