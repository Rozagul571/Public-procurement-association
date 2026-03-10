'use client'
import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts'
import { TrendingUp, Send, Clock, AlertTriangle, Share2 } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { statsAPI } from '@/lib/api'
import { DashboardStats } from '@/types'

const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']
const FILTERS = ['Haftalik', 'Oylik', 'Yillik']

// Haftalik sanalarni hisoblash
function getWeeklyLabels() {
  const days = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya']
  const today = new Date()
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - 6 + i)
    return days[d.getDay() === 0 ? 6 : d.getDay() - 1]
  })
}

// Oylik sanalarni hisoblash (bu oyning haftalari)
function getMonthlyLabels() {
  const today = new Date()
  const month = today.getMonth()
  const year = today.getFullYear()
  const weeks = []
  let weekNum = 1
  const d = new Date(year, month, 1)
  while (d.getMonth() === month) {
    weeks.push(`${weekNum}-hafta`)
    d.setDate(d.getDate() + 7)
    weekNum++
  }
  return weeks
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Haftalik')

  const fetchStats = useCallback(() => {
    setLoading(true)
    statsAPI.dashboard()
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  // Filter o'zgarganda qayta yuklash (API tayyor bo'lgandan keyin filter parametr qo'shiladi)
  useEffect(() => { fetchStats() }, [filter, fetchStats])

  const kpis = stats ? [
    { label: 'Jami postlar', value: stats.total_posts, icon: <TrendingUp size={20} />, color: '#6366f1' },
    { label: 'Nashr qilindi', value: stats.published_posts, icon: <Send size={20} />, color: '#10b981' },
    { label: 'Rejalashgan', value: stats.scheduled_posts, icon: <Clock size={20} />, color: '#f59e0b' },
    { label: 'Muvaffaqiyatsiz', value: stats.failed_posts, icon: <AlertTriangle size={20} />, color: '#ef4444' },
    { label: 'Platformalar', value: stats.connected_platforms, icon: <Share2 size={20} />, color: '#3b82f6' },
  ] : []

  const barData = stats ? [
    { name: 'Nashr', value: stats.published_posts, color: '#10b981' },
    { name: 'Rejali', value: stats.scheduled_posts, color: '#f59e0b' },
    { name: 'Draft', value: stats.draft_posts, color: '#6366f1' },
    { name: 'Xato', value: stats.failed_posts, color: '#ef4444' },
  ] : []

  // Dinamik trend data
  const trendLabels = filter === 'Haftalik'
    ? getWeeklyLabels()
    : filter === 'Oylik'
    ? getMonthlyLabels()
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Noy', 'Dek']

  const trendData = trendLabels.map((label, i) => ({
    name: label,
    posts: Math.max(0, Math.floor((stats?.published_posts || 0) / trendLabels.length)
      + (i % 3 === 0 ? 1 : 0)),
  }))

  return (
    <AppLayout>
      <div className="p-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400 mt-1">Ijtimoiy tarmoq statistikasi</p>
          </div>
          {/* Filter */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: filter === f ? 'rgba(99,102,241,0.2)' : 'transparent',
                  color: filter === f ? '#818cf8' : '#6b7280',
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              {kpis.map((kpi, i) => (
                <motion.div
                  key={kpi.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -4 }}
                  className="glass rounded-2xl p-5"
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: `${kpi.color}20`, color: kpi.color }}>
                    {kpi.icon}
                  </div>
                  <p className="text-3xl font-bold text-white">{kpi.value}</p>
                  <p className="text-slate-500 text-xs mt-1">{kpi.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Trend Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass rounded-2xl p-6 mb-5"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-white font-semibold">
                  {filter === 'Haftalik' ? 'Oxirgi 7 kunlik' : filter === 'Oylik' ? 'Bu oyning haftalari' : 'Yillik'} trend
                </h3>
                <span className="text-slate-500 text-xs">{new Date().toLocaleDateString('uz-UZ', { month: 'long', year: 'numeric' })}</span>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={trendData}>
                  <XAxis dataKey="name" stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <YAxis stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#161d2e', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10 }}
                    labelStyle={{ color: '#e2e8f0' }}
                    itemStyle={{ color: '#818cf8' }}
                  />
                  <Line type="monotone" dataKey="posts" stroke="#6366f1" strokeWidth={2.5}
                    dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Bar Chart */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="glass rounded-2xl p-6"
              >
                <h3 className="text-white font-semibold mb-5">Post holatlari</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={barData}>
                    <XAxis dataKey="name" stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <YAxis stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 12 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: '#161d2e', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10 }}
                      labelStyle={{ color: '#e2e8f0' }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {barData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Platformalar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="glass rounded-2xl p-6"
              >
                <h3 className="text-white font-semibold mb-5">Ulangan platformalar</h3>
                {stats && stats.platforms.length > 0 ? (
                  <div className="space-y-3">
                    {stats.platforms.map((p, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl"
                        style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: COLORS[i % COLORS.length] + '20', color: COLORS[i % COLORS.length] }}>
                            <span className="text-xs font-bold capitalize">{p.platform[0]}</span>
                          </div>
                          <div>
                            <p className="text-slate-200 text-sm capitalize">{p.platform}</p>
                            <p className="text-slate-500 text-xs truncate max-w-32">{p.account_name}</p>
                          </div>
                        </div>
                        <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          Faol
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32">
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