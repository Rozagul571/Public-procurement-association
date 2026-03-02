'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import { User, LogOut } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ email?: string; full_name?: string; role?: string } | null>(null)

  useEffect(() => {
    try { setUser(JSON.parse(localStorage.getItem('user') || '{}')) } catch {}
  }, [])

  const logout = () => {
    localStorage.clear()
    toast.success('Chiqildi')
    router.replace('/login')
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-lg">
        <h1 className="text-3xl font-bold text-white mb-8">Sozlamalar</h1>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full gradient-btn flex items-center justify-center">
              <User size={24} className="text-white" />
            </div>
            <div>
              <p className="text-white font-semibold">{user?.full_name || 'Foydalanuvchi'}</p>
              <p className="text-slate-400 text-sm">{user?.email}</p>
              <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full capitalize">{user?.role}</span>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors"
          >
            <LogOut size={16} /> Chiqish
          </button>
        </div>
      </div>
    </AppLayout>
  )
}
