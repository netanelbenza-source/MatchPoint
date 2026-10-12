import { useEffect, useState } from 'react'
import { api, ApiError } from '../lib/api'
import { useI18n } from '../lib/i18n'
import type { Matchmaker } from '../lib/types'

export function MatchmakerOfTheWeek() {
  const { tr } = useI18n()
  const [matchmaker, setMatchmaker] = useState<Matchmaker | null>(null)

  useEffect(() => {
    let active = true
    api<Matchmaker>('/api/matchmakers/top', null)
      .then((leader) => {
        if (active) setMatchmaker(leader)
      })
      .catch((caught) => {
        if (!active) return
        if (caught instanceof ApiError && caught.status === 404) setMatchmaker(null)
      })
    return () => {
      active = false
    }
  }, [])

  if (!matchmaker) return null

  return (
    <article className="rounded-2xl border border-coral/40 bg-white/85 px-5 py-4 shadow-sm backdrop-blur-sm">
      <p className="text-xs font-bold text-coral">{tr('שדכן השבוע', 'Matchmaker of the week')}</p>
      <h2 className="mt-1 text-lg font-semibold text-navy">{matchmaker.name}</h2>
      <p className="mt-1 text-sm text-muted">
        {matchmaker.phone}
        {matchmaker.email ? ` · ${matchmaker.email}` : ''}
      </p>
      <p className="mt-2 text-sm font-semibold text-navy">{matchmaker.successfulMatches ?? 0} {tr('שידוכים', 'matches')}</p>
    </article>
  )
}
