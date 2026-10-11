import type { CriterionResult, MatchRecord } from './types'

const STORAGE_KEY = 'favorites'

export type FavoriteMatch = {
  userId: string
  candidateId: string
  score: number
  criteriaResults: CriterionResult[]
  profile?: MatchRecord['profile']
}

function readAll(): FavoriteMatch[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

export function readFavorites(userId: string) {
  return readAll().filter((item) => item.userId === userId && item.candidateId)
}

export function isFavorite(userId: string, candidateId: string) {
  return readFavorites(userId).some((item) => item.candidateId === candidateId)
}

export function toggleFavorite(userId: string, match: Pick<MatchRecord, 'candidateId' | 'score' | 'criteriaResults' | 'profile'>) {
  const all = readAll()
  const exists = all.some((item) => item.userId === userId && item.candidateId === match.candidateId)
  const next = exists
    ? all.filter((item) => !(item.userId === userId && item.candidateId === match.candidateId))
    : [
        ...all,
        {
          userId,
          candidateId: match.candidateId,
          score: match.score,
          criteriaResults: match.criteriaResults,
          profile: match.profile,
        },
      ]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next.filter((item) => item.userId === userId)
}
