'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { authAPI } from '@/lib/api'
import { Eye, EyeOff } from 'lucide-react'

const registerSchema = z.object({
  email: z.string().email("To'g'ri email kiriting"),
  full_name: z.string().min(2, "Ism kamida 2 ta belgi bo'lishi kerak").optional(),
  password: z.string().min(6, "Parol kamida 6 ta belgi bo'lishi kerak"),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Parollar mos kelmayapti",
  path: ["confirm_password"],
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
  })

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true)
    try {
      const res = await authAPI.register({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
      })
      const { access_token, refresh_token, user } = res.data
      localStorage.setItem('access_token', access_token)
      localStorage.setItem('refresh_token', refresh_token)
      localStorage.setItem('user', JSON.stringify(user))
      toast.success('✅ Ro‘yxatdan o‘tish muvaffaqiyatli!')
      router.replace('/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Xatolik')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ background:'#0b1120' }}>

      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full opacity-10"
          style={{ background:'#6366f1', filter:'blur(120px)' }} />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full opacity-10"
          style={{ background:'#3b82f6', filter:'blur(120px)' }} />
      </div>

      <motion.div
        initial={{opacity:0,y:30}}
        animate={{opacity:1,y:0}}
        className="w-full max-w-md glass rounded-2xl p-8 relative z-10"
      >

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">

          <img
            src="https://augz.uz/wp-content/uploads/2024/11/Logo.svg"
            alt="DXIU"
            className="w-20 h-20 rounded-full object-contain mb-4 bg-white p-2"
          />

          <h1 className="text-xl font-bold text-white">
            DXIU ga ro‘yxatdan o‘tish
          </h1>

          <p className="text-slate-500 text-xs mt-1 text-center">
            Davlat Xaridlari Ishtirokchilari Uyushmasi
          </p>

        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          <div>
            <label className="block text-slate-400 text-xs mb-1">Email *</label>
            <input {...register("email")} className="input-dark w-full" placeholder="you@example.com" />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-slate-400 text-xs mb-1">
              To‘liq ism (ixtiyoriy)
            </label>
            <input {...register("full_name")} className="input-dark w-full" placeholder="Ism Familiya" />
          </div>

          <div>
            <label className="block text-slate-400 text-xs mb-1">Parol *</label>

            <div className="relative">
              <input
                {...register("password")}
                type={showPw ? 'text' : 'password'}
                className="input-dark w-full pr-10"
                placeholder="••••••••"
              />

              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPw ? <EyeOff size={18}/> : <Eye size={18}/>}
              </button>
            </div>

            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-slate-400 text-xs mb-1">
              Parolni tasdiqlang *
            </label>

            <div className="relative">
              <input
                {...register("confirm_password")}
                type={showConfirmPw ? 'text':'password'}
                className="input-dark w-full pr-10"
                placeholder="••••••••"
              />

              <button
                type="button"
                onClick={() => setShowConfirmPw(!showConfirmPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showConfirmPw ? <EyeOff size={18}/> : <Eye size={18}/>}
              </button>
            </div>

            {errors.confirm_password &&
              <p className="text-red-400 text-xs mt-1">{errors.confirm_password.message}</p>}
          </div>

          <motion.button
            whileHover={{scale:1.02}}
            whileTap={{scale:0.98}}
            disabled={loading}
            type="submit"
            className="w-full py-3 rounded-xl text-white font-semibold gradient-btn"
          >
            {loading
              ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
              : "Ro‘yxatdan o‘tish"}
          </motion.button>

        </form>

        <p className="text-center text-slate-500 text-xs mt-6">
          Hisobingiz bormi?{' '}
          <a href="/login" className="text-indigo-400 hover:text-indigo-300">
            Kirish
          </a>
        </p>

      </motion.div>
    </div>
  )
}