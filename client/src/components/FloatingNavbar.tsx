import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogOut, Menu, X } from 'lucide-react'
import { cn } from '../lib/utils'

export type NavItem = {
  to: string
  label: string
}

export function Brand({ large = false }: { large?: boolean }) {
  return (
    <span className={cn('flex items-center font-black tracking-tight text-navy', large ? 'gap-3 text-4xl' : 'gap-3 text-[1.65rem]')}>
      <svg width={large ? 44 : 36} height={large ? 28 : 22} viewBox="0 0 28 18" aria-hidden="true">
        <path d="M2 12c4-7 8-7 12 0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M14 12c4-7 8-7 12 0" fill="none" stroke="#ff5d78" strokeWidth="2.2" strokeLinecap="round" />
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
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed inset-x-0 top-4 z-50 px-3 sm:px-4">
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
          <div className="flex items-center gap-2">
            {available !== null ? (
              <button type="button" className="btn btn-ghost hidden px-4 py-2 text-sm sm:inline-flex" onClick={onToggleAvailability}>
                {available ? 'פנוי' : 'לא פנוי'}
              </button>
            ) : null}
            <button type="button" className="btn btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm" onClick={onLogout}>
              <LogOut size={16} />
              יציאה
            </button>
            <button
              type="button"
              className="icon-btn lg:hidden"
              aria-label={open ? 'סגירת תפריט' : 'פתיחת תפריט'}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
        {open ? (
          <div className="mt-2 grid gap-1 border-t border-navy/10 pt-2 lg:hidden">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn('rounded-full px-4 py-2 text-sm font-bold', isActive ? 'bg-navy text-white' : 'text-navy')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        ) : null}
      </motion.nav>
    </div>
  )
}
