'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Zap, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI } from '@/lib/api'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    password2: '',
  })

  const handle = async () => {
    if (!form.full_name.trim()) { toast.error('Ismingizni kiriting'); return }
    if (!form.email.trim()) { toast.error('Email kiriting'); return }
    if (form.password.length < 6) { toast.error('Parol kamida 6 ta belgi bo\'lsin'); return }
    if (form.password !== form.password2) { toast.error('Parollar mos kelmadi'); return }

    setLoading(true)
    try {
      const res = await authAPI.register({
        email: form.email.trim(),
        password: form.password,
        full_name: form.full_name.trim(),
      })

      const { access_token, refresh_token, user } = res.data
      localStorage.setItem('access_token', access_token)
      localStorage.setItem('refresh_token', refresh_token)
      localStorage.setItem('user', JSON.stringify(user))

      setDone(true)
      toast.success('✅ Muvaffaqiyatli ro\'yxatdan o\'tdingiz!')

      // 1.5 soniyadan keyin dashboardga yo'naltirish
      setTimeout(() => router.replace('/dashboard'), 1500)

    } catch (err: any) {
      const detail = err.response?.data?.detail
      if (detail === 'Email already registered') {
        toast.error('Bu email allaqachon ro\'yxatdan o\'tgan. Kirish sahifasiga o\'ting.')
      } else {
        toast.error(detail || 'Ro\'yxatdan o\'tishda xato')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0b1120 0%, #0f172a 50%, #0b1120 100%)' }}
    >
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full opacity-[0.06]"
          style={{ background: '#6366f1', filter: 'blur(100px)' }} />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full opacity-[0.06]"
          style={{ background: '#3b82f6', filter: 'blur(100px)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="rounded-2xl p-8" style={{
          background: 'rgba(17,24,39,0.95)',
          border: '1px solid rgba(99,102,241,0.15)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        }}>

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>
              <Zap size={22} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Hisob yaratish</h1>
            <p className="text-slate-500 text-sm mt-0.5">TenderZone ga qo'shiling</p>
          </div>

          {/* Success state */}
          {done ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center py-6"
            >
              <CheckCircle2 size={48} className="text-emerald-400 mb-3" />
              <p className="text-white font-semibold">Muvaffaqiyatli!</p>
              <p className="text-slate-400 text-sm mt-1">Dashboard ga yo'naltirilmoqda...</p>
            </motion.div>
          ) : (
            /* Form */
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1.5 ml-0.5">
                  To'liq ism *
                </label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  placeholder="Ism Familiya"
                  className="w-full px-4 py-3 rounded-xl text-slate-200 text-sm outline-none transition-all placeholder-slate-600"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(99,102,241,0.2)' }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.5)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(99,102,241,0.2)')}
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1.5 ml-0.5">
                  Email *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl text-slate-200 text-sm outline-none transition-all placeholder-slate-600"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(99,102,241,0.2)' }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.5)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(99,102,241,0.2)')}
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1.5 ml-0.5">
                  Parol * <span className="text-slate-600">(kamida 6 ta belgi)</span>
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl text-slate-200 text-sm outline-none transition-all placeholder-slate-600"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(99,102,241,0.2)' }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.5)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(99,102,241,0.2)')}
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1.5 ml-0.5">
                  Parolni takrorlang *
                </label>
                <input
                  type="password"
                  value={form.password2}
                  onChange={e => setForm(f => ({ ...f, password2: e.target.value }))}
                  placeholder="••••••••"
                  onKeyDown={e => e.key === 'Enter' && handle()}
                  className="w-full px-4 py-3 rounded-xl text-slate-200 text-sm outline-none transition-all placeholder-slate-600"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${
                      form.password2 && form.password !== form.password2
                        ? 'rgba(239,68,68,0.5)'
                        : 'rgba(99,102,241,0.2)'
                    }`,
                  }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.5)')}
                  onBlur={e => {
                    e.target.style.borderColor = form.password2 && form.password !== form.password2
                      ? 'rgba(239,68,68,0.5)'
                      : 'rgba(99,102,241,0.2)'
                  }}
                />
                {form.password2 && form.password !== form.password2 && (
                  <p className="text-red-400 text-xs mt-1 ml-0.5">Parollar mos kelmadi</p>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handle}
                disabled={loading}
                className="w-full py-3 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : 'Ro\'yxatdan o\'tish'}
              </motion.button>
            </div>
          )}

          {/* Login link */}
          {!done && (
            <p className="text-center text-slate-500 text-xs mt-6">
              Hisobingiz bormi?{' '}
              <a href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                Kirish
              </a>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  )
}
