import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import { EDUCATION, GENDERS, LANGUAGES, LIFESTYLES, SECTORS } from '../lib/options'
import type { Preferences, Session } from '../lib/types'
import { Chips, Field, Notice, SectionTitle } from '../components/ui'

const empty = {
  gender: 'Female' as 'Male' | 'Female',
  sector: 'אחר',
  min: 20,
  max: 35,
  cities: '',
  languages: [] as string[],
  education: EDUCATION[0],
  lifestyle: LIFESTYLES[0],
}

export function PreferencesView({ session }: { session: Session }) {
  const navigate = useNavigate()
  const [form, setForm] = useState(empty)
  const [recordId, setRecordId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    api<Preferences>(`/api/preferences/user/${session.userId}`, session)
      .then((record) => {
        if (!active) return
        setRecordId(record._id)
        setForm({
          gender: record.gender,
          sector: record.sector,
          min: record.ageRange.min,
          max: record.ageRange.max,
          cities: (record.cities ?? []).join(', '),
          languages: record.languages ?? [],
          education: record.education,
          lifestyle: record.lifestyle,
        })
      })
      .catch((caught) => {
        if (caught instanceof ApiError && caught.status === 404) return
        if (active) setError(caught instanceof Error ? caught.message : 'טעינה נכשלה')
      })
    return () => {
      active = false
    }
  }, [session])

  async function save(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const payload = {
      gender: form.gender,
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
      setError(caught instanceof ApiError ? caught.message : 'השמירה נכשלה')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      <SectionTitle kicker="העדפות" title="את מי אתה מחפש." text="מגדר הפוך ומגזר נבדקים לפני הציון. אחר פותח את כל המגזרים." />
      <form className="panel grid gap-5 rounded-[2rem] p-6 sm:p-8" onSubmit={save}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="מגדר מבוקש">
            <select value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value as 'Male' | 'Female' })}>
              {GENDERS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </Field>
          <Field label="מגזר מבוקש">
            <select value={form.sector} onChange={(event) => setForm({ ...form, sector: event.target.value })}>
              {SECTORS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
          <Field label="גיל מינימום">
            <input type="number" min={18} max={120} value={form.min} onChange={(event) => setForm({ ...form, min: Number(event.target.value) })} />
          </Field>
          <Field label="גיל מקסימום">
            <input type="number" min={18} max={120} value={form.max} onChange={(event) => setForm({ ...form, max: Number(event.target.value) })} />
          </Field>
          <Field label="מסגרת">
            <select value={form.education} onChange={(event) => setForm({ ...form, education: event.target.value })}>
              {EDUCATION.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
          <Field label="סדר יום">
            <select value={form.lifestyle} onChange={(event) => setForm({ ...form, lifestyle: event.target.value })}>
              {LIFESTYLES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="ערים, מופרדות בפסיק">
          <input value={form.cities} onChange={(event) => setForm({ ...form, cities: event.target.value })} placeholder="ירושלים, בני ברק" />
        </Field>
        <Field label="שפות">
          <Chips options={LANGUAGES} value={form.languages} onChange={(languages) => setForm({ ...form, languages })} />
        </Field>
        {error ? <Notice>{error}</Notice> : null}
        <button className="btn btn-primary w-fit" disabled={busy}>{busy ? 'שומר...' : recordId ? 'עדכון העדפות' : 'שמירת העדפות'}</button>
      </form>
    </section>
  )
}
