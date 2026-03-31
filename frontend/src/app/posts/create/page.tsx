'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Send, Clock, Youtube, Instagram, Linkedin, MessageCircle, CheckSquare, Square } from 'lucide-react'
import toast from 'react-hot-toast'
import AppLayout from '@/components/layout/AppLayout'
import { postsAPI, socialAPI } from '@/lib/api'
import { SocialAccount, TelegramChannel } from '@/types'

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
const PLATFORM_META: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  youtube: { icon: <Youtube size={18} />, color: '#ef4444', label: 'YouTube' },
  instagram: { icon: <Instagram size={18} />, color: '#ec4899', label: 'Instagram' },
  linkedin: { icon: <Linkedin size={18} />, color: '#3b82f6', label: 'LinkedIn' },
}

export default function CreatePostPage() {
  const router = useRouter()
  const [caption, setCaption] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [mediaType, setMediaType] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [tgChannels, setTgChannels] = useState<TelegramChannel[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set())
  const [selectedTg, setSelectedTg] = useState<Set<string>>(new Set())
  const [preview, setPreview] = useState('')

  useEffect(() => {
    Promise.all([socialAPI.list(), socialAPI.listTelegramChannels()])
      .then(([acc, tg]) => { setAccounts(acc.data); setTgChannels(tg.data) })
      .catch((err) => { console.error('Failed to load platforms:', err) })
  }, [])

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file) return

    // Fayl hajmini tekshirish
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`Fayl hajmi ${MAX_FILE_SIZE / (1024 * 1024)}MB dan katta`)
      return
    }

    setUploading(true)
    try {
      const r = await postsAPI.uploadMedia(file)
      setMediaUrl(r.data.media_url)
      setMediaType(r.data.media_type)
      setPreview(URL.createObjectURL(file))
      toast.success('Fayl yuklandi')
    } catch (err: any) {
      if (err.response?.status === 413) {
        toast.error('Fayl juda katta (maksimal 100MB)')
      } else {
        toast.error(err.response?.data?.detail || 'Yuklash muvaffaqiyatsiz')
      }
    } finally {
      setUploading(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif'],
      'video/*': ['.mp4', '.mov', '.avi', '.mkv']
    },
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
  })

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev => {
      const next = new Set(prev)
      next.has(platform) ? next.delete(platform) : next.add(platform)
      return next
    })
  }

  const toggleTg = (id: string) => {
    setSelectedTg(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleSubmit = async (scheduleMode: boolean) => {
    if (!caption.trim()) { toast.error('Caption yozing'); return }
    if (selectedPlatforms.size === 0 && selectedTg.size === 0) {
      toast.error('Kamida bitta platforma tanlang'); return
    }
    if (scheduleMode && !scheduledTime) { toast.error('Vaqt tanlang'); return }

    setSubmitting(true)
    try {
      const r = await postsAPI.create({
        caption,
        media_url: mediaUrl || undefined,
        media_type: mediaType || undefined,
        scheduled_time: scheduleMode ? scheduledTime : undefined,
        platforms: Array.from(selectedPlatforms),
        telegram_channel_ids: Array.from(selectedTg),
      })

      const postId = r.data.id

      if (!scheduleMode) {
        await postsAPI.publishNow(postId)
        toast.success('✅ Publishing boshlanди!')
      } else {
        toast.success('📅 Post rejalashtirildi!')
      }

      router.push('/posts')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Xatolik yuz berdi')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-white">Yangi Post</h1>
          <p className="text-slate-400 mt-1">Kontent yarating va platformalarga yuboring</p>
          <p className="text-slate-500 text-xs mt-2">Maksimal fayl hajmi: 100MB</p>
        </motion.div>

        <div className="space-y-5">
          {/* Caption */}
          <div className="glass rounded-2xl p-5">
            <label className="text-slate-300 text-sm font-medium block mb-2">Caption *</label>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Postingiz matni..."
              rows={4}
              maxLength={5000}
              className="w-full bg-transparent text-slate-200 text-sm outline-none resize-none placeholder-slate-600"
            />
            <div className="flex justify-end mt-2">
              <span className="text-slate-600 text-xs">{caption.length}/5000 ta belgi</span>
            </div>
          </div>

          {/* Media Upload */}
          <div className="glass rounded-2xl p-5">
            <label className="text-slate-300 text-sm font-medium block mb-3">Media (ixtiyoriy)</label>
            {preview ? (
              <div className="relative">
                {mediaType === 'image' ? (
                  <img src={preview} alt="preview" className="w-full h-48 object-cover rounded-xl" />
                ) : (
                  <video src={preview} className="w-full h-48 object-cover rounded-xl" controls />
                )}
                <button
                  onClick={() => { setPreview(''); setMediaUrl(''); setMediaType('') }}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center cursor-pointer transition-colors
                  ${isDragActive ? 'border-indigo-500 bg-indigo-500/5' : 'border-indigo-500/20'}`}
              >
                <input {...getInputProps()} />
                {uploading ? (
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-400 text-sm mt-2">Yuklanmoqda...</p>
                  </div>
                ) : (
                  <>
                    <Upload size={28} className="text-slate-500 mb-2" />
                    <p className="text-slate-400 text-sm">Rasm yoki video tashlang</p>
                    <p className="text-slate-600 text-xs mt-1">JPG, PNG, GIF, MP4, MOV (max 100MB)</p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Platform Selection */}
          <div className="glass rounded-2xl p-5">
            <label className="text-slate-300 text-sm font-medium block mb-3">Platformalar *</label>

            {/* OAuth accounts */}
            {accounts.length > 0 && (
              <div className="space-y-2 mb-3">
                <p className="text-slate-500 text-xs">Ulangan platformalar:</p>
                {accounts.map(acc => {
                  const meta = PLATFORM_META[acc.platform]
                  if (!meta) return null
                  const selected = selectedPlatforms.has(acc.platform)
                  return (
                    <button
                      key={acc.id}
                      onClick={() => togglePlatform(acc.platform)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                      style={{
                        background: selected ? `${meta.color}15` : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${selected ? meta.color + '40' : 'rgba(99,102,241,0.15)'}`,
                      }}
                    >
                      <span style={{ color: meta.color }}>{meta.icon}</span>
                      <span className="text-slate-200 text-sm flex-1 text-left">{acc.account_name || meta.label}</span>
                      {selected ? <CheckSquare size={16} style={{ color: meta.color }} /> : <Square size={16} className="text-slate-600" />}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Telegram channels */}
            {tgChannels.length > 0 && (
              <div className="space-y-2">
                <p className="text-slate-500 text-xs">Telegram kanallar:</p>
                {tgChannels.map(ch => {
                  const selected = selectedTg.has(ch.id)
                  return (
                    <button
                      key={ch.id}
                      onClick={() => toggleTg(ch.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                      style={{
                        background: selected ? 'rgba(14,165,233,0.12)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${selected ? 'rgba(14,165,233,0.4)' : 'rgba(99,102,241,0.15)'}`,
                      }}
                    >
                      <MessageCircle size={18} className="text-sky-400" />
                      <span className="text-slate-200 text-sm flex-1 text-left">{ch.channel_name || ch.channel_username || ch.channel_id}</span>
                      {selected ? <CheckSquare size={16} className="text-sky-400" /> : <Square size={16} className="text-slate-600" />}
                    </button>
                  )
                })}
              </div>
            )}

            {accounts.length === 0 && tgChannels.length === 0 && (
              <div className="text-center py-6">
                <p className="text-slate-500 text-sm">Hech qanday platforma ulanmagan</p>
                <a href="/platforms" className="text-indigo-400 text-sm hover:underline mt-2 inline-block">
                  Platformalar sahifasiga o'ting →
                </a>
              </div>
            )}
          </div>

          {/* Schedule time */}
          <div className="glass rounded-2xl p-5">
            <label className="text-slate-300 text-sm font-medium block mb-2">Rejalashtirish vaqti (ixtiyoriy)</label>
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={e => setScheduledTime(e.target.value)}
              className="input-dark"
              min={new Date().toISOString().slice(0, 16)}
            />
            <p className="text-slate-500 text-xs mt-2">Agar vaqt tanlanmasa, post darhol nashr qilinadi</p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              className="flex-1 py-3 rounded-xl text-white font-semibold gradient-btn disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send size={16} />
              Hozir nashr qilish
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSubmit(true)}
              disabled={submitting || !scheduledTime}
              className="flex-1 py-3 rounded-xl text-slate-200 font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}
            >
              <Clock size={16} />
              Rejalash
            </motion.button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}