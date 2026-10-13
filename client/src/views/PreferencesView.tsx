import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import { useI18n } from '../lib/i18n'
import { educationForSoughtGender, LANGUAGES, lifestyleForSoughtGender, SECTORS } from '../lib/options'
import type { Preferences, Profile, Session } from '../lib/types'
import { Chips, Field, Notice, SectionTitle } from '../components/ui'

const empty = {
  gender: 'Female' as 'Male' | 'Female',
  sector: 'אחר',
  min: 20,
  max: 35,
  cities: '',
  languages: [] as string[],
  education: educationForSoughtGender('Female')[0],
  lifestyle: lifestyleForSoughtGender('Female')[0],
}

function fitSoughtOptions(gender: 'Male' | 'Female', education: string, lifestyle: string) {
  const educations = educationForSoughtGender(gender)
  const lifestyles = lifestyleForSoughtGender(gender)
  return {
    education: educations.includes(education) ? education : educations[0],
    lifestyle: lifestyles.includes(lifestyle) ? lifestyle : lifestyles[0],
  }
}

export function PreferencesView({ session }: { session: Session }) {
  const { tr, label, message } = useI18n()
  const navigate = useNavigate()
  const [form, setForm] = useState(empty)
  const [recordId, setRecordId] = useState<string | null>(null)
  const [profileGender, setProfileGender] = useState<'Male' | 'Female' | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const soughtGender = profileGender === 'Male' ? 'Female' : profileGender === 'Female' ? 'Male' : null

  useEffect(() => {
    let active = true
    async function load() {
      let profile: Profile
      try {
        profile = await api<Profile>(`/api/profiles/user/${session.userId}`, session)
      } catch (caught) {
        if (caught instanceof ApiError && caught.status === 404) return
        if (active) setError(caught instanceof Error ? message(caught.message) : tr('טעינה נכשלה', 'Loading failed'))
        return
      }
      if (!active) return
      const sought = profile.gender === 'Male' ? 'Female' : 'Male'
      setProfileGender(profile.gender)
      try {
        const record = await api<Preferences>(`/api/preferences/user/${session.userId}`, session)
        if (!active) return
        setRecordId(record._id)
        setForm({
          gender: sought,
          sector: record.sector,
          min: record.ageRange.min,
          max: record.ageRange.max,
          cities: (record.cities ?? []).join(', '),
          languages: record.languages ?? [],
          ...fitSoughtOptions(sought, record.education, record.lifestyle),
        })
      } catch (caught) {
        if (caught instanceof ApiError && caught.status === 404) {
          setForm({ ...empty, gender: sought, ...fitSoughtOptions(sought, empty.education, empty.lifestyle) })
          return
        }
        if (active) setError(caught instanceof Error ? message(caught.message) : tr('טעינה נכשלה', 'Loading failed'))
      }
    }
    load()
    return () => {
      active = false
    }
  }, [session])

  async function save(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const payload = {
      gender: soughtGender ?? form.gender,
      sector: form.sector,
      ageRange: { min: Number(form.min), max: Number(form.max) },
      cities: form.cities.split(',').map((city) => city.trim()).filter(Boolean),
      languages: form.languages,
      education: form.education,
      lifestyle: form.lifestyle,
      additionalCriteria: {},
    }
    try {
      if (recordId) {
        await api(`/api/preferences/${recordId}`, session, { method: 'PUT', body: JSON.stringify(payload) })
      } else {
        const created = await api<Preferences>('/api/preferences', session, {
          method: 'POST',
          body: JSON.stringify({ ...payload, userId: session.userId }),
        })
        setRecordId(created._id)
      }
      navigate('/matches')
    } catch (caught) {
      setError(caught instanceof ApiError ? message(caught.message) : tr('השמירה נכשלה', 'Saving failed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      <SectionTitle
        kicker={tr('חיפוש', 'Search')}
        title={tr('את מי אתה מחפש.', 'Who are you looking for.')}
        text={tr('מגדר הפוך ומגזר נבדקים לפני הציון. אחר פותח את כל המגזרים.', 'Opposite gender and community are checked before the score. Other opens every community.')}
      />
      <form className="panel grid gap-5 rounded-[2rem] p-6 sm:p-8" onSubmit={save}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={tr('מגדר מבוקש', 'Requested gender')}>
            <select value={soughtGender ?? ''} disabled>
              {soughtGender ? <option value={soughtGender}>{label(soughtGender)}</option> : null}
            </select>
          </Field>
          {profileGender ? null : <p className="text-sm text-ink sm:col-span-2">{tr('קודם מלאו מגדר בפרופיל. אחר כך יופיע כאן רק המגדר ההפוך.', 'Fill in a gender on your profile first. Then only the opposite gender appears here.')}</p>}
          <Field label={tr('מגזר מבוקש', 'Requested community')}>
            <select value={form.sector} onChange={(event) => setForm({ ...form, sector: event.target.value })}>
              {SECTORS.map((item) => (
                <option key={item} value={item}>{label(item)}</option>
              ))}
            </select>
          </Field>
          <Field label={tr('גיל מינימום', 'Minimum age')}>
            <input type="number" min={18} max={120} value={form.min} onChange={(event) => setForm({ ...form, min: Number(event.target.value) })} />
          </Field>
          <Field label={tr('גיל מקסימום', 'Maximum age')}>
            <input type="number" min={18} max={120} value={form.max} onChange={(event) => setForm({ ...form, max: Number(event.target.value) })} />
          </Field>
          <Field label={tr('מסגרת', 'Framework')}>
            <select value={form.education} onChange={(event) => setForm({ ...form, education: event.target.value })}>
              {educationForSoughtGender(form.gender).map((item) => (
                <option key={item} value={item}>{label(item)}</option>
              ))}
            </select>
          </Field>
          <Field label={tr('סדר יום', 'Daily schedule')}>
            <select value={form.lifestyle} onChange={(event) => setForm({ ...form, lifestyle: event.target.value })}>
              {lifestyleForSoughtGender(form.gender).map((item) => (
                <option key={item} value={item}>{label(item)}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label={tr('ערים, מופרדות בפסיק', 'Cities, separated by commas')}>
          <input value={form.cities} onChange={(event) => setForm({ ...form, cities: event.target.value })} placeholder={tr('ירושלים, בני ברק', 'Jerusalem, Bnei Brak')} />
        </Field>
        <Field label={tr('שפות', 'Languages')}>
          <Chips options={LANGUAGES} value={form.languages} onChange={(languages) => setForm({ ...form, languages })} />
        </Field>
        {error ? <Notice>{error}</Notice> : null}
        <button className="btn btn-primary w-fit" disabled={busy || !soughtGender}>{busy ? tr('שומר...', 'Saving...') : recordId ? tr('עדכון חיפוש', 'Update search') : tr('שמירת חיפוש', 'Save search')}</button>
      </form>
    </section>
  )
}
