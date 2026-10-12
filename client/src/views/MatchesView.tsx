import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { MatchCard } from '../components/MatchCard'
import { MatchmakerOfTheWeek } from '../components/MatchmakerOfTheWeek'
import { Notice, SectionTitle, Toast } from '../components/ui'
import { api, ApiError } from '../lib/api'
import { useI18n } from '../lib/i18n'
import { readFavorites, toggleFavorite } from '../lib/favorites'
import type { MatchRecord, Session } from '../lib/types'

export function MatchesView({ session }: { session: Session }) {
  const { tr, message } = useI18n()
  const [matches, setMatches] = useState<MatchRecord[]>([])
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setSavedIds(readFavorites(session.userId).map((item) => item.candidateId))
    api<MatchRecord[]>('/api/matches', session)
      .then((records) => {
        if (active) setMatches(records)
      })
      .catch((caught) => {
        if (!active) return
        setError(caught instanceof ApiError ? message(caught.message) : tr('לא הצלחנו לחשב התאמות', 'We could not calculate matches'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [session])

  function onToggle(match: MatchRecord) {
    const next = toggleFavorite(session.userId, match)
    setSavedIds(next.map((item) => item.candidateId))
  }

  return (
    <section>
      <div className="mb-6">
        <MatchmakerOfTheWeek />
      </div>
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <SectionTitle
          kicker={tr('התאמות', 'Matches')}
          title={tr('האחוז הוא רק ההתחלה.', 'The percentage is only the start.')}
          text={tr('כל ציון מפורק לקריטריונים. מי שלא פנוי, לא באותו מגדר ההפוך, או מחוץ למגזר, לא נכנס לחישוב.', 'Every score is broken into criteria. Anyone unavailable, not the opposite gender, or outside the community is left out.')}
        />
      </motion.div>
      <Toast message={toast} onDone={() => setToast('')} />
      {loading ? <p className="page-copy mb-5 w-fit text-ink">{tr('מחשבים התאמה הדדית...', 'Calculating mutual compatibility...')}</p> : null}
      {error ? <Notice>{error}</Notice> : null}
      {!loading && !error && matches.length === 0 ? (
        <p className="rounded-[2rem] bg-white p-8 text-lg text-muted shadow-card">{tr('אין עדיין התאמות. ודא שיש פרופיל והעדפות, ושיש מועמדים פנויים.', 'No matches yet. Make sure you have a profile and search settings, and that candidates are available.')}</p>
      ) : null}
      <div className="grid gap-5">
        {matches.map((match, index) => (
          <motion.div
            key={match.candidateId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.4 }}
          >
            <MatchCard
              match={match}
              session={session}
              saved={savedIds.includes(match.candidateId)}
              onToggleFavorite={() => onToggle(match)}
              onToast={setToast}
            />
          </motion.div>
        ))}
      </div>
    </section>
  )
}
