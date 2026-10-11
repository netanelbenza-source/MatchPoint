import { useState } from 'react'
import { MatchCard } from '../components/MatchCard'
import { SectionTitle, Toast } from '../components/ui'
import { readFavorites, toggleFavorite, type FavoriteMatch } from '../lib/favorites'
import type { Session } from '../lib/types'

export function FavoritesView({ session }: { session: Session }) {
  const [favorites, setFavorites] = useState<FavoriteMatch[]>(() => readFavorites(session.userId))
  const [toast, setToast] = useState('')

  function onToggle(match: FavoriteMatch) {
    setFavorites(toggleFavorite(session.userId, match))
  }

  return (
    <section>
      <SectionTitle kicker="מועדפים" title="הכרטיסים ששמרת." text="הלב שומר את המועמד בדפדפן הזה. אפשר להסיר אותו מכאן, או לשלוח את הפרטים שלך לשדכן." />
      <Toast message={toast} onDone={() => setToast('')} />
      {favorites.length === 0 ? (
        <p className="page-copy w-fit text-lg text-ink">עוד אין מועדפים. בכרטיס התאמה לחץ על הלב.</p>
      ) : null}
      <div className="grid gap-5">
        {favorites.map((match) => (
          <MatchCard
            key={match.candidateId}
            match={match}
            session={session}
            saved
            onToggleFavorite={() => onToggle(match)}
            onToast={setToast}
          />
        ))}
      </div>
    </section>
  )
}
