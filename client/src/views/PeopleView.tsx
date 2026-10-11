import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { genderLabel } from '../lib/options'
import type { PublicUser, Session } from '../lib/types'
import { Notice, SectionTitle } from '../components/ui'

const STATUS_LABELS: Record<string, string> = {
  active: 'פעיל',
  inactive: 'לא פעיל',
  suspended: 'מושעה',
}

export function PeopleView({ session }: { session: Session }) {
  const [people, setPeople] = useState<PublicUser[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    api<PublicUser[]>('/api/users', session)
      .then(setPeople)
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'טעינה נכשלה'))
  }, [session])

  return (
    <section>
      <SectionTitle
        kicker={session.role === 'admin' ? 'ניהול' : 'קהילה'}
        title={session.role === 'admin' ? 'כל המשתמשים, כולל אימייל.' : 'רשימה ציבורית, בלי פרטי כניסה.'}
        text="השם מגיע מהפרופיל. מנהל רואה גם אימייל. משתמש רגיל לא רואה אימייל ולא סיסמה."
      />
      {error ? <Notice>{error}</Notice> : null}
      <div className="grid gap-3">
        {people.map((person) => {
          const name = [person.firstName, person.lastName].filter(Boolean).join(' ') || 'משתמש בלי פרופיל'
          const details = [person.age, person.city, person.sector, person.gender ? genderLabel(person.gender) : '']
            .filter(Boolean)
            .join(' · ')
          return (
            <article key={person._id} className="panel flex items-center justify-between gap-4 rounded-[1.4rem] px-5 py-4">
              <div>
                <p className="display text-2xl">{name}</p>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  {[details, person.role === 'admin' ? 'מנהל' : person.role === 'matchmaker' ? 'שדכן' : 'משתמש', STATUS_LABELS[person.status ?? ''] ?? 'פעיל']
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                {person.email ? <p className="mt-1 text-sm">{person.email}</p> : null}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
