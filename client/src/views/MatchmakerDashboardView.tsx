import { useEffect, useState, type FormEvent } from 'react'
import { api, ApiError } from '../lib/api'
import type { EngagementCandidate, Session } from '../lib/types'
import { Field, Notice, SectionTitle, Toast } from '../components/ui'

function candidateLabel(person: EngagementCandidate) {
  const name = [person.firstName, person.lastName].filter(Boolean).join(' ')
  return `${name} · ${person.age} · ${person.city}`
}

export function MatchmakerDashboardView({ session }: { session: Session }) {
  const [people, setPeople] = useState<EngagementCandidate[]>([])
  const [maleId, setMaleId] = useState('')
  const [femaleId, setFemaleId] = useState('')
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api<EngagementCandidate[]>('/api/engagements/candidates', session)
      .then((records) => {
        setPeople(records)
        const males = records.filter((person) => person.gender === 'Male')
        const females = records.filter((person) => person.gender === 'Female')
        setMaleId(males[0]?.userId ?? '')
        setFemaleId(females[0]?.userId ?? '')
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'טעינה נכשלה'))
  }, [session])

  const males = people.filter((person) => person.gender === 'Male')
  const females = people.filter((person) => person.gender === 'Female')

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setPreviewUrls([])
    try {
      const result = await api<{ previewUrls?: string[] }>('/api/engagements/request', session, {
        method: 'POST',
        body: JSON.stringify({ maleId, femaleId }),
      })
      setPreviewUrls(result.previewUrls ?? [])
      setToast('בקשות האישור נשלחו לשני הצדדים')
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'השליחה נכשלה')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      <SectionTitle
        kicker="שדכן"
        title="סגירת שידוך באישור כפול."
        text="בוחרים בחור ובחורה פנויים. כל אחד מקבל קישור אישי. רק אחרי ששניהם מאשרים השידוך נסגר."
      />
      <form className="panel grid max-w-xl gap-4 rounded-[2rem] p-6" onSubmit={submit}>
        <Field label="בחור">
          <select value={maleId} onChange={(event) => setMaleId(event.target.value)} required>
            {males.length === 0 ? <option value="">אין בחור פנוי</option> : null}
            {males.map((person) => (
              <option key={person.userId} value={person.userId}>{candidateLabel(person)}</option>
            ))}
          </select>
        </Field>
        <Field label="בחורה">
          <select value={femaleId} onChange={(event) => setFemaleId(event.target.value)} required>
            {females.length === 0 ? <option value="">אין בחורה פנויה</option> : null}
            {females.map((person) => (
              <option key={person.userId} value={person.userId}>{candidateLabel(person)}</option>
            ))}
          </select>
        </Field>
        {error ? <Notice>{error}</Notice> : null}
        <button className="btn btn-primary" disabled={busy || !maleId || !femaleId}>
          {busy ? 'שולח...' : 'שליחת בקשות אישור'}
        </button>
        {previewUrls.length > 0 ? (
          <div className="grid gap-2 text-sm">
            {previewUrls.map((url) => (
              <a key={url} href={url} target="_blank" rel="noreferrer" className="text-[var(--color-wine)]">
                צפייה במייל שנשלח
              </a>
            ))}
          </div>
        ) : null}
      </form>
      <Toast message={toast} onDone={() => setToast('')} />
    </section>
  )
}
