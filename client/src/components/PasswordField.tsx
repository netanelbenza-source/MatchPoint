import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useI18n } from '../lib/i18n'
import { Field } from './ui'

export function PasswordField({
  label,
  value,
  onChange,
  minLength,
  required = true,
  autoComplete,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  minLength?: number
  required?: boolean
  autoComplete?: string
}) {
  const { tr } = useI18n()
  const [visible, setVisible] = useState(false)

  return (
    <Field label={label}>
      <div className="password-field">
        <input
          type={visible ? 'text' : 'password'}
          minLength={minLength}
          value={value}
          autoComplete={autoComplete}
          required={required}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          className="password-toggle"
          data-keep-focus="true"
          aria-label={visible ? tr('הסתרת סיסמה', 'Hide password') : tr('הצגת סיסמה', 'Show password')}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </Field>
  )
}
