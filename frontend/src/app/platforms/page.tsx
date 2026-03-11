'use client'
import { Suspense } from 'react'
import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { Youtube, Instagram, Linkedin, MessageCircle, Plus, Trash2, RefreshCw, CheckCircle2, ExternalLink, X } from 'lucide-react'
import toast from 'react-hot-toast'
import AppLayout from '@/components/layout/AppLayout'
import { socialAPI } from '@/lib/api'
import { SocialAccount, TelegramChannel } from '@/types'

const PLATFORMS = [
  { key: 'youtube', label: 'YouTube', icon: <Youtube size={26} />, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', desc: 'Video publish qilish' },
  { key: 'instagram', label: 'Instagram', icon: <Instagram size={26} />, color: '#ec4899', bg: 'rgba(236,72,153,0.1)', desc: 'Instagram Business', note: 'Facebook Business kerak' },
  { key: 'linkedin', label: 'LinkedIn', icon: <Linkedin size={26} />, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', desc: 'LinkedIn postlari' },
]

function PlatformsContent() {
  const params = useSearchParams()
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [tgChannels, setTgChannels] = useState<TelegramChannel[]>([])
  const [connecting, setConnecting] = useState<string | null>(null)
  const [modal, setModal] = useState(false)
  const [tgForm, setTgForm] = useState({ channelId: '', channelUsername: '', channelName: '', loading: false })

  useEffect(() => {
    const connected = params.get('connected')
    const error = params.get('error')
    if (connected) { toast.success(`✅ ${connected} ulandi!`); window.history.replaceState({}, '', '/platforms') }
    if (error) { toast.error(`Xatolik: ${error}`); window.history.replaceState({}, '', '/platforms') }
  }, [params])

  const fetchAll = useCallback(async () => {
    try {
      const [a, t] = await Promise.all([socialAPI.list(), socialAPI.listTelegramChannels()])
      setAccounts(a.data)
      setTgChannels(t.data)
    } catch {}
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const connectOAuth = async (platform: string) => {
    setConnecting(platform)
    try {
      let r: any
      if (platform === 'youtube') r = await socialAPI.connectYoutube()
      else if (platform === 'instagram') r = await socialAPI.connectInstagram()
      else r = await socialAPI.connectLinkedin()
      window.location.href = r.data.auth_url
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'OAuth boshlanmadi')
      setConnecting(null)
    }
  }

  const disconnect = async (id: string, label: string) => {
    if (!confirm(`${label} uzilsinmi?`)) return
    try {
      await socialAPI.disconnect(id)
      setAccounts(a => a.filter(x => x.id !== id))
      toast.success(`${label} uzildi`)
    } catch { toast.error('Uzolmadi') }
  }

  const addTelegram = async () => {
    if (!tgForm.channelId.trim()) { toast.error('Channel ID kerak'); return }
    setTgForm(f => ({ ...f, loading: true }))
    try {
      await socialAPI.addTelegramChannel({
        channel_id: tgForm.channelId.trim(),
        channel_username: tgForm.channelUsername || undefined,
        channel_name: tgForm.channelName || undefined,
      })
      toast.success("✅ Telegram kanal qo'shildi!")
      setModal(false)
      setTgForm({ channelId: '', channelUsername: '', channelName: '', loading: false })
      fetchAll()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Xatolik')
      setTgForm(f => ({ ...f, loading: false }))
    }
  }

  const connectedMap = Object.fromEntries(accounts.map(a => [a.platform, a]))

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Platformalar</h1>
        <p className="text-slate-400 mt-1">Ijtimoiy tarmoq hisoblarini ulang</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {PLATFORMS.map((p) => {
          const acc = connectedMap[p.key]
          return (
            <motion.div key={p.key} whileHover={{ y: -4 }} className="glass rounded-2xl p-6 flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: p.bg, color: p.color }}>{p.icon}</div>
                {acc
                  ? <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20"><CheckCircle2 size={11} /> Ulangan</span>
                  : <span className="text-xs text-slate-500 bg-slate-800/60 px-2.5 py-1 rounded-full border border-slate-700/40">Ulanmagan</span>
                }
              </div>
              <h3 className="text-white font-semibold text-lg mb-1">{p.label}</h3>
              <p className="text-slate-500 text-xs mb-1">{p.desc}</p>
              {p.note && <p className="text-amber-500/70 text-xs">⚠ {p.note}</p>}
              <div className="flex-1" />
              <div className="flex gap-2 mt-4">
                {acc ? (
                  <>
                    <button onClick={() => connectOAuth(p.key)} disabled={connecting === p.key}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium"
                      style={{ background: `${p.color}15`, color: p.color, border: `1px solid ${p.color}30` }}>
                      <RefreshCw size={13} className={connecting === p.key ? 'animate-spin' : ''} /> Qayta ulash
                    </button>
                    <button onClick={() => disconnect(acc.id, p.label)}
                      className="p-2.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 border border-slate-700/40">
                      <Trash2 size={14} />
                    </button>
                  </>
                ) : (
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => connectOAuth(p.key)} disabled={connecting === p.key}
                    className="w-full py-2.5 rounded-xl text-white font-semibold text-sm gradient-btn disabled:opacity-50 flex items-center justify-center gap-2">
                    {connecting === p.key ? <><RefreshCw size={13} className="animate-spin" /> Yo'naltirilmoqda...</> : <><ExternalLink size={13} /> {p.label} ulash</>}
                  </motion.button>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      <motion.div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(14,165,233,0.12)', color: '#38bdf8' }}>
              <MessageCircle size={26} />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">Telegram Kanallar</h3>
              <p className="text-slate-500 text-sm">Bot API orqali</p>
              <p className="text-sky-400 text-xs mt-0.5">ID olish: @username_to_id_bot</p>
            </div>
          </div>
          <button onClick={() => setModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'rgba(14,165,233,0.15)', color: '#38bdf8', border: '1px solid rgba(14,165,233,0.3)' }}>
            <Plus size={16} /> Qo'shish
          </button>
        </div>
        {tgChannels.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle size={32} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Hech qanday kanal qo'shilmagan</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tgChannels.map(ch => (
              <div key={ch.id} className="flex items-center justify-between p-4 rounded-xl"
                style={{ background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.15)' }}>
                <div>
                  <p className="text-slate-200 font-medium">{ch.channel_name || ch.channel_username || ch.channel_id}</p>
                  <p className="text-slate-500 text-xs">ID: {ch.channel_id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Faol</span>
                  <button onClick={() => { socialAPI.deleteTelegramChannel(ch.id); setTgChannels(t => t.filter(x => x.id !== ch.id)); toast.success("O'chirildi") }}
                    className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)' }}
            onClick={e => e.target === e.currentTarget && setModal(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="glass rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-white font-semibold text-lg">Telegram kanal qo'shish</h3>
                <button onClick={() => setModal(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
              </div>
              <div className="p-4 rounded-xl mb-4" style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)' }}>
                <ol className="text-slate-400 text-xs space-y-1.5 list-decimal ml-4">
                  <li>Botni kanalingizga qo'shing va Admin qiling</li>
                  <li><strong className="text-sky-400">@username_to_id_bot</strong> ga kanaldan post forward qiling</li>
                  <li>ID ni quyiga kiriting (<code className="text-sky-400">-100...</code> bilan boshlanadi)</li>
                </ol>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-slate-300 text-sm font-medium block mb-1.5">Channel ID <span className="text-red-400">*</span></label>
                  <input value={tgForm.channelId} onChange={e => setTgForm(f => ({ ...f, channelId: e.target.value }))}
                    placeholder="-1001234567890" className="input-dark" />
                </div>
                <div>
                  <label className="text-slate-400 text-sm block mb-1.5">Username (ixtiyoriy)</label>
                  <input value={tgForm.channelUsername} onChange={e => setTgForm(f => ({ ...f, channelUsername: e.target.value }))}
                    placeholder="@my_channel" className="input-dark" />
                </div>
                <div>
                  <label className="text-slate-400 text-sm block mb-1.5">Kanal nomi (ixtiyoriy)</label>
                  <input value={tgForm.channelName} onChange={e => setTgForm(f => ({ ...f, channelName: e.target.value }))}
                    placeholder="Mening kanalim" className="input-dark" />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setModal(false)} className="flex-1 py-2.5 rounded-xl text-slate-400 text-sm border border-slate-700/50">Bekor</button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={addTelegram} disabled={tgForm.loading || !tgForm.channelId.trim()}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold gradient-btn disabled:opacity-50 flex items-center justify-center gap-2">
                  {tgForm.loading ? <><RefreshCw size={13} className="animate-spin" /> Tekshirilmoqda...</> : <><Plus size={13} /> Qo'shish</>}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function PlatformsPage() {
  return (
    <AppLayout>
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>}>
        <PlatformsContent />
      </Suspense>
    </AppLayout>
  )
}
