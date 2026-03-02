'use client'
import AppLayout from '@/components/layout/AppLayout'
import { BarChart3 } from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <AppLayout>
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <BarChart3 size={48} className="text-slate-600 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Analytics</h1>
        <p className="text-slate-500">Tez orada qo'shiladi...</p>
      </div>
    </AppLayout>
  )
}
