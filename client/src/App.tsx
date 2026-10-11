import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { api, readSession } from './lib/api'
import type { Profile, Session } from './lib/types'
import { AppShell } from './components/AppShell'
import { ApproveEngagementView } from './views/ApproveEngagementView'
import { AuthView } from './views/AuthView'
import { ChatView } from './views/ChatView'
import { FavoritesView } from './views/FavoritesView'
import { MatchmakersView } from './views/MatchmakersView'
import { MatchmakerDashboardView } from './views/MatchmakerDashboardView'
import { MatchesView } from './views/MatchesView'
import { PeopleView } from './views/PeopleView'
import { PreferencesView } from './views/PreferencesView'
import { ProfileView } from './views/ProfileView'

const NAV = [
  { to: '/matches', label: 'התאמות' },
  { to: '/favorites', label: 'מועדפים' },
  { to: '/profile', label: 'פרופיל' },
  { to: '/preferences', label: 'העדפות' },
  { to: '/chat', label: 'שיחה' },
  { to: '/matchmakers', label: 'שדכנים' },
  { to: '/people', label: 'אנשים' },
  { to: '/matchmaker', label: 'לוח שדכן', matchmakerOnly: true },
]

function MatchmakerRoute({ role, children }: { role: Session['role']; children: ReactNode }) {
  if (role !== 'matchmaker') return <Navigate to="/matches" replace />
  return children
}

const STORAGE_KEY = 'matchpoint-token'

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [session, setSession] = useState<Session | null>(null)
  const [available, setAvailable] = useState<boolean | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return
    try {
      setSession(readSession(stored))
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    if (!session) return
    api<Profile>(`/api/profiles/user/${session.userId}`, session)
      .then((profile) => setAvailable(profile.isAvailable !== false))
      .catch(() => setAvailable(null))
  }, [session, location.pathname])

  useEffect(() => {
    if (!session) return
    let cancelled = false
    api<{ token: string }>('/api/auth/refresh', session, { method: 'POST' })
      .then((result) => {
        if (cancelled) return
        const next = readSession(result.token)
        if (next.role === session.role) return
        localStorage.setItem(STORAGE_KEY, next.token)
        setSession(next)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [session?.userId])

  function enter(next: Session) {
    localStorage.setItem(STORAGE_KEY, next.token)
    setSession(next)
    navigate(next.role === 'matchmaker' ? '/matchmaker' : '/matches')
  }

  function replaceSession(next: Session) {
    localStorage.setItem(STORAGE_KEY, next.token)
    setSession(next)
  }

  function leave() {
    localStorage.removeItem(STORAGE_KEY)
    setSession(null)
    setAvailable(null)
    navigate('/')
  }

  async function toggleAvailability() {
    if (!session) return
    const profile = await api<Profile>('/api/profiles/me/availability', session, { method: 'PATCH' })
    setAvailable(profile.isAvailable !== false)
  }

  const approvalPath = location.pathname.startsWith('/approve-engagement/')
  const routes = (
    <Routes>
      <Route path="/approve-engagement/:engagementId/:userId" element={<ApproveEngagementView onLeave={leave} />} />
      {session ? <>
      <Route path="/" element={<Navigate to={session.role === 'matchmaker' ? '/matchmaker' : '/matches'} replace />} />
      <Route path="/matches" element={<MatchesView session={session} />} />
      <Route path="/favorites" element={<FavoritesView session={session} />} />
      <Route path="/profile" element={<ProfileView session={session} />} />
      <Route path="/preferences" element={<PreferencesView session={session} />} />
      <Route path="/chat" element={<ChatView session={session} />} />
      <Route path="/matchmakers" element={<MatchmakersView session={session} onSession={replaceSession} />} />
      <Route path="/people" element={<PeopleView session={session} />} />
      <Route path="/matchmaker" element={<MatchmakerRoute role={session.role}><MatchmakerDashboardView session={session} /></MatchmakerRoute>} />
      <Route path="*" element={<Navigate to={session.role === 'matchmaker' ? '/matchmaker' : '/matches'} replace />} />
      </> : null}
    </Routes>
  )

  if (!session && !approvalPath) return <AuthView onEnter={enter} />
  if (!session) return routes

  return (
    <AppShell
      items={NAV.filter((item) => !item.matchmakerOnly || session.role === 'matchmaker')}
      available={available}
      onToggleAvailability={toggleAvailability}
      onLogout={leave}
    >
      {routes}
    </AppShell>
  )
}
