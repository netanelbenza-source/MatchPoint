export type Role = 'user' | 'admin' | 'matchmaker'

export type Session = {
  token: string
  userId: string
  role: Role
}

export type Matchmaker = {
  _id: string
  name: string
  phone: string
  email: string
  weeklySuccessCount?: number
  successfulMatches?: number
}

export type Profile = {
  _id: string
  userId: string
  firstName: string
  age: number
  city: string
  gender: 'Male' | 'Female'
  sector: string
  matchmakerId: string
  languages: string[]
  education: string
  lifestyle: string
  description: string
  isAvailable: boolean
  matchmaker?: Matchmaker | null
}

export type Preferences = {
  _id: string
  userId: string
  gender: 'Male' | 'Female'
  sector: string
  ageRange: { min: number; max: number }
  cities: string[]
  languages: string[]
  education: string
  lifestyle: string
  additionalCriteria?: Record<string, unknown>
}

export type CriterionResult = {
  criterion: string
  weight: number
  passed: boolean
  userMatchesCandidate: boolean
  candidateMatchesUser: boolean
}

export type MatchRecord = {
  _id: string
  userId: string
  candidateId: string
  score: number
  criteriaResults: CriterionResult[]
  profile?: {
    firstName: string
    age: number
    city: string
    gender: string
    sector: string
    languages: string[]
    education: string
    lifestyle: string
    description: string
    isAvailable?: boolean
    matchmaker?: Matchmaker | null
  } | null
}

export type PublicUser = {
  _id: string
  role?: Role
  status?: string
  email?: string
  firstName?: string
  lastName?: string
  age?: number
  city?: string
  sector?: string
  gender?: string
}

export type EngagementCandidate = {
  userId: string
  firstName: string
  lastName?: string
  gender: 'Male' | 'Female'
  age: number
  city: string
}

export type EngagementRecord = {
  _id: string
  matchmakerId: string
  maleId: string
  femaleId: string
  maleApproved: boolean
  femaleApproved: boolean
  status: 'pending' | 'completed'
}

export type AiMatch = {
  id: string
  firstName: string
  matchPercentage: string
  explanation: string
}
