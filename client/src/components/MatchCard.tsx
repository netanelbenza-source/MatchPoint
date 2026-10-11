import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { CRITERIA, genderLabel } from '../lib/options'
import type { FavoriteMatch } from '../lib/favorites'
import type { Session } from '../lib/types'

export function MatchCard({
  match,
  session,
  saved,
  onToggleFavorite,
  onToast,
}: {
  match: FavoriteMatch
  session: Session
  saved: boolean
  onToggleFavorite: () => void
  onToast: (message: string) => void
}) {
  const [sending, setSending] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const profile = match.profile

  async function contact() {
    setSending(true)
    try {
      const result = await api<{ message: string; previewUrl?: string | null }>(
        `/api/matches/${match.candidateId}/contact-matchmaker`,
        session,
        { method: 'POST' },
      )
      setPreviewUrl(result.previewUrl || '')
      onToast(result.message || 'הפרטים נשלחו לשדכן')
    } catch (caught) {
      onToast(caught instanceof ApiError ? caught.message : 'שליחת הפרטים נכשלה')
    } finally {
      setSending(false)
    }
  }

  return (
    <motion.article
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className="panel grid gap-6 rounded-[2rem] p-6 md:grid-cols-[8.5rem_1fr]"
    >
      <div className="flex h-28 w-28 items-center justify-center rounded-[1.75rem] bg-navy text-white shadow-card">
        <div>
          <p className="text-4xl font-black leading-none">{match.score}</p>
          <p className="mt-1 text-xs text-white/70">התאמה</p>
        </div>
      </div>
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-3xl font-black text-navy">{profile?.firstName ?? 'מועמד'}</h2>
            <p className="mt-1 text-muted">
              {[profile?.age, profile?.city, profile?.sector, genderLabel(profile?.gender ?? '')].filter(Boolean).join(' · ')}
            </p>
          </div>
          <button
            type="button"
            className="icon-btn"
            data-on={saved}
            aria-pressed={saved}
            aria-label={saved ? 'הסרה מהמועדפים' : 'הוספה למועדפים'}
            onClick={onToggleFavorite}
          >
            <Heart size={18} fill={saved ? 'currentColor' : 'none'} />
          </button>
        </div>
        <p className="mt-3 text-sm font-semibold text-navy/80">{profile?.education} · {profile?.lifestyle}</p>
        {profile?.description ? <p className="mt-4 max-w-2xl leading-7 text-ink/90">{profile.description}</p> : null}
        <div className="mt-5 flex flex-wrap gap-2">
          {match.criteriaResults.map((item) => (
            <span
              key={item.criterion}
              className="rounded-full px-3 py-1 text-sm font-semibold"
              style={{
                background: item.passed ? 'rgba(29,122,77,0.1)' : 'rgba(194,65,74,0.1)',
                color: item.passed ? 'var(--color-ok)' : 'var(--color-bad)',
              }}
            >
              {CRITERIA[item.criterion] ?? item.criterion} · {item.weight}%
            </span>
          ))}
        </div>
        {profile?.matchmaker ? (
          <p className="mt-5 text-sm text-muted">
            שדכן: {profile.matchmaker.name} · {profile.matchmaker.phone}
          </p>
        ) : null}
        <button type="button" className="btn btn-primary mt-5" disabled={sending} onClick={contact}>
          {sending ? 'שולח...' : 'שליחת הפרטים שלי לשדכן שלהם'}
        </button>
        {previewUrl ? (
          <a className="mt-3 block text-sm font-bold text-coral" href={previewUrl} target="_blank" rel="noreferrer">
            צפייה במייל שנשלח
          </a>
        ) : null}
      </div>
    </motion.article>
  )
}
