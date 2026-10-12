import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { useI18n } from '../lib/i18n'
import { CRITERIA } from '../lib/options'
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
  const { tr, label, message } = useI18n()
  const [sending, setSending] = useState(false)
  const profile = match.profile
  const unavailable = profile?.isAvailable === false

  async function contact() {
    setSending(true)
    try {
      const result = await api<{ message: string }>(
        `/api/matches/${match.candidateId}/contact-matchmaker`,
        session,
        { method: 'POST' },
      )
      onToast(message(result.message) || tr('הפרטים נשלחו לשדכן', 'Your details were sent to the matchmaker'))
    } catch (caught) {
      onToast(caught instanceof ApiError ? message(caught.message) : tr('שליחת הפרטים נכשלה', 'Could not send your details'))
    } finally {
      setSending(false)
    }
  }

  return (
    <motion.article
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className={unavailable ? 'panel card-unavailable grid gap-6 rounded-[2rem] p-6 md:grid-cols-[8.5rem_1fr]' : 'panel grid gap-6 rounded-[2rem] p-6 md:grid-cols-[8.5rem_1fr]'}
    >
      <div className="flex h-28 w-28 items-center justify-center rounded-[1.75rem] bg-navy text-white shadow-card">
        <div>
          <p className="text-4xl font-black leading-none">{match.score}</p>
          <p className="mt-1 text-xs text-white/70">{tr('התאמה', 'Match')}</p>
        </div>
      </div>
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-3xl font-black text-navy">{profile?.firstName ?? tr('מועמד', 'Candidate')}</h2>
            <p className="mt-1 text-muted">
              {[profile?.age, profile?.city, profile?.sector ? label(profile.sector) : '', label(profile?.gender ?? '')].filter(Boolean).join(' · ')}
            </p>
          </div>
          <button
            type="button"
            className="icon-btn"
            data-on={saved}
            aria-pressed={saved}
            aria-label={saved ? tr('הסרה מהמועדפים', 'Remove from favorites') : tr('הוספה למועדפים', 'Add to favorites')}
            onClick={onToggleFavorite}
          >
            <Heart size={18} fill={saved ? 'currentColor' : 'none'} />
          </button>
        </div>
        <p className="mt-3 text-sm font-semibold text-navy/80">{label(profile?.education ?? '')} · {label(profile?.lifestyle ?? '')}</p>
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
              {tr(CRITERIA[item.criterion] ?? item.criterion, {
                age: 'Age',
                location: 'City',
                languages: 'Languages',
                education: 'Framework',
                lifestyle: 'Daily schedule',
                additionalCriteria: 'Additional criteria',
              }[item.criterion] ?? item.criterion)} · {item.weight}%
            </span>
          ))}
        </div>
        {profile?.matchmaker ? (
          <p className="mt-5 text-sm text-muted">
            {tr('שדכן', 'Matchmaker')}: {profile.matchmaker.name} · {profile.matchmaker.phone} · {profile.matchmaker.successfulMatches ?? 0} {tr('שידוכים', 'matches')}
          </p>
        ) : null}
        <button type="button" className="btn btn-primary mt-5" disabled={sending} onClick={contact}>
          {sending ? tr('שולח...', 'Sending...') : tr('שליחת הפרטים שלי לשדכן שלהם', 'Send my details to their matchmaker')}
        </button>
      </div>
    </motion.article>
  )
}
