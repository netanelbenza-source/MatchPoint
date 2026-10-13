import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api, ApiError, readSession } from '../lib/api'
import type { Session } from '../lib/types'
import { Brand } from '../components/FloatingNavbar'
import { LanguageToggle } from '../components/LanguageToggle'
import { useI18n } from '../lib/i18n'
import { AnimatedImageSliderBox } from '../components/AnimatedImageSliderBox'
import { PasswordField } from '../components/PasswordField'
import { Field, Notice } from '../components/ui'
import { cn } from '../lib/utils'

export function AuthView({ onEnter }: { onEnter: (session: Session) => void }) {
  const { tr, message } = useI18n()
  const location = useLocation()
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'code'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const requested = (location.state as { mode?: string } | null)?.mode
    if (requested === 'register') setMode('register')
  }, [location.state])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      if (mode === 'forgot') {
        const result = await api<{ message: string }>('/api/auth/forgot-password', null, {
          method: 'POST',
          body: JSON.stringify({ email }),
        })
        setNotice(message(result.message))
        return
      }
      if (mode === 'code') {
        await api('/api/auth/verify-email', null, {
          method: 'POST',
          body: JSON.stringify({ email, code }),
        })
        setMode('login')
        setCode('')
        setNotice(tr('האימייל אומת. אפשר להתחבר.', 'Your email is verified. You can log in.'))
        return
      }
      if (mode === 'register') {
        await api('/api/auth/register', null, {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        })
        setMode('code')
        setCode('')
        setNotice(tr('שלחנו קוד בן 6 ספרות למייל. באייפון מקלידים אותו כאן, בלי לפתוח את הקישור.', 'We sent a 6-digit code. On iPhone, type it here instead of opening the link.'))
        return
      }
      const result = await api<{ token: string }>('/api/auth/login', null, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      onEnter(readSession(result.token))
    } catch (caught) {
      setError(caught instanceof ApiError ? message(caught.message) : tr('לא הצלחנו להתחבר', 'We could not sign you in'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative min-h-screen">
      <header className="fixed inset-x-0 top-4 z-40 px-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-white/80 bg-white/80 px-5 py-3.5 shadow-card backdrop-blur-xl sm:px-7">
          <Brand large />
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Link to="/about" className="rounded-full px-4 py-2 text-sm font-bold text-navy">
              {tr('אודותינו', 'About us')}
            </Link>
            <button
              type="button"
              className={cn('rounded-full px-4 py-2 text-sm font-bold', mode === 'register' ? 'bg-navy text-white' : 'text-navy')}
              onClick={() => { setMode('register'); setError(''); setNotice('') }}
            >
              {tr('הרשמה', 'Sign up')}
            </button>
            <button
              type="button"
              className={cn(
                'rounded-full px-4 py-2 text-sm font-bold shadow-sm',
                mode === 'login' || mode === 'forgot' || mode === 'code' ? 'bg-white text-navy ring-1 ring-navy/10' : 'text-navy',
              )}
              onClick={() => { setMode('login'); setError(''); setNotice('') }}
            >
              {tr('התחברות', 'Log in')}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-4 pb-16 pt-40 lg:grid-cols-2">
        <motion.section
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="order-2 lg:order-1"
        >
          <div className="glass-copy">
            <p className="text-sm font-bold text-coral">MATCHPOINT</p>
            <h1 className="mt-3 text-4xl font-black leading-tight text-navy sm:text-5xl">{tr('שנתחיל?', 'Shall we begin?')}</h1>
            <p className="mt-3 text-lg leading-8 text-ink">{tr('הכנס/י אימייל וסיסמה. ההתאמה נבדקת לשני הצדדים.', 'Enter your email and password. Compatibility is checked both ways.')}</p>
          </div>
          <form className="panel mt-8 grid gap-4 rounded-[2rem] p-6 sm:p-8" onSubmit={submit}>
            <Field label={tr('אימייל', 'Email')}>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required readOnly={mode === 'code'} />
            </Field>
            {mode === 'code' ? (
              <Field label={tr('קוד אימות', 'Verification code')}>
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                />
              </Field>
            ) : null}
            {mode === 'forgot' || mode === 'code' ? null : (
              <PasswordField
                label={tr('סיסמה', 'Password')}
                value={password}
                onChange={setPassword}
                minLength={mode === 'register' ? 8 : 1}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              />
            )}
            {mode === 'code' ? (
              <button
                type="button"
                className="w-fit text-sm font-bold text-navy"
                onClick={() => { setMode('login'); setError(''); setNotice(''); setCode('') }}
              >
                {tr('חזרה להתחברות', 'Back to login')}
              </button>
            ) : null}
            {mode === 'login' ? (
              <button
                type="button"
                className="w-fit text-sm font-bold text-navy"
                onClick={() => { setMode('forgot'); setError(''); setNotice('') }}
              >
                {tr('שכחתי סיסמה', 'Forgot password')}
              </button>
            ) : null}
            {mode === 'forgot' ? (
              <button
                type="button"
                className="w-fit text-sm font-bold text-navy"
                onClick={() => { setMode('login'); setError(''); setNotice('') }}
              >
                {tr('חזרה להתחברות', 'Back to login')}
              </button>
            ) : null}
            {notice ? <p className="rounded-2xl bg-navy-soft px-4 py-3 text-sm font-semibold text-navy">{notice}</p> : null}
            {error ? <Notice>{error}</Notice> : null}
            <button className="btn btn-primary mt-2 w-full text-lg" disabled={busy}>
              {busy ? tr('רגע...', 'One moment...') : mode === 'code' ? tr('אימות הקוד', 'Verify code') : mode === 'forgot' ? tr('שליחת קישור לאיפוס', 'Send reset link') : mode === 'login' ? tr('כניסה', 'Log in') : tr('יצירת חשבון וכניסה', 'Create account')}
            </button>
          </form>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08 }}
          className="order-1 flex w-full justify-center py-6 lg:order-2 lg:min-h-[28rem] lg:items-center"
        >
          <AnimatedImageSliderBox />
        </motion.section>
      </main>
    </div>
  )
}
