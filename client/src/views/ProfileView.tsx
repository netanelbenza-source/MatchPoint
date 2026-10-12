import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import { useI18n } from '../lib/i18n'
import { educationForProfileGender, GENDERS, LANGUAGES, lifestyleForProfileGender, SECTORS } from '../lib/options'
import type { Matchmaker, Profile, Session } from '../lib/types'
import { Chips, Field, Notice, SectionTitle } from '../components/ui'

function fitProfileOptions(gender: 'Male' | 'Female', education: string, lifestyle: string) {
  const educations = educationForProfileGender(gender)
  const lifestyles = lifestyleForProfileGender(gender)
  return {
    education: educations.includes(education) ? education : educations[0],
    lifestyle: lifestyles.includes(lifestyle) ? lifestyle : lifestyles[0],
  }
}

const empty = {
  firstName: '',
  age: 25,
  city: '',
  gender: 'Male' as 'Male' | 'Female',
  sector: SECTORS[0],
  matchmakerId: '',
  languages: [] as string[],
  education: educationForProfileGender('Male')[0],
  lifestyle: lifestyleForProfileGender('Male')[0],
  description: '',
}

export function ProfileView({ session }: { session: Session }) {
  const { tr, label, message } = useI18n()
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
          ...fitProfileOptions(profile.gender, profile.education, profile.lifestyle),
          description: profile.description ?? '',
        })
      } catch (caught) {
        if (caught instanceof ApiError && caught.status === 404) return
        if (active) setError(caught instanceof Error ? message(caught.message) : tr('טעינת הפרופיל נכשלה', 'Could not load the profile'))
      }
    }
    load().catch((caught) => setError(caught instanceof Error ? message(caught.message) : tr('טעינה נכשלה', 'Loading failed')))
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
      setError(caught instanceof ApiError ? message(caught.message) : tr('השמירה נכשלה', 'Saving failed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      <SectionTitle
        kicker={tr('פרופיל', 'Profile')}
        title={tr('מי אתה בשידוך.', 'Who you are in a match.')}
        text={tr('הפרטים האלה נבדקים מול ההעדפות של הצד השני. בלי פרופיל אין התאמה.', 'These details are checked against the other side. Without a profile there is no match.')}
      />
      <form className="panel grid gap-5 rounded-[2rem] p-6 sm:p-8" onSubmit={save}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={tr('שם פרטי', 'First name')}>
            <input value={form.firstName} onChange={(event) => set('firstName', event.target.value)} required />
          </Field>
          <Field label={tr('גיל', 'Age')}>
            <input type="number" min={18} max={120} value={form.age} onChange={(event) => set('age', Number(event.target.value))} required />
          </Field>
          <Field label={tr('עיר', 'City')}>
            <input value={form.city} onChange={(event) => set('city', event.target.value)} required />
          </Field>
          <Field label={tr('מגדר', 'Gender')}>
            <select
              value={form.gender}
              onChange={(event) => {
                const gender = event.target.value as 'Male' | 'Female'
                setForm((current) => ({ ...current, gender, ...fitProfileOptions(gender, current.education, current.lifestyle) }))
              }}
            >
              {GENDERS.map((item) => (
                <option key={item.value} value={item.value}>{label(item.value)}</option>
              ))}
            </select>
          </Field>
          <Field label={tr('מגזר', 'Community')}>
            <select value={form.sector} onChange={(event) => set('sector', event.target.value)}>
              {SECTORS.map((item) => (
                <option key={item} value={item}>{label(item)}</option>
              ))}
            </select>
          </Field>
          <Field label={tr('שדכן', 'Matchmaker')}>
            <select value={form.matchmakerId} onChange={(event) => set('matchmakerId', event.target.value)} required>
              <option value="">{tr('בחירת שדכן', 'Choose a matchmaker')}</option>
              {matchmakers.map((maker) => (
                <option key={maker._id} value={maker._id}>{maker.name} · {maker.successfulMatches ?? 0} {tr('שידוכים', 'matches')}</option>
              ))}
            </select>
          </Field>
          <Field label={tr('מסגרת', 'Framework')}>
            <select value={form.education} onChange={(event) => set('education', event.target.value)}>
              {educationForProfileGender(form.gender).map((item) => (
                <option key={item} value={item}>{label(item)}</option>
              ))}
            </select>
          </Field>
          <Field label={tr('סדר יום', 'Daily schedule')}>
            <select value={form.lifestyle} onChange={(event) => set('lifestyle', event.target.value)}>
              {lifestyleForProfileGender(form.gender).map((item) => (
                <option key={item} value={item}>{label(item)}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label={tr('שפות', 'Languages')}>
          <Chips options={LANGUAGES} value={form.languages} onChange={(languages) => set('languages', languages)} />
        </Field>
        <Field label={tr('תיאור חופשי', 'Free description')}>
          <textarea value={form.description} onChange={(event) => set('description', event.target.value)} placeholder={tr('מה חשוב שיידעו לפני שיחה', 'What should they know before a conversation')} />
        </Field>
        {matchmakers.length === 0 ? <Notice>{tr('עוד אין שדכנים. צור שדכן במסך השדכנים, ואז חזור לכאן.', 'There are no matchmakers yet. Create one on the matchmakers screen, then come back.')}</Notice> : null}
        {error ? <Notice>{error}</Notice> : null}
        <button className="btn btn-primary w-fit" disabled={busy}>{busy ? tr('שומר...', 'Saving...') : profileId ? tr('עדכון פרופיל', 'Update profile') : tr('יצירת פרופיל', 'Create profile')}</button>
      </form>
    </section>
  )
}
