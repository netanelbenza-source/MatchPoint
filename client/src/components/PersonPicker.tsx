import { useEffect, useRef, useState } from 'react'
import type { EngagementCandidate } from '../lib/types'
import { useI18n } from '../lib/i18n'
import { Field } from './ui'

function fullName(person: EngagementCandidate) {
  return [person.firstName, person.lastName].filter(Boolean).join(' ')
}

export function PersonPicker({
  label,
  people,
  value,
  onChange,
  emptyList,
}: {
  label: string
  people: EngagementCandidate[]
  value: string
  onChange: (userId: string) => void
  emptyList: string
}) {
  const { tr } = useI18n()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const selected = people.find((person) => person.userId === value)
  const needle = query.trim()
  const visible = people.filter((person) => fullName(person).includes(needle))

  useEffect(() => {
    if (!open) return
    searchRef.current?.focus()
    function onPointerDown(event: PointerEvent) {
      if (!(event.target instanceof Node)) return
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  function choose(userId: string) {
    onChange(userId)
    setQuery('')
    setOpen(false)
  }

  return (
    <Field label={label}>
      <div className="person-picker" ref={rootRef}>
        <button
          type="button"
          className="person-picker-value"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          {selected ? `${fullName(selected)} · ${selected.age} · ${selected.city}` : ''}
        </button>
        {open ? (
          <div className="person-picker-menu">
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={tr('חיפוש לפי שם', 'Search by name')}
              aria-label={tr('חיפוש לפי שם', 'Search by name')}
            />
            {people.length === 0 ? <p className="px-3 py-2 text-sm text-muted">{emptyList}</p> : null}
            {people.length > 0 && visible.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted">{tr('אין תוצאות', 'No results')}</p>
            ) : null}
            {visible.map((person) => (
              <button
                key={person.userId}
                type="button"
                className="person-picker-option"
                data-on={person.userId === value}
                onClick={() => choose(person.userId)}
              >
                {fullName(person)} · {person.age} · {person.city}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </Field>
  )
}
