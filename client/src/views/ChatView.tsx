import { useState, type FormEvent } from 'react'
import { api, ApiError } from '../lib/api'
import { useI18n } from '../lib/i18n'
import type { AiMatch, Session } from '../lib/types'
import { Notice, SectionTitle } from '../components/ui'

export function ChatView({ session }: { session: Session }) {
  const { tr, message } = useI18n()
  const [chatMessage, setChatMessage] = useState('')
  const [matches, setMatches] = useState<AiMatch[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [asked, setAsked] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setAsked(true)
    try {
      const result = await api<{ matches: AiMatch[] }>('/api/ai/chat-match', session, {
        method: 'POST',
        body: JSON.stringify({ chatMessage }),
      })
      setMatches(result.matches)
    } catch (caught) {
      setMatches([])
      setError(caught instanceof ApiError ? message(caught.message) : tr('העוזר לא זמין', 'The assistant is unavailable'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      <SectionTitle
        kicker={tr('עוזר', 'Assistant')}
        title={tr('שיחה עם העוזר למציאת התאמה.', 'A conversation with the assistant to find a match.')}
        text={tr('המערכת כבר מסננת מגדר, מגזר וזמינות. ג׳מיני קורא רק את התיאורים החופשיים ומחזיר עד שלוש התאמות.', 'The system already filters gender, community, and availability. Gemini reads only the free descriptions and returns up to three matches.')}
      />
      <form className="panel rounded-[2rem] p-6 sm:p-8" onSubmit={submit}>
        <textarea
          className="min-h-36 w-full resize-y rounded-3xl border border-[var(--color-line)] bg-white p-4 outline-none focus:border-[var(--color-gold)]"
          value={chatMessage}
          onChange={(event) => setChatMessage(event.target.value)}
          placeholder={tr('למשל: מישהי רגועה, לומדת, ופתוחה לגור מחוץ למרכז', 'For example: someone calm, studying, and open to living outside the center')}
          required
        />
        <button className="btn btn-primary mt-4" disabled={busy}>{busy ? tr('קורא תיאורים...', 'Reading descriptions...') : tr('חיפוש לפי השיחה', 'Search from the conversation')}</button>
      </form>
      {error ? <div className="mt-5"><Notice>{error}</Notice></div> : null}
      {asked && !busy && !error && matches.length === 0 ? (
        <p className="page-copy mt-6 w-fit text-ink">{tr('אין תיאור שיושב על הבקשה, או שאין מועמדים אחרי הסינון.', 'No description fits the request, or no candidates remain after filtering.')}</p>
      ) : null}
      <div className="mt-6 grid gap-4">
        {matches.map((match) => (
          <article key={match.id} className="panel rounded-[1.7rem] p-6">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="display text-3xl">{match.firstName}</h2>
              <p className="display text-3xl text-[var(--color-wine)]">{match.matchPercentage}</p>
            </div>
            <p className="mt-3 leading-7">{match.explanation}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
