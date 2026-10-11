import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { api, ApiError, readSession } from '../lib/api'
import type { Session } from '../lib/types'
import { Brand } from '../components/FloatingNavbar'
import { Field, Notice } from '../components/ui'
import { cn } from '../lib/utils'

const FEATURES = [
  'התאמה הדדית, לא רק חד-צדדית',
  'ציון עם הסבר לכל קריטריון',
  'שדכן מקושר לכל פרופיל',
  'שיחה חופשית עם עוזר ההתאמות',
]

export function AuthView({ onEnter }: { onEnter: (session: Session) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (mode === 'register') {
        await api('/api/auth/register', null, {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        })
      }
      const result = await api<{ token: string }>('/api/auth/login', null, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      onEnter(readSession(result.token))
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'לא הצלחנו להתחבר')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative min-h-screen">
      <header className="fixed inset-x-0 top-4 z-40 px-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-white/80 bg-white/80 px-5 py-3.5 shadow-card backdrop-blur-xl sm:px-7">
          <Brand large />
          <div className="flex gap-2">
            <button
              type="button"
              className={cn('rounded-full px-4 py-2 text-sm font-bold', mode === 'register' ? 'bg-navy text-white' : 'text-navy')}
              onClick={() => setMode('register')}
            >
              הרשמה
            </button>
            <button
              type="button"
              className={cn(
                'rounded-full px-4 py-2 text-sm font-bold shadow-sm',
                mode === 'login' ? 'bg-white text-navy ring-1 ring-navy/10' : 'text-navy',
              )}
              onClick={() => setMode('login')}
            >
              כניסה לרשומים
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
            <h1 className="mt-3 text-4xl font-black leading-tight text-navy sm:text-5xl">שנתחיל?</h1>
            <p className="mt-3 text-lg leading-8 text-ink">הכנס/י אימייל וסיסמה. ההתאמה נבדקת לשני הצדדים.</p>
          </div>
          <form className="panel mt-8 grid gap-4 rounded-[2rem] p-6 sm:p-8" onSubmit={submit}>
            <Field label="אימייל">
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </Field>
            <Field label="סיסמה">
              <input
                type="password"
                minLength={mode === 'register' ? 8 : 1}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </Field>
            {error ? <Notice>{error}</Notice> : null}
            <button className="btn btn-primary mt-2 w-full text-lg" disabled={busy}>
              {busy ? 'רגע...' : mode === 'login' ? 'כניסה' : 'יצירת חשבון וכניסה'}
            </button>
          </form>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08 }}
          className="relative order-1 mx-auto w-full max-w-md lg:order-2"
        >
          <div className="h-[34rem]" />
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="absolute top-8 start-6 rounded-full bg-coral px-5 py-3 text-lg font-black text-white shadow-card"
          >
            התאמה לשני הצדדים
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="absolute -bottom-2 start-4 end-4 rounded-[1.75rem] bg-navy p-6 text-white shadow-card"
          >
            <ul className="grid gap-3">
              {FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm font-semibold leading-6">
                  <Check className="mt-0.5 shrink-0" size={18} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.section>
      </main>
    </div>
  )
}
