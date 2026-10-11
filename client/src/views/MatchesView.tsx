import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { MatchCard } from '../components/MatchCard'
import { Notice, SectionTitle, Toast } from '../components/ui'
import { api, ApiError } from '../lib/api'
import { readFavorites, toggleFavorite } from '../lib/favorites'
import type { MatchRecord, Session } from '../lib/types'

export function MatchesView({ session }: { session: Session }) {
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
        setError(caught instanceof ApiError ? caught.message : 'לא הצלחנו לחשב התאמות')
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
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <SectionTitle
          kicker="התאמות"
          title="האחוז הוא רק ההתחלה."
          text="כל ציון מפורק לקריטריונים. מי שלא פנוי, לא באותו מגדר ההפוך, או מחוץ למגזר, לא נכנס לחישוב."
        />
      </motion.div>
      <Toast message={toast} onDone={() => setToast('')} />
      {loading ? <p className="page-copy mb-5 w-fit text-ink">מחשבים התאמה הדדית...</p> : null}
      {error ? <Notice>{error}</Notice> : null}
      {!loading && !error && matches.length === 0 ? (
        <p className="rounded-[2rem] bg-white p-8 text-lg text-muted shadow-card">אין עדיין התאמות. ודא שיש פרופיל והעדפות, ושיש מועמדים פנויים.</p>
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
