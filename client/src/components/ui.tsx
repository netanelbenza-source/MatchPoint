import { useEffect, useRef, type ReactNode } from 'react'

export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  )
}

export function Notice({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl border border-[var(--color-line)] bg-white/70 px-4 py-3 text-sm text-[var(--color-bad)]">
      {children}
    </p>
  )
}

export function Chips({
  options,
  value,
  onChange,
}: {
  options: readonly string[]
  value: string[]
  onChange: (next: string[]) => void
}) {
  function toggle(option: string) {
    onChange(value.includes(option) ? value.filter((item) => item !== option) : [...value, option])
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button key={option} type="button" className="chip" data-on={value.includes(option)} onClick={() => toggle(option)}>
          {option}
        </button>
      ))}
    </div>
  )
}

export function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(() => onDoneRef.current(), 3600)
    return () => window.clearTimeout(timer)
  }, [message])

  if (!message) return null
  return (
    <div className="toast" role="status">
      {message}
    </div>
  )
}

export function SectionTitle({ kicker, title, text }: { kicker: string; title: string; text: string }) {
  return (
    <header className="page-copy mb-10 max-w-3xl">
      <p className="mb-3 text-sm font-bold text-coral">{kicker}</p>
      <h1 className="display text-4xl leading-tight text-navy sm:text-6xl">{title}</h1>
      <p className="mt-4 max-w-xl text-lg leading-8 text-ink">{text}</p>
    </header>
  )
}
