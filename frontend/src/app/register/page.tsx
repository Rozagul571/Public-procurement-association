'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, CheckCircle2, User, Mail, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI } from '@/lib/api'

type Tab = 'register' | 'login'

export default function AuthPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('register')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [done, setDone] = useState(false)

  const [reg, setReg] = useState({ full_name: '', email: '', password: '', password2: '' })
  const [log, setLog] = useState({ email: '', password: '' })

  useEffect(() => {
    if (localStorage.getItem('access_token')) router.replace('/dashboard')
  }, [router])

  const handleRegister = async () => {
    if (!reg.full_name.trim()) { toast.error("Ismingizni kiriting"); return }
    if (!reg.email.trim()) { toast.error("Email kiriting"); return }
    if (reg.password.length < 6) { toast.error("Parol kamida 6 ta belgi"); return }
    if (reg.password !== reg.password2) { toast.error("Parollar mos kelmadi"); return }
    setLoading(true)
    try {
      const res = await authAPI.register({ email: reg.email.trim(), password: reg.password, full_name: reg.full_name.trim() })
      const { access_token, refresh_token, user } = res.data
      localStorage.setItem('access_token', access_token)
      localStorage.setItem('refresh_token', refresh_token)
      localStorage.setItem('user', JSON.stringify(user))
      setDone(true)
      toast.success("✅ Muvaffaqiyatli ro'yxatdan o'tdingiz!")
      setTimeout(() => router.replace('/dashboard'), 1500)
    } catch (err: any) {
      const detail = err.response?.data?.detail
      if (detail === 'Email already registered') toast.error("Bu email allaqachon ro'yxatdan o'tgan")
      else toast.error(Array.isArray(detail) ? (detail[0]?.msg || 'Xatolik') : (detail || 'Xatolik'))
    } finally { setLoading(false) }
  }

  const handleLogin = async () => {
    if (!log.email || !log.password) { toast.error("Email va parol kiriting"); return }
    setLoading(true)
    try {
      const res = await authAPI.login({ email: log.email, password: log.password })
      const { access_token, refresh_token, user } = res.data
      localStorage.setItem('access_token', access_token)
      localStorage.setItem('refresh_token', refresh_token)
      localStorage.setItem('user', JSON.stringify(user))
      toast.success("👋 Xush kelibsiz!")
      router.replace('/dashboard')
    } catch (err: any) {
      const detail = err.response?.data?.detail
      toast.error(detail === 'Invalid email or password' ? "Email yoki parol noto'g'ri" : (detail || 'Kirish amalga oshmadi'))
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0b1120' }}>
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full opacity-[0.07]"
          style={{ background: '#6366f1', filter: 'blur(120px)' }} />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full opacity-[0.07]"
          style={{ background: '#3b82f6', filter: 'blur(120px)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-[0.04]"
          style={{ background: '#8b5cf6', filter: 'blur(80px)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-4"
          >
            <img
              src="https://augz.uz/wp-content/uploads/2024/11/Logo.svg"
              alt="DXIU"
              className="h-14 w-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                const div = document.createElement('div')
                div.style.cssText = 'width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#6366f1,#3b82f6);display:flex;align-items:center;justify-content:center'
                div.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>'
                e.currentTarget.parentElement?.appendChild(div)
              }}
            />
          </motion.div>
          <h1 className="text-2xl font-bold text-white">DXIU</h1>
          <p className="text-slate-500 text-sm mt-1">Davlat Xaridlari Ishtirokchilari Uyushmasi</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl overflow-hidden" style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}>
          {/* Tabs */}
          <div className="flex" style={{ background: 'rgba(0,0,0,0.2)' }}>
            {(['register', 'login'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-4 text-sm font-semibold transition-all relative"
                style={{ color: tab === t ? '#fff' : '#6b7280' }}
              >
                {t === 'register' ? "Ro'yxatdan o'tish" : 'Kirish'}
                {tab === t && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ background: 'linear-gradient(90deg, #6366f1, #3b82f6)' }}
                  />
                )}
              </button>
            ))}
          </div>

          <div className="p-8">
            <AnimatePresence mode="wait">
              {tab === 'register' ? (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  {done ? (
                    <div className="flex flex-col items-center py-8">
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                        <CheckCircle2 size={56} className="text-emerald-400 mb-4" />
                      </motion.div>
                      <p className="text-white font-semibold text-lg">Muvaffaqiyatli!</p>
                      <p className="text-slate-400 text-sm mt-1">Dashboard ga yo'naltirilmoqda...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center mb-6">
                        <h2 className="text-white font-bold text-xl">Hisob yaratish</h2>
                        <p className="text-slate-500 text-sm mt-1">Tizimga qo'shilish uchun ma'lumotlaringizni kiriting</p>
                      </div>

                      {/* Full name */}
                      <div>
                        <label className="text-slate-400 text-xs font-medium block mb-1.5">To'liq ism</label>
                        <div className="relative">
                          <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                          <input
                            type="text"
                            value={reg.full_name}
                            onChange={e => setReg(f => ({ ...f, full_name: e.target.value }))}
                            placeholder="Ism Familiya"
                            className="input-dark"
                            style={{ paddingLeft: '2.25rem' }}
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div>
                        <label className="text-slate-400 text-xs font-medium block mb-1.5">Email</label>
                        <div className="relative">
                          <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                          <input
                            type="email"
                            value={reg.email}
                            onChange={e => setReg(f => ({ ...f, email: e.target.value }))}
                            placeholder="you@example.com"
                            className="input-dark"
                            style={{ paddingLeft: '2.25rem' }}
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div>
                        <label className="text-slate-400 text-xs font-medium block mb-1.5">Parol</label>
                        <div className="relative">
                          <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                          <input
                            type={showPw ? 'text' : 'password'}
                            value={reg.password}
                            onChange={e => setReg(f => ({ ...f, password: e.target.value }))}
                            placeholder="Kamida 6 ta belgi"
                            className="input-dark"
                            style={{ paddingLeft: '2.25rem', paddingRight: '2.75rem' }}
                          />
                          <button onClick={() => setShowPw(s => !s)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Confirm password */}
                      <div>
                        <label className="text-slate-400 text-xs font-medium block mb-1.5">Parolni tasdiqlang</label>
                        <div className="relative">
                          <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                          <input
                            type="password"
                            value={reg.password2}
                            onChange={e => setReg(f => ({ ...f, password2: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && handleRegister()}
                            placeholder="Parolni qayta kiriting"
                            className="input-dark"
                            style={{
                              paddingLeft: '2.25rem',
                              borderColor: reg.password2 && reg.password !== reg.password2 ? 'rgba(239,68,68,0.5)' : undefined
                            }}
                          />
                        </div>
                        {reg.password2 && reg.password !== reg.password2 && (
                          <p className="text-red-400 text-xs mt-1">Parollar mos kelmadi</p>
                        )}
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleRegister}
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl text-white font-semibold gradient-btn disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                      >
                        {loading
                          ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          : "Ro'yxatdan o'tish →"}
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="space-y-4">
                    <div className="text-center mb-6">
                      <h2 className="text-white font-bold text-xl">Tizimga kirish</h2>
                      <p className="text-slate-500 text-sm mt-1">Hisobingizga kiring</p>
                    </div>

                    <div>
                      <label className="text-slate-400 text-xs font-medium block mb-1.5">Email</label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type="email"
                          value={log.email}
                          onChange={e => setLog(f => ({ ...f, email: e.target.value }))}
                          placeholder="you@example.com"
                          className="input-dark"
                          style={{ paddingLeft: '2.25rem' }}
                          onKeyDown={e => e.key === 'Enter' && handleLogin()}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-400 text-xs font-medium block mb-1.5">Parol</label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type={showPw ? 'text' : 'password'}
                          value={log.password}
                          onChange={e => setLog(f => ({ ...f, password: e.target.value }))}
                          placeholder="••••••••"
                          className="input-dark"
                          style={{ paddingLeft: '2.25rem', paddingRight: '2.75rem' }}
                          onKeyDown={e => e.key === 'Enter' && handleLogin()}
                        />
                        <button onClick={() => setShowPw(s => !s)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                          {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleLogin}
                      disabled={loading}
                      className="w-full py-3.5 rounded-xl text-white font-semibold gradient-btn disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                    >
                      {loading
                        ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : '🔐 Kirish'}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          © 2026 DXIU — Davlat Xaridlari Ishtirokchilari Uyushmasi
        </p>
      </motion.div>
    </div>
  )
}