import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogOut, Menu, X } from 'lucide-react'
import { useI18n } from '../lib/i18n'
import { cn } from '../lib/utils'
import { LanguageToggle } from './LanguageToggle'

export type NavItem = {
  to: string
  label: string
}

export function Brand({ large = false }: { large?: boolean }) {
  return (
    <span className={cn('flex min-w-0 items-center font-black tracking-tight text-navy', large ? 'gap-2 text-2xl sm:gap-3 sm:text-4xl' : 'gap-2 text-xl sm:gap-3 sm:text-[1.65rem]')}>
      <svg className={large ? 'h-5 w-8 shrink-0 sm:h-7 sm:w-11' : 'h-5 w-7 shrink-0 sm:h-[22px] sm:w-9'} viewBox="0 0 28 18" aria-hidden="true">
        <path d="M2 12c4-7 8-7 12 0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M14 12c4-7 8-7 12 0" fill="none" stroke="#c4a36a" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      MatchPoint
    </span>
  )
}

export function FloatingNavbar({
  items,
  available,
  onToggleAvailability,
  onLogout,
}: {
  items: NavItem[]
  available: boolean | null
  onToggleAvailability: () => void
  onLogout: () => void
}) {
  const { tr } = useI18n()
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed inset-x-0 z-50 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-4">
      <motion.nav
        initial={{ y: -18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="mx-auto max-w-6xl rounded-[2rem] border border-white/80 bg-white/80 px-4 py-3.5 shadow-card backdrop-blur-xl sm:px-6"
      >
        <div className="flex items-center justify-between gap-3">
          <Brand />
          <div className="hidden items-center gap-1 lg:flex">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-3 py-2 text-sm font-bold transition',
                    isActive ? 'bg-navy text-white' : 'text-navy/80 hover:bg-navy-soft',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {available !== null ? (
              <button type="button" className="btn btn-ghost hidden shrink-0 px-3 py-2 text-sm lg:inline-flex" onClick={onToggleAvailability}>
                {available ? tr('פנוי', 'Available') : tr('לא פנוי', 'Unavailable')}
              </button>
            ) : null}
            <button type="button" className="btn btn-primary hidden items-center gap-2 px-4 py-2 text-sm lg:inline-flex" onClick={onLogout}>
              <LogOut size={16} />
              {tr('יציאה', 'Log out')}
            </button>
            <LanguageToggle className="px-3" />
            <button
              type="button"
              className="icon-btn lg:hidden"
              aria-label={open ? tr('סגירת תפריט', 'Close menu') : tr('פתיחת תפריט', 'Open menu')}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
        {open ? (
          <div className="mt-2 grid gap-1 border-t border-navy/10 pt-2 lg:hidden">
            {available !== null ? (
              <button type="button" className="rounded-full px-4 py-2 text-start text-sm font-bold text-navy" onClick={onToggleAvailability}>
                {available ? tr('פנוי', 'Available') : tr('לא פנוי', 'Unavailable')}
              </button>
            ) : null}
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn('rounded-full px-4 py-3 text-sm font-bold', isActive ? 'bg-navy text-white' : 'text-navy')
                }
              >
                {item.label}
              </NavLink>
            ))}
            <button type="button" className="rounded-full px-4 py-3 text-start text-sm font-bold text-navy" onClick={onLogout}>
              {tr('יציאה', 'Log out')}
            </button>
          </div>
        ) : null}
      </motion.nav>
    </div>
  )
}
