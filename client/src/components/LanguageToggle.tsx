import { useI18n } from '../lib/i18n'
import { cn } from '../lib/utils'

export function LanguageToggle({ className }: { className?: string }) {
  const { lang, setLang } = useI18n()

  return (
    <button
      type="button"
      className={cn('rounded-full px-4 py-2 text-sm font-bold text-navy', className)}
      onClick={() => setLang(lang === 'he' ? 'en' : 'he')}
    >
      {lang === 'he' ? 'English' : 'עברית'}
    </button>
  )
}
