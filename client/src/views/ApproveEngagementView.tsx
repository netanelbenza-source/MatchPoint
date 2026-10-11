import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import { Notice, Toast } from '../components/ui'

export function ApproveEngagementView({ onLeave }: { onLeave: () => void }) {
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
      setToast('האישור נקלט. מזל טוב!')
      window.setTimeout(onLeave, 3200)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'האישור נכשל')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
      <div className="page-copy">
      <p className="text-sm font-bold text-coral">MATCHPOINT</p>
      <h1 className="display mt-4 text-5xl leading-tight text-navy">מזל טוב! אשרו את השידוך.</h1>
      <p className="mt-4 text-lg leading-8 text-ink">
        האישור הזה הוא רק שלכם. החשבון נמחק רק אחרי שגם הצד השני מאשר.
      </p>
      {error ? <div className="mt-6"><Notice>{error}</Notice></div> : null}
      <button className="btn btn-primary mt-8 w-fit" onClick={approve} disabled={busy || done || !engagementId || !userId}>
        {done ? 'אושר' : busy ? 'שולח...' : 'אישור השידוך'}
      </button>
      <Toast message={toast} onDone={() => setToast('')} />
      </div>
    </main>
  )
}
