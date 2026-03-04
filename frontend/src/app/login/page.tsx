'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [isRegister, setIsRegister] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', full_name: '' })

  const handleSubmit = async () => {
    if (!form.email || !form.password) { toast.error('Email va parol kiriting'); return }
    if (isRegister && !form.full_name.trim()) { toast.error('Ismingizni kiriting'); return }
    if (isRegister && form.password.length < 6) { toast.error('Parol kamida 6 ta belgi'); return }
    setLoading(true)
    try {
      const res = isRegister
        ? await authAPI.register({ email: form.email, password: form.password, full_name: form.full_name })
        : await authAPI.login({ email: form.email, password: form.password })
      const { access_token, refresh_token, user } = res.data
      localStorage.setItem('access_token', access_token)
      localStorage.setItem('refresh_token', refresh_token)
      localStorage.setItem('user', JSON.stringify(user))
      toast.success(isRegister ? '✅ Muvaffaqiyatli ro\'yxatdan o\'tdingiz!' : '👋 Xush kelibsiz!')
      router.replace('/dashboard')
    } catch (err: any) {
      const detail = err.response?.data?.detail
      if (detail === 'Email already registered') {
        toast.error('Bu email allaqachon ro\'yxatdan o\'tgan')
      } else {
        toast.error(Array.isArray(detail) ? (detail[0]?.msg || 'Xatolik') : (detail || 'Xatolik yuz berdi'))      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ background: '#0b1120' }}>
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: '#6366f1', filter: 'blur(80px)' }} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: '#3b82f6', filter: 'blur(80px)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass rounded-2xl p-8 relative z-10"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://augz.uz/wp-content/uploads/2024/11/Logo.svg"
              alt="DXIU Logo"
              className="h-14 w-auto"
              onError={(e) => {
                // Fallback: SVG yuklanmasa gradient box
                const el = e.currentTarget
                el.style.display = 'none'
                el.parentElement!.innerHTML = `
                  <div style="width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#6366f1,#3b82f6);display:flex;align-items:center;justify-content:center;">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                  </div>`
              }}
            />
          </div>
          <h1 className="text-lg font-bold text-white text-center leading-tight">
            DXIU
          </h1>
          <p className="text-slate-500 text-xs mt-1 text-center">
            Davlat Xaridlari Ishtirokchilari Uyushmasi
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {['Kirish', "Ro'yxat"].map((tab, i) => (
            <button
              key={tab}
              onClick={() => { setIsRegister(i === 1); setForm({ email: '', password: '', full_name: '' }) }}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: isRegister === (i === 1) ? 'rgba(99,102,241,0.2)' : 'transparent',
                color: isRegister === (i === 1) ? '#818cf8' : '#6b7280',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-slate-400 text-xs font-medium mb-1.5">
                To'liq ism *
              </label>
              <input
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder="Ism Familiya"
                className="input-dark"
              />
            </div>
          )}

          <div>
            <label className="block text-slate-400 text-xs font-medium mb-1.5">
              Email *
            </label>
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
              Parol *
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                className="input-dark"
                style={{ paddingRight: '2.75rem' }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
              <button
                type="button"
                onClick={() => setShowPw(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                style={{ zIndex: 10 }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-semibold gradient-btn disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              isRegister ? '🚀 Ro\'yxatdan o\'tish' : '🔐 Kirish'
            )}
          </motion.button>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          {isRegister ? 'Hisobing bormi?' : 'Hisob yo\'qmi?'}{' '}
          <button
            onClick={() => { setIsRegister(r => !r); setForm({ email: '', password: '', full_name: '' }) }}
            className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            {isRegister ? 'Kirish' : 'Ro\'yxatdan o\'tish'}
          </button>
        </p>
      </motion.div>
    </div>
  )
}
