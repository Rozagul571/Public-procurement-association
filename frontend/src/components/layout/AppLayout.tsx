'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, FileText, BarChart3,
  Settings, Share2, LogOut, Menu, X
} from 'lucide-react'

const NAV = [
  { href: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
  { href: '/posts', icon: <FileText size={20} />, label: 'Posts' },
  { href: '/platforms', icon: <Share2 size={20} />, label: 'Platformalar' },
  { href: '/analytics', icon: <BarChart3 size={20} />, label: 'Analytics' },
  { href: '/settings', icon: <Settings size={20} />, label: 'Sozlamalar' },
]

function DXIULogo({ size = 36 }: { size?: number }) {
  const [imgFailed, setImgFailed] = useState(false)
  if (imgFailed) {
    return (
      <div
        className="rounded-xl gradient-btn flex items-center justify-center flex-shrink-0"
        style={{ width: size, height: size }}
      >
        <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none"
          stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      </div>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="https://augz.uz/wp-content/uploads/2024/11/Logo.svg"
      alt="DXIU"
      style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }}
      onError={() => setImgFailed(true)}
    />
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [user, setUser] = useState<{ email?: string; full_name?: string } | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) { router.replace('/login'); return }
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}')
      setUser(u)
    } catch {}
  }, [router])

  const logout = () => {
    localStorage.clear()
    router.replace('/login')
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#0b1120' }}>
      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col flex-shrink-0 border-r"
        style={{ background: '#111827', borderColor: 'rgba(99,102,241,0.1)', overflow: 'hidden' }}
      >
        {/* Logo header */}
        <div
          className="flex items-center gap-3 px-4 border-b"
          style={{ borderColor: 'rgba(99,102,241,0.1)', minHeight: 68, minWidth: 0 }}
        >
          <DXIULogo size={36} />
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col min-w-0"
            >
              <span className="text-white font-bold text-sm leading-tight whitespace-nowrap">DXIU</span>
              <span className="text-slate-500 text-[10px] leading-tight whitespace-nowrap">
                Davlat Xaridlari Uyushmasi
              </span>
            </motion.div>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="ml-auto text-slate-500 hover:text-white transition-colors flex-shrink-0"
          >
            {collapsed ? <Menu size={18} /> : <X size={18} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileHover={{ x: 2 }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer"
                  style={{
                    background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
                    color: active ? '#818cf8' : '#6b7280',
                    borderLeft: active ? '2px solid #6366f1' : '2px solid transparent',
                  }}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </motion.div>
              </Link>
            )
          })}
        </nav>

        {/* User + Logout */}
        <div className="p-3 border-t" style={{ borderColor: 'rgba(99,102,241,0.1)' }}>
          {!collapsed && user && (
            <div className="px-3 py-2 mb-2 min-w-0">
              <p className="text-white text-xs font-medium truncate">{user.full_name || 'Foydalanuvchi'}</p>
              <p className="text-slate-500 text-xs truncate">{user.email}</p>
            </div>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={18} className="flex-shrink-0" />
            {!collapsed && <span className="text-sm whitespace-nowrap">Chiqish</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
