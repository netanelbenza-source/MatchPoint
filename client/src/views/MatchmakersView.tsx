import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, ApiError, readSession } from '../lib/api'
import type { Matchmaker, Session } from '../lib/types'
import { Field, Notice, SectionTitle } from '../components/ui'

const STORAGE_KEY = 'matchpoint-token'

export function MatchmakersView({
  session,
  onSession,
}: {
  session: Session
  onSession: (next: Session) => void
}) {
  const navigate = useNavigate()
  const [people, setPeople] = useState<Matchmaker[]>([])
  const [top, setTop] = useState<Matchmaker | null>(null)
  const [form, setForm] = useState({ name: '', phone: '', email: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    const [list, leader] = await Promise.all([
      api<Matchmaker[]>('/api/matchmakers', session),
      api<Matchmaker>('/api/matchmakers/top-weekly', session).catch((caught) => {
        if (caught instanceof ApiError && caught.status === 404) return null
        throw caught
      }),
    ])
    setPeople(list)
    setTop(leader)
  }

  useEffect(() => {
    load().catch((caught) => setError(caught instanceof Error ? caught.message : 'טעינה נכשלה'))
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
        navigate('/matchmaker')
        return
      }
      setForm({ name: '', phone: '', email: '' })
      await load()
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'לא נוצר שדכן')
    } finally {
      setBusy(false)
    }
  }

  async function markSuccess(id: string) {
    setError('')
    try {
      await api(`/api/matchmakers/${id}/success`, session, { method: 'POST' })
      await load()
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'העדכון נכשל')
    }
  }

  return (
    <section>
      <SectionTitle kicker="שדכנים" title="מי מייצג את ההתאמה." text="כל פרופיל מקושר לשדכן. פעם בשבוע המונה מתאפס, והמוביל מוצג כאן." />
      {top ? (
        <article className="mb-6 rounded-[2rem] bg-[var(--color-ink)] p-6 text-[var(--color-paper)]">
          <p className="text-sm font-bold text-coral">שדכן השבוע</p>
          <h2 className="display mt-2 text-4xl">{top.name}</h2>
          <p className="mt-2 text-white/70">{top.weeklySuccessCount ?? 0} הצלחות · {top.phone}</p>
        </article>
      ) : null}
      <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
        <div className="grid gap-3">
          {people.map((person) => (
            <article key={person._id} className="panel flex items-center justify-between gap-4 rounded-[1.5rem] px-5 py-4">
              <div>
                <h3 className="text-xl font-semibold">{person.name}</h3>
                <p className="text-sm text-[var(--color-muted)]">{person.phone} · {person.email}</p>
                <p className="text-sm text-[var(--color-muted)]">{person.successfulMatches ?? 0} שידוכים שנסגרו</p>
              </div>
              <button className="btn btn-ghost" onClick={() => markSuccess(person._id)}>הצלחה</button>
            </article>
          ))}
        </div>
        <form className="panel grid h-fit gap-4 rounded-[2rem] p-6" onSubmit={create}>
          <h2 className="display text-3xl">שדכן חדש</h2>
          <Field label="שם">
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </Field>
          <Field label="טלפון">
            <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} required />
          </Field>
          <Field label="אימייל">
            <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          </Field>
          {error ? <Notice>{error}</Notice> : null}
          <button className="btn btn-primary" disabled={busy}>{busy ? 'שומר...' : 'הוספה'}</button>
        </form>
      </div>
    </section>
  )
}
