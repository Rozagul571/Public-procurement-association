'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    router.replace(token ? '/dashboard' : '/login')
  }, [router])
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0b1120' }}>
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
