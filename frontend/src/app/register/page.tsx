'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI } from '@/lib/api'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [form, setForm] = useState({ full_name: '', email: '', password: '', password2: '' })

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
      setTimeout(() => router.replace('/dashboard'), 1500)
    } catch (err: any) {
      const detail = err.response?.data?.detail
      if (detail === 'Email already registered') {
        toast.error('Bu email allaqachon ro\'yxatdan o\'tgan')
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
      style={{ background: '#0b1120' }}
    >
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
        <div className="glass rounded-2xl p-8" style={{ boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="mb-3 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://augz.uz/wp-content/uploads/2024/11/Logo.svg"
                alt="DXIU Logo"
                className="h-12 w-auto"
                onError={(e) => {
                  const el = e.currentTarget
                  el.style.display = 'none'
                  el.parentElement!.innerHTML = `<div style="width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#6366f1,#3b82f6);display:flex;align-items:center;justify-content:center;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></div>`
                }}
              />
            </div>
            <h1 className="text-lg font-bold text-white text-center">Hisob yaratish</h1>
            <p className="text-slate-500 text-xs mt-0.5 text-center">DXIU tizimiga qo'shiling</p>
          </div>

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
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1.5">To'liq ism *</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  placeholder="Ism Familiya"
                  className="input-dark"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1.5">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com"
                  className="input-dark"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1.5">
                  Parol * <span className="text-slate-600">(kamida 6 ta belgi)</span>
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className="input-dark"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1.5">Parolni takrorlang *</label>
                <input
                  type="password"
                  value={form.password2}
                  onChange={e => setForm(f => ({ ...f, password2: e.target.value }))}
                  placeholder="••••••••"
                  onKeyDown={e => e.key === 'Enter' && handle()}
                  className="input-dark"
                  style={{
                    borderColor: form.password2 && form.password !== form.password2
                      ? 'rgba(239,68,68,0.5)'
                      : undefined,
                  }}
                />
                {form.password2 && form.password !== form.password2 && (
                  <p className="text-red-400 text-xs mt-1">Parollar mos kelmadi</p>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handle}
                disabled={loading}
                className="w-full py-3 rounded-xl text-white text-sm font-semibold gradient-btn disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : 'Ro\'yxatdan o\'tish'}
              </motion.button>
            </div>
          )}

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
