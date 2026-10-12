import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { api, readSession } from './lib/api'
import { useI18n } from './lib/i18n'
import type { Profile, Session } from './lib/types'
import { AppShell } from './components/AppShell'
import { ApproveEngagement } from './views/ApproveEngagementView'
import { AuthView } from './views/AuthView'
import { ChatView } from './views/ChatView'
import { FavoritesView } from './views/FavoritesView'
import { MatchmakersView } from './views/MatchmakersView'
import { MatchmakerDashboardView } from './views/MatchmakerDashboardView'
import { MatchesView } from './views/MatchesView'
import { PeopleView } from './views/PeopleView'
import { PreferencesView } from './views/PreferencesView'
import { ProfileView } from './views/ProfileView'
import { ResetPassword } from './views/ResetPassword'
import { VerifyEmail } from './views/VerifyEmail'

function useNav() {
  const { tr } = useI18n()
  return [
    { to: '/matches', label: tr('התאמות', 'Matches') },
    { to: '/favorites', label: tr('מועדפים', 'Favorites') },
    { to: '/profile', label: tr('פרופיל', 'Profile') },
    { to: '/preferences', label: tr('חיפוש', 'Search') },
    { to: '/chat', label: tr('שיחה', 'Chat') },
    { to: '/matchmakers', label: tr('שדכנים', 'Matchmakers') },
    { to: '/people', label: tr('אנשים', 'People') },
    { to: '/matchmaker-dashboard', label: tr('לוח שדכן', 'Matchmaker board'), matchmakerOnly: true },
  ]
}

function MatchmakerRoute({ role, children }: { role: Session['role']; children: ReactNode }) {
  if (role !== 'matchmaker') return <Navigate to="/matches" replace />
  return children
}

const STORAGE_KEY = 'matchpoint-token'

export default function App() {
  const nav = useNav()
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
        if (next.role === 'matchmaker') navigate('/matchmaker-dashboard', { replace: true })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [session?.userId])

  function enter(next: Session) {
    localStorage.setItem(STORAGE_KEY, next.token)
    setSession(next)
    navigate(next.role === 'matchmaker' ? '/matchmaker-dashboard' : '/matches', { replace: true })
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
  const verifyPath = location.pathname.startsWith('/verify-email/')
  const resetPath = location.pathname.startsWith('/reset-password/')
  const routes = (
    <Routes>
      <Route path="/approve-engagement/:engagementId/:userId" element={<ApproveEngagement onLeave={leave} />} />
      <Route path="/verify-email/:token" element={<VerifyEmail />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      {session ? <>
      <Route path="/" element={<Navigate to={session.role === 'matchmaker' ? '/matchmaker-dashboard' : '/matches'} replace />} />
      <Route path="/matches" element={<MatchesView session={session} />} />
      <Route path="/favorites" element={<FavoritesView session={session} />} />
      <Route path="/profile" element={<ProfileView session={session} />} />
      <Route path="/preferences" element={<PreferencesView session={session} />} />
      <Route path="/chat" element={<ChatView session={session} />} />
      <Route path="/matchmakers" element={<MatchmakersView session={session} onSession={replaceSession} />} />
      <Route path="/people" element={<PeopleView session={session} />} />
      <Route path="/matchmaker" element={<Navigate to="/matchmaker-dashboard" replace />} />
      <Route path="/matchmaker-dashboard" element={<MatchmakerRoute role={session.role}><MatchmakerDashboardView key={session.token} session={session} /></MatchmakerRoute>} />
      <Route path="*" element={<Navigate to={session.role === 'matchmaker' ? '/matchmaker-dashboard' : '/matches'} replace />} />
      </> : null}
    </Routes>
  )

  if (!session && !approvalPath && !verifyPath && !resetPath) return <AuthView onEnter={enter} />
  if (!session) return routes

  return (
    <AppShell
      items={nav.filter((item) => !item.matchmakerOnly || session.role === 'matchmaker')}
      available={available}
      onToggleAvailability={toggleAvailability}
      onLogout={leave}
    >
      {routes}
    </AppShell>
  )
}
