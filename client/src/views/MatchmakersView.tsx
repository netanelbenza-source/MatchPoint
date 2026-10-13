import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, ApiError, readSession } from '../lib/api'
import { useI18n } from '../lib/i18n'
import type { Matchmaker, Session } from '../lib/types'
import { MatchmakerOfTheWeek } from '../components/MatchmakerOfTheWeek'
import { Field, Notice, SectionTitle } from '../components/ui'

const STORAGE_KEY = 'matchpoint-token'

export function MatchmakersView({
  session,
  onSession,
}: {
  session: Session
  onSession: (next: Session) => void
}) {
  const { tr, message } = useI18n()
  const navigate = useNavigate()
  const [people, setPeople] = useState<Matchmaker[]>([])
  const [form, setForm] = useState({ name: '', phone: '', email: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    setPeople(await api<Matchmaker[]>('/api/matchmakers', session))
  }

  useEffect(() => {
    load().catch((caught) => setError(caught instanceof Error ? message(caught.message) : tr('טעינה נכשלה', 'Loading failed')))
  }, [session])

  async function create(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const created = await api<Matchmaker & { token?: string }>('/api/matchmakers', session, {
        method: 'POST',
        body: JSON.stringify(form),
      })
      if (created.token) {
        localStorage.setItem(STORAGE_KEY, created.token)
        onSession(readSession(created.token))
        navigate('/matchmaker-dashboard')
        return
      }
      setForm({ name: '', phone: '', email: '' })
      await load()
    } catch (caught) {
      setError(caught instanceof ApiError ? message(caught.message) : tr('לא נוצר שדכן', 'The matchmaker was not created'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      <SectionTitle kicker={tr('שדכנים', 'Matchmakers')} title={tr('מי מייצג את ההתאמה.', 'Who represents the match.')} text={tr('כל פרופיל מקושר לשדכן.', 'Every profile is linked to a matchmaker.')} />
      <div className="mb-6 max-w-md">
        <MatchmakerOfTheWeek />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
        <div className="grid gap-3">
          {people.map((person) => (
            <article key={person._id} className="panel flex items-center justify-between gap-4 rounded-[1.5rem] px-5 py-4">
              <div>
                <h3 className="text-xl font-semibold text-navy">{person.name}</h3>
                <p className="text-sm text-[var(--color-muted)]">{person.phone} · {person.email}</p>
                <p className="mt-1 text-sm font-semibold text-coral">{person.successfulMatches ?? 0} {tr('שידוכים', 'matches')}</p>
              </div>
            </article>
          ))}
        </div>
        <form className="panel grid h-fit gap-4 rounded-[2rem] p-6" onSubmit={create}>
          <h2 className="display text-3xl">{tr('שדכן חדש', 'New matchmaker')}</h2>
          <Field label={tr('שם', 'Name')}>
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </Field>
          <Field label={tr('טלפון', 'Phone')}>
            <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} required />
          </Field>
          <Field label={tr('אימייל', 'Email')}>
            <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          </Field>
          {error ? <Notice>{error}</Notice> : null}
          <button className="btn btn-primary" disabled={busy}>{busy ? tr('שומר...', 'Saving...') : tr('הוספה', 'Add')}</button>
        </form>
      </div>
    </section>
  )
}
