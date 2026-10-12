import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import { useI18n } from '../lib/i18n'
import { LanguageToggle } from '../components/LanguageToggle'
import { Notice, Toast } from '../components/ui'

export function ApproveEngagement({ onLeave }: { onLeave: () => void }) {
  const { tr, message } = useI18n()
  const { engagementId, userId } = useParams()
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  async function approve() {
    if (!engagementId || !userId) return
    setBusy(true)
    setError('')
    try {
      await api('/api/engagements/approve', null, {
        method: 'POST',
        body: JSON.stringify({ engagementId, userId }),
      })
      setDone(true)
      setToast(tr('האישור נקלט. מזל טוב!', 'The approval was received. Congratulations!'))
      window.setTimeout(onLeave, 3200)
    } catch (caught) {
      setError(caught instanceof ApiError ? message(caught.message) : tr('האישור נכשל', 'The approval failed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
      <div className="page-copy">
      <div className="mb-4 flex justify-end"><LanguageToggle /></div>
      <p className="text-sm font-bold text-coral">MATCHPOINT</p>
      <h1 className="display mt-4 text-5xl leading-tight text-navy">{tr('מזל טוב! אשרו את השידוך.', 'Congratulations! Approve the match.')}</h1>
      <p className="mt-4 text-lg leading-8 text-ink">
        {tr('האישור הזה הוא רק שלכם. החשבון נמחק רק אחרי שגם הצד השני מאשר.', 'This approval is only yours. The account is deleted only after the other side approves too.')}
      </p>
      {error ? <div className="mt-6"><Notice>{error}</Notice></div> : null}
      <button className="btn btn-primary mt-8 w-fit" onClick={approve} disabled={busy || done || !engagementId || !userId}>
        {done ? tr('אושר', 'Approved') : busy ? tr('שולח...', 'Sending...') : tr('אישור השידוך', 'Approve match')}
      </button>
      <Toast message={toast} onDone={() => setToast('')} />
      </div>
    </main>
  )
}
