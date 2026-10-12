import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { LanguageToggle } from '../components/LanguageToggle'
import { api, ApiError } from '../lib/api'
import { useI18n } from '../lib/i18n'

const pendingVerifications = new Map<string, Promise<unknown>>()

function verifyOnce(token: string) {
  const existing = pendingVerifications.get(token)
  if (existing) return existing
  const request = api('/api/auth/verify-email', null, {
    method: 'POST',
    body: JSON.stringify({ token }),
  })
  pendingVerifications.set(token, request)
  return request
}

export function VerifyEmail() {
  const { tr, message } = useI18n()
  const { token } = useParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setError(tr('הקישור לא תקין או שפג תוקפו', 'Invalid or expired token'))
      return
    }

    let active = true
    verifyOnce(token)
      .then(() => {
        if (active) setStatus('success')
      })
      .catch((caught) => {
        if (!active) return
        setStatus('error')
        setError(caught instanceof ApiError ? message(caught.message) : tr('הקישור לא תקין או שפג תוקפו', 'Invalid or expired token'))
      })

    return () => {
      active = false
    }
  }, [token])

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
      <div className="page-copy">
        <div className="mb-4 flex justify-end"><LanguageToggle /></div>
        <p className="text-sm font-bold text-coral">MATCHPOINT</p>
        {status === 'loading' ? (
          <h1 className="display mt-4 text-5xl leading-tight text-navy">{tr('מאמתים...', 'Verifying...')}</h1>
        ) : null}
        {status === 'success' ? (
          <>
            <h1 className="display mt-4 text-5xl leading-tight text-navy">{tr('האימייל אומת!', 'Your email has been verified!')}</h1>
            <Link to="/" className="mt-8 inline-flex rounded-full bg-navy px-6 py-3 text-sm font-bold text-white">
              {tr('התחברות', 'Login')}
            </Link>
          </>
        ) : null}
        {status === 'error' ? (
          <>
            <h1 className="display mt-4 text-5xl leading-tight text-navy">{tr('הקישור לא תקין או שפג תוקפו', 'Invalid or expired token')}</h1>
            <p className="mt-4 text-lg leading-8 text-ink">{error}</p>
            <Link to="/" className="mt-8 inline-flex rounded-full bg-navy px-6 py-3 text-sm font-bold text-white">
              {tr('התחברות', 'Login')}
            </Link>
          </>
        ) : null}
      </div>
    </main>
  )
}
