'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Send, Clock, CheckCircle2, AlertCircle, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import AppLayout from '@/components/layout/AppLayout'
import { postsAPI } from '@/lib/api'
import { Post } from '@/types'

const STATUS_STYLE: Record<string, { color: string; icon: React.ReactNode }> = {
  draft: { color: '#6b7280', icon: <FileText size={13} /> },
  scheduled: { color: '#f59e0b', icon: <Clock size={13} /> },
  publishing: { color: '#3b82f6', icon: <Send size={13} /> },
  published: { color: '#10b981', icon: <CheckCircle2 size={13} /> },
  failed: { color: '#ef4444', icon: <AlertCircle size={13} /> },
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPosts = async () => {
    try {
      const r = await postsAPI.list()
      setPosts(r.data)
    } catch {
      toast.error('Posts yuklanmadi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPosts() }, [])

  const deletePost = async (id: string) => {
    if (!confirm('Postni o\'chirmoqchimisiz?')) return
    try {
      await postsAPI.delete(id)
      setPosts(p => p.filter(x => x.id !== id))
      toast.success('Post o\'chirildi')
    } catch { toast.error('O\'chirib bo\'lmadi') }
  }

  const publishPost = async (id: string) => {
    try {
      await postsAPI.publishNow(id)
      toast.success('Publishing boshlanди!')
      setTimeout(fetchPosts, 3000)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Xatolik')
    }
  }

  return (
    <AppLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Posts</h1>
            <p className="text-slate-400 mt-1">{posts.length} ta post</p>
          </div>
          <Link href="/posts/create">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold gradient-btn"
            >
              <Plus size={18} /> Yangi post
            </motion.button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 glass rounded-2xl"
          >
            <FileText size={48} className="text-slate-600 mb-4" />
            <p className="text-slate-400 text-lg mb-2">Hali postlar yo'q</p>
            <Link href="/posts/create">
              <button className="px-5 py-2.5 rounded-xl text-white gradient-btn mt-3">
                Birinchi postingizni yarating
              </button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {posts.map((post, i) => {
                const st = STATUS_STYLE[post.status] || STATUS_STYLE.draft
                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.04 }}
                    className="glass rounded-2xl p-5 flex items-start gap-4"
                  >
                    {post.media_url && (
                      <img src={post.media_url} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-slate-200 text-sm line-clamp-2">{post.caption}</p>

                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {/* Status badge */}
                        <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full" style={{ background: `${st.color}15`, color: st.color }}>
                          {st.icon} {post.status}
                        </span>

                        {/* Platforms */}
                        {post.platform_posts.map(pp => (
                          <span key={pp.id} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
                            {pp.platform}
                          </span>
                        ))}

                        {post.scheduled_time && (
                          <span className="text-xs text-slate-500">
                            📅 {new Date(post.scheduled_time).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      {(post.status === 'draft' || post.status === 'failed') && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => publishPost(post.id)}
                          className="p-2 rounded-xl text-indigo-400 hover:bg-indigo-500/10 transition-colors border border-indigo-500/20"
                          title="Hozir nashr qilish"
                        >
                          <Send size={16} />
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => deletePost(post.id)}
                        className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="O'chirish"
                      >
                        <Trash2 size={16} />
                      </motion.button>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
