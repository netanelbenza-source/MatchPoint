import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import { EDUCATION, GENDERS, LANGUAGES, LIFESTYLES, SECTORS } from '../lib/options'
import type { Matchmaker, Profile, Session } from '../lib/types'
import { Chips, Field, Notice, SectionTitle } from '../components/ui'

const empty = {
  firstName: '',
  age: 25,
  city: '',
  gender: 'Male' as 'Male' | 'Female',
  sector: SECTORS[0],
  matchmakerId: '',
  languages: [] as string[],
  education: EDUCATION[0],
  lifestyle: LIFESTYLES[0],
  description: '',
}

export function ProfileView({ session }: { session: Session }) {
  const navigate = useNavigate()
  const [form, setForm] = useState(empty)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [matchmakers, setMatchmakers] = useState<Matchmaker[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    async function load() {
      const makers = await api<Matchmaker[]>('/api/matchmakers', session)
      if (!active) return
      setMatchmakers(makers)
      try {
        const profile = await api<Profile>(`/api/profiles/user/${session.userId}`, session)
        if (!active) return
        setProfileId(profile._id)
        setForm({
          firstName: profile.firstName,
          age: profile.age,
          city: profile.city,
          gender: profile.gender,
          sector: profile.sector,
          matchmakerId: profile.matchmakerId,
          languages: profile.languages ?? [],
          education: profile.education,
          lifestyle: profile.lifestyle,
          description: profile.description ?? '',
        })
      } catch (caught) {
        if (caught instanceof ApiError && caught.status === 404) return
        if (active) setError(caught instanceof Error ? caught.message : 'טעינת הפרופיל נכשלה')
      }
    }
    load().catch((caught) => setError(caught instanceof Error ? caught.message : 'טעינה נכשלה'))
    return () => {
      active = false
    }
  }, [session])

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (profileId) {
        await api(`/api/profiles/${profileId}`, session, { method: 'PUT', body: JSON.stringify(form) })
      } else {
        await api<Profile>('/api/profiles', session, {
          method: 'POST',
          body: JSON.stringify({ ...form, userId: session.userId }),
        })
      }
      navigate('/preferences')
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'השמירה נכשלה')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      <SectionTitle kicker="פרופיל" title="מי אתה בשידוך." text="הפרטים האלה נבדקים מול ההעדפות של הצד השני. בלי פרופיל אין התאמה." />
      <form className="panel grid gap-5 rounded-[2rem] p-6 sm:p-8" onSubmit={save}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="שם פרטי">
            <input value={form.firstName} onChange={(event) => set('firstName', event.target.value)} required />
          </Field>
          <Field label="גיל">
            <input type="number" min={18} max={120} value={form.age} onChange={(event) => set('age', Number(event.target.value))} required />
          </Field>
          <Field label="עיר">
            <input value={form.city} onChange={(event) => set('city', event.target.value)} required />
          </Field>
          <Field label="מגדר">
            <select value={form.gender} onChange={(event) => set('gender', event.target.value as 'Male' | 'Female')}>
              {GENDERS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </Field>
          <Field label="מגזר">
            <select value={form.sector} onChange={(event) => set('sector', event.target.value)}>
              {SECTORS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
          <Field label="שדכן">
            <select value={form.matchmakerId} onChange={(event) => set('matchmakerId', event.target.value)} required>
              <option value="">בחירת שדכן</option>
              {matchmakers.map((maker) => (
                <option key={maker._id} value={maker._id}>{maker.name}</option>
              ))}
            </select>
          </Field>
          <Field label="מסגרת">
            <select value={form.education} onChange={(event) => set('education', event.target.value)}>
              {EDUCATION.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
          <Field label="סדר יום">
            <select value={form.lifestyle} onChange={(event) => set('lifestyle', event.target.value)}>
              {LIFESTYLES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="שפות">
          <Chips options={LANGUAGES} value={form.languages} onChange={(languages) => set('languages', languages)} />
        </Field>
        <Field label="תיאור חופשי">
          <textarea value={form.description} onChange={(event) => set('description', event.target.value)} placeholder="מה חשוב שיידעו לפני שיחה" />
        </Field>
        {matchmakers.length === 0 ? <Notice>עוד אין שדכנים. צור שדכן במסך השדכנים, ואז חזור לכאן.</Notice> : null}
        {error ? <Notice>{error}</Notice> : null}
        <button className="btn btn-primary w-fit" disabled={busy}>{busy ? 'שומר...' : profileId ? 'עדכון פרופיל' : 'יצירת פרופיל'}</button>
      </form>
    </section>
  )
}
