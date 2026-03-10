'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  // Agar token bo'lsa — dashboardga
  useEffect(() => {
    if (localStorage.getItem('access_token')) router.replace('/dashboard')
  }, [router])

  const handleSubmit = async () => {
    if (!form.email || !form.password) { toast.error('Email va parol kiriting'); return }
    setLoading(true)
    try {
      const res = await authAPI.login({ email: form.email, password: form.password })
      const { access_token, refresh_token, user } = res.data
      localStorage.setItem('access_token', access_token)
      localStorage.setItem('refresh_token', refresh_token)
      localStorage.setItem('user', JSON.stringify(user))
      toast.success('👋 Xush kelibsiz!')
      router.replace('/dashboard')
    } catch (err: any) {
      const detail = err.response?.data?.detail
      toast.error(detail === 'Incorrect email or password'
        ? 'Email yoki parol noto\'g\'ri'
        : (detail || 'Kirish amalga oshmadi'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ background: '#0b1120' }}>
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
          <img
            src="https://augz.uz/wp-content/uploads/2024/11/Logo.svg"
            alt="DXIU Logo"
            className="h-14 w-auto mb-4"
            onError={(e) => {
              const el = e.currentTarget
              el.style.display = 'none'
              el.parentElement!.innerHTML = `<div style="width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#6366f1,#3b82f6);display:flex;align-items:center;justify-content:center;margin-bottom:16px"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></div>`
            }}
          />
          <h1 className="text-xl font-bold text-white">DXIU ga kirish</h1>
          <p className="text-slate-500 text-xs mt-1">Davlat Xaridlari Ishtirokchilari Uyushmasi</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-slate-400 text-xs font-medium mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="you@example.com"
              className="input-dark"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <div>
            <label className="block text-slate-400 text-xs font-medium mb-1.5">Parol</label>
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
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
            {loading
              ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : '🔐 Kirish'}
          </motion.button>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          Hisob yo'qmi?{' '}
          <a href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
            Ro'yxatdan o'tish
          </a>
        </p>
      </motion.div>
    </div>
  )
}