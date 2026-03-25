import { useAuthStore } from '@/stores/auth'

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function getAuthToken(): Promise<string | null> {
  const auth = useAuthStore()

  if (auth.staffToken && auth.isTokenExpiringSoon) {
    try {
      await auth.refreshStaffToken()
    } catch {
      auth.clearStaffAuth()
      return null
    }
  }

  return auth.staffToken
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const baseUrl = import.meta.env.VITE_API_BASE
  const url = `${baseUrl}${path}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  const token = await getAuthToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new ApiError(res.status, text)
  }

  if (res.status === 204) return undefined as T

  const text = await res.text()
  const sanitizedJsonText = text.replace(/:\s*(\d{16,})/g, ': "$1"')
  return JSON.parse(sanitizedJsonText) as T
}

export function get<T>(path: string): Promise<T> {
  return request<T>('GET', path)
}

export function post<T>(path: string, body?: unknown): Promise<T> {
  return request<T>('POST', path, body)
}

export function put<T>(path: string, body?: unknown): Promise<T> {
  return request<T>('PUT', path, body)
}

export function patch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>('PATCH', path, body)
}

export function del<T>(path: string): Promise<T> {
  return request<T>('DELETE', path)
}
