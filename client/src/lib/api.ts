import type { Session } from './types'

export class ApiError extends Error {
  status: number
  details?: unknown

  constructor(status: number, message: string, details?: unknown) {
    super(message)
    this.status = status
    this.details = details
  }
}

export async function api<T>(path: string, session: Session | null, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body) headers.set('Content-Type', 'application/json')
  if (session) headers.set('Authorization', `Bearer ${session.token}`)

  const response = await fetch(path, { ...options, headers })
  if (response.status === 204) return undefined as T

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = typeof data.message === 'string' ? data.message : 'הבקשה נכשלה'
    throw new ApiError(response.status, message, data.errors)
  }
  return data as T
}

export function readSession(token: string): Session {
  const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
  return {
    token,
    userId: String(payload.userId),
    role: payload.role === 'admin' || payload.role === 'matchmaker' ? payload.role : 'user',
  }
}
