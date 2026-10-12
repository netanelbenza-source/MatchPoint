import { useEffect, useState, type FormEvent } from 'react'
import { api, ApiError } from '../lib/api'
import { useI18n } from '../lib/i18n'
import type { EngagementCandidate, Session } from '../lib/types'
import { PersonPicker } from '../components/PersonPicker'
import { Notice, SectionTitle, Toast } from '../components/ui'

export function MatchmakerDashboardView({ session }: { session: Session }) {
  const { tr, message } = useI18n()
  const [people, setPeople] = useState<EngagementCandidate[]>([])
  const [maleId, setMaleId] = useState('')
  const [femaleId, setFemaleId] = useState('')
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    api<EngagementCandidate[]>('/api/engagements/candidates', session)
      .then((records) => {
        if (!active) return
        setPeople(records)
      })
      .catch((caught) => {
        if (!active) return
        setError(caught instanceof Error ? message(caught.message) : tr('טעינה נכשלה', 'Loading failed'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [session])

  const males = people.filter((person) => person.gender === 'Male')
  const females = people.filter((person) => person.gender === 'Female')

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api('/api/engagements/request', session, {
        method: 'POST',
        body: JSON.stringify({ maleId, femaleId }),
      })
      setToast(tr('בקשות האישור נשלחו לשני הצדדים', 'Approval requests were sent to both sides'))
      setMaleId('')
      setFemaleId('')
    } catch (caught) {
      setError(caught instanceof ApiError ? message(caught.message) : tr('השליחה נכשלה', 'Sending failed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      <SectionTitle
        kicker={tr('שדכן', 'Matchmaker')}
        title={tr('סגירת שידוך באישור כפול.', 'Close a match with both approvals.')}
        text={tr(
          'בוחרים בחור ובחורה פנויים. כל אחד מקבל קישור אישי. רק אחרי ששניהם מאשרים השידוך נסגר.',
          'Choose an available man and woman. Each gets a personal link. The match closes only after both approve.',
        )}
      />
      <form className="panel grid max-w-xl gap-4 rounded-[2rem] p-6" onSubmit={submit}>
        <PersonPicker
          label={tr('בחור', 'Man')}
          people={males}
          value={maleId}
          onChange={setMaleId}
          emptyList={tr('אין בחור פנוי', 'No available man')}
        />
        <PersonPicker
          label={tr('בחורה', 'Woman')}
          people={females}
          value={femaleId}
          onChange={setFemaleId}
          emptyList={tr('אין בחורה פנויה', 'No available woman')}
        />
        {loading ? <p className="text-sm text-slate-500">{tr('טוען את הכלים...', 'Loading the lists...')}</p> : null}
        {error ? <Notice>{error}</Notice> : null}
        <button className="btn btn-primary" disabled={busy || !maleId || !femaleId}>
          {busy ? tr('שולח...', 'Sending...') : tr('שליחת בקשות אישור', 'Send approval requests')}
        </button>
      </form>
      <Toast message={toast} onDone={() => setToast('')} />
    </section>
  )
}
