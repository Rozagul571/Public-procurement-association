'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { TrendingUp, Send, Clock, AlertTriangle, BarChart3 } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { statsAPI } from '@/lib/api'

const PLATFORM_COLORS: Record<string, string> = {
  youtube: '#ef4444',
  instagram: '#ec4899',
  linkedin: '#3b82f6',
  telegram: '#38bdf8',
}
const FALLBACK_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6']

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    statsAPI.dashboard()
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Pie chart uchun platform data
  const pieData = stats?.platforms?.length
    ? stats.platforms.map((p: any) => ({ name: p.platform, value: 1 }))
    : [{ name: 'Ulanmagan', value: 1 }]

  // Area chart uchun mock trend (real API bo'lganda almashtiriladi)
  const areaData = [
    { day: 'Du', published: stats?.published_posts ? Math.floor(stats.published_posts * 0.1) : 0, failed: 0 },
    { day: 'Se', published: stats?.published_posts ? Math.floor(stats.published_posts * 0.15) : 0, failed: 0 },
    { day: 'Ch', published: stats?.published_posts ? Math.floor(stats.published_posts * 0.2) : 0, failed: 1 },
    { day: 'Pa', published: stats?.published_posts ? Math.floor(stats.published_posts * 0.18) : 0, failed: 0 },
    { day: 'Ju', published: stats?.published_posts ? Math.floor(stats.published_posts * 0.25) : 0, failed: 0 },
    { day: 'Sh', published: stats?.published_posts ? Math.floor(stats.published_posts * 0.07) : 0, failed: 0 },
    { day: 'Ya', published: stats?.published_posts ? Math.floor(stats.published_posts * 0.05) : 0, failed: 0 },
  ]

  const summaryCards = stats ? [
    { label: 'Jami nashr', value: stats.published_posts, icon: <Send size={18} />, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Rejalashgan', value: stats.scheduled_posts, icon: <Clock size={18} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    { label: 'Muvaffaqiyatsiz', value: stats.failed_posts, icon: <AlertTriangle size={18} />, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    { label: 'Jami post', value: stats.total_posts, icon: <TrendingUp size={18} />, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
  ] : []

  return (
    <AppLayout>
      <div className="p-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-white">Analytics</h1>
          <p className="text-slate-400 mt-1">Post va platforma statistikasi</p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {summaryCards.map((card, i) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -3 }}
                  className="glass rounded-2xl p-5"
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: card.bg, color: card.color }}>
                    {card.icon}
                  </div>
                  <p className="text-2xl font-bold text-white">{card.value}</p>
                  <p className="text-slate-500 text-xs mt-1">{card.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Area chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass rounded-2xl p-6 mb-5"
            >
              <h3 className="text-white font-semibold mb-5">Bu haftaning nashrlari</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={areaData}>
                  <defs>
                    <linearGradient id="pubGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <YAxis stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 12 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#161d2e', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10 }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Area type="monotone" dataKey="published" stroke="#6366f1" strokeWidth={2.5}
                    fill="url(#pubGrad)" name="Nashr qilindi" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Pie + Platform list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="glass rounded-2xl p-6"
              >
                <h3 className="text-white font-semibold mb-4">Platform taqsimoti</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                      paddingAngle={4} dataKey="value">
                      {pieData.map((entry: any, i: number) => (
                        <Cell key={i} fill={PLATFORM_COLORS[entry.name] || FALLBACK_COLORS[i % FALLBACK_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend
                      formatter={(value) => <span style={{ color: '#9ca3af', fontSize: 12, textTransform: 'capitalize' }}>{value}</span>}
                    />
                    <Tooltip
                      contentStyle={{ background: '#161d2e', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="glass rounded-2xl p-6"
              >
                <h3 className="text-white font-semibold mb-4">Platform samaradorligi</h3>
                {stats?.platforms?.length > 0 ? (
                  <div className="space-y-3">
                    {stats.platforms.map((p: any, i: number) => {
                      const color = PLATFORM_COLORS[p.platform] || FALLBACK_COLORS[i % FALLBACK_COLORS.length]
                      const pct = stats.total_posts > 0
                        ? Math.round((stats.published_posts / stats.total_posts) * 100)
                        : 0
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-slate-300 text-sm capitalize">{p.platform}</span>
                            <span className="text-slate-500 text-xs">{pct}%</span>
                          </div>
                          <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ delay: 0.7 + i * 0.1, duration: 0.8 }}
                              className="h-2 rounded-full"
                              style={{ background: color }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32">
                    <BarChart3 size={32} className="text-slate-600 mb-3" />
                    <p className="text-slate-500 text-sm">Platformalar ulanmagan</p>
                    <a href="/platforms" className="text-indigo-400 text-xs hover:underline mt-2">
                      Platformalar sahifasiga o'ting →
                    </a>
                  </div>
                )}
              </motion.div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}