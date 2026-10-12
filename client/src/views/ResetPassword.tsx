import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import { LanguageToggle } from '../components/LanguageToggle'
import { PasswordField } from '../components/PasswordField'
import { Notice } from '../components/ui'
import { useI18n } from '../lib/i18n'

export function ResetPassword() {
  const { tr, message } = useI18n()
  const { token } = useParams()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (password !== confirm) {
      setError(tr('הסיסמאות לא תואמות.', 'The passwords do not match.'))
      return
    }
    setBusy(true)
    try {
      await api('/api/auth/reset-password', null, {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      })
      setDone(true)
    } catch (caught) {
      setError(caught instanceof ApiError ? message(caught.message) : tr('לא הצלחנו לעדכן את הסיסמה', 'We could not update the password'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
      <div className="panel rounded-[2rem] p-6 sm:p-8">
        <div className="mb-4 flex justify-end"><LanguageToggle /></div>
        <p className="text-sm font-bold text-coral">MATCHPOINT</p>
        <h1 className="display mt-4 text-4xl leading-tight text-navy">{tr('סיסמה חדשה', 'New password')}</h1>
        {done ? (
          <>
            <p className="mt-4 text-lg leading-8 text-ink">{tr('הסיסמה עודכנה. אפשר להתחבר.', 'The password was updated. You can log in.')}</p>
            <Link to="/" className="btn btn-primary mt-8 inline-flex">
              {tr('התחברות', 'Log in')}
            </Link>
          </>
        ) : (
          <form className="mt-6 grid gap-4" onSubmit={submit}>
            <PasswordField label={tr('סיסמה חדשה', 'New password')} value={password} onChange={setPassword} minLength={8} autoComplete="new-password" />
            <PasswordField label={tr('אימות סיסמה', 'Confirm password')} value={confirm} onChange={setConfirm} minLength={8} autoComplete="new-password" />
            {error ? <Notice>{error}</Notice> : null}
            <button className="btn btn-primary mt-2 w-full text-lg" disabled={busy}>
              {busy ? tr('רגע...', 'One moment...') : tr('שמירת סיסמה', 'Save password')}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
