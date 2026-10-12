import { useState } from 'react'
import { MatchCard } from '../components/MatchCard'
import { SectionTitle, Toast } from '../components/ui'
import { readFavorites, toggleFavorite, type FavoriteMatch } from '../lib/favorites'
import { useI18n } from '../lib/i18n'
import type { Session } from '../lib/types'

export function FavoritesView({ session }: { session: Session }) {
  const { tr } = useI18n()
  const [favorites, setFavorites] = useState<FavoriteMatch[]>(() => readFavorites(session.userId))
  const [toast, setToast] = useState('')

  function onToggle(match: FavoriteMatch) {
    setFavorites(toggleFavorite(session.userId, match))
  }

  return (
    <section>
      <SectionTitle
        kicker={tr('מועדפים', 'Favorites')}
        title={tr('הכרטיסים ששמרת.', 'The cards you saved.')}
        text={tr('הלב שומר את המועמד בדפדפן הזה. אפשר להסיר אותו מכאן, או לשלוח את הפרטים שלך לשדכן.', 'The heart saves the candidate in this browser. You can remove them here, or send your details to the matchmaker.')}
      />
      <Toast message={toast} onDone={() => setToast('')} />
      {favorites.length === 0 ? (
        <p className="page-copy w-fit text-lg text-ink">{tr('עוד אין מועדפים. בכרטיס התאמה לחץ על הלב.', 'No favorites yet. On a match card, press the heart.')}</p>
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
