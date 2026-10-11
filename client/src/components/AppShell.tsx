import type { ReactNode } from 'react'
import { FloatingNavbar, type NavItem } from './FloatingNavbar'

export function AppShell({
  items,
  available,
  onToggleAvailability,
  onLogout,
  children,
}: {
  items: NavItem[]
  available: boolean | null
  onToggleAvailability: () => void
  onLogout: () => void
  children: ReactNode
}) {
  return (
    <div className="min-h-screen">
      <FloatingNavbar
        items={items}
        available={available}
        onToggleAvailability={onToggleAvailability}
        onLogout={onLogout}
      />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-40 sm:px-6">{children}</main>
    </div>
  )
}
