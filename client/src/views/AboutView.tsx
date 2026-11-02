import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Brand } from '../components/FloatingNavbar'
import { LanguageToggle } from '../components/LanguageToggle'
import { useI18n } from '../lib/i18n'

export function AboutView({ publicEntry = false }: { publicEntry?: boolean }) {
  const { tr } = useI18n()
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = false
    video.play().catch(() => {
      video.muted = true
      void video.play().catch(() => {})
    })
  }, [])

  const video = (
    <video
      ref={videoRef}
      className="w-full rounded-[2rem] bg-navy"
      src="/about.mp4?v=2"
      autoPlay
      playsInline
      controls
    />
  )

  if (!publicEntry) return video

  return (
    <div className="relative min-h-screen">
      <header className="fixed inset-x-0 z-40 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 rounded-3xl border border-white/80 bg-white/80 px-3 py-2.5 shadow-card backdrop-blur-xl sm:rounded-full sm:px-7 sm:py-3.5">
          <Brand />
          <div className="flex flex-wrap items-center justify-end gap-1">
            <LanguageToggle className="px-3 py-2" />
            <Link to="/about" className="rounded-full bg-navy px-3 py-2 text-sm font-bold text-white">
              {tr('אודותינו', 'About us')}
            </Link>
            <Link to="/login" state={{ mode: 'register' }} className="rounded-full px-3 py-2 text-sm font-bold text-navy">
              {tr('הרשמה', 'Sign up')}
            </Link>
            <Link to="/login" className="rounded-full bg-white px-3 py-2 text-sm font-bold text-navy shadow-sm ring-1 ring-navy/10">
              {tr('התחברות', 'Log in')}
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 pb-[max(4rem,env(safe-area-inset-bottom))] pt-36 sm:pt-40">
        <h1 className="mb-6 text-3xl font-black text-navy sm:text-4xl">{tr('אודותינו', 'About us')}</h1>
        {video}
      </main>
    </div>
  )
}
