'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Zap, Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
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
      toast.error(err.response?.data?.detail || 'Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ background: '#0b1120' }}>
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-10" style={{ background: '#6366f1', filter: 'blur(80px)' }} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-10" style={{ background: '#3b82f6', filter: 'blur(80px)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass rounded-2xl p-8 relative z-10"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl gradient-btn flex items-center justify-center mb-4">
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold glow-text">TenderZone</h1>
          <p className="text-slate-500 text-sm mt-1">Social Media Automation</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {['Login', 'Register'].map((tab, i) => (
            <button
              key={tab}
              onClick={() => setIsRegister(i === 1)}
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
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder="To'liq isming"
                className="input-dark pl-10"
              />
            </div>
          )}

          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="Email manzilingiz"
              className="input-dark pl-10"
            />
          </div>

          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type={showPw ? 'text' : 'password'}
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Parol"
              className="input-dark pl-10 pr-10"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
            <button
              onClick={() => setShowPw(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-semibold gradient-btn disabled:opacity-50 flex items-center justify-center gap-2"
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
            onClick={() => setIsRegister(r => !r)}
            className="text-indigo-400 hover:text-indigo-300 font-medium"
          >
            {isRegister ? 'Kirish' : 'Ro\'yxatdan o\'tish'}
          </button>
        </p>
      </motion.div>
    </div>
  )
}
