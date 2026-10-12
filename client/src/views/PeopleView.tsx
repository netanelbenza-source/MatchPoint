import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useI18n } from '../lib/i18n'
import type { PublicUser, Session } from '../lib/types'
import { Notice, SectionTitle } from '../components/ui'

export function PeopleView({ session }: { session: Session }) {
  const { tr, label, message } = useI18n()
  const statusLabels: Record<string, string> = {
    active: tr('פעיל', 'Active'),
    inactive: tr('לא פעיל', 'Inactive'),
    suspended: tr('מושעה', 'Suspended'),
  }
  const [people, setPeople] = useState<PublicUser[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    api<PublicUser[]>('/api/users', session)
      .then(setPeople)
      .catch((caught) => setError(caught instanceof Error ? message(caught.message) : tr('טעינה נכשלה', 'Loading failed')))
  }, [session])

  return (
    <section>
      <SectionTitle
        kicker={session.role === 'admin' ? tr('ניהול', 'Admin') : tr('קהילה', 'Community')}
        title={session.role === 'admin' ? tr('כל המשתמשים, כולל אימייל.', 'Every user, including email.') : tr('רשימה ציבורית, בלי פרטי כניסה.', 'A public list, without login details.')}
        text={tr('השם מגיע מהפרופיל. מנהל רואה גם אימייל. משתמש רגיל לא רואה אימייל ולא סיסמה.', 'The name comes from the profile. An admin also sees email. A regular user sees neither email nor password.')}
      />
      {error ? <Notice>{error}</Notice> : null}
      <div className="grid gap-3">
        {people.map((person) => {
          const name = [person.firstName, person.lastName].filter(Boolean).join(' ') || tr('משתמש בלי פרופיל', 'User without a profile')
          const details = [person.age, person.city, person.sector ? label(person.sector) : '', person.gender ? label(person.gender) : '']
            .filter(Boolean)
            .join(' · ')
          return (
            <article key={person._id} className="panel flex items-center justify-between gap-4 rounded-[1.4rem] px-5 py-4">
              <div>
                <p className="display text-2xl">{name}</p>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  {[details, person.role === 'admin' ? tr('מנהל', 'Admin') : person.role === 'matchmaker' ? tr('שדכן', 'Matchmaker') : tr('משתמש', 'User'), statusLabels[person.status ?? ''] ?? tr('פעיל', 'Active')]
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
