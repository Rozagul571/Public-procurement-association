import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata: Metadata = {
  title: 'DXIU — Davlat Xaridlari Ishtirokchilari Uyushmasi',
  description: 'Ijtimoiy tarmoqlarni boshqarish platformasi',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e2a3b',
              color: '#e2e8f0',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: '12px',
            },
          }}
        />
      </body>
    </html>
  )
}
