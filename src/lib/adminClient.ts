const baseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined

export function getAdminSecret(): string {
  return sessionStorage.getItem('oti_admin_secret') ?? ''
}

export function setAdminSecret(secret: string) {
  sessionStorage.setItem('oti_admin_secret', secret)
}

export function clearAdminSecret() {
  sessionStorage.removeItem('oti_admin_secret')
}

/** Callback set by Admin.tsx to auto-lock the UI on a 401. */
let onUnauthorized: (() => void) | null = null

export function registerUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn
}

function getBaseUrl(): string {
  if (!baseUrl) {
    throw new Error(
      'VITE_API_BASE_URL is not configured. The admin panel cannot connect to the backend.',
    )
  }
  return baseUrl
}

export async function adminFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const secret = getAdminSecret()
  const res = await fetch(`${getBaseUrl()}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-secret': secret,
      ...(options.headers ?? {}),
    },
  })

  if (res.status === 401) {
    clearAdminSecret()
    onUnauthorized?.()
    throw new Error('Unauthorized — session cleared.')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`)
  }

  const text = await res.text()
  try {
    return (text ? JSON.parse(text) : {}) as T
  } catch {
    throw new Error('Unexpected response from server — received non-JSON. Check VITE_API_BASE_URL.')
  }
}

/**
 * Probe the backend to validate a candidate secret.
 * Returns true only if the backend responds with valid JSON from the OTI API.
 * A plain 200 from Vercel's SPA catch-all (which returns HTML) is rejected.
 */
export async function probeAdminSecret(candidate: string): Promise<boolean> {
  if (!baseUrl) return false
  try {
    const res = await fetch(`${baseUrl}/api/admin/stats`, {
      headers: { 'x-admin-secret': candidate },
    })
    if (res.status === 401) return false
    if (!res.ok) return false
    // Verify the response is actually JSON from the OTI backend,
    // not an HTML page (e.g. Vercel's SPA catch-all returning index.html with 200)
    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json')) return false
    const data = await res.json() as Record<string, unknown>
    // Must have at least one expected field from the stats response
    return 'today_requests' in data || 'total_keys' in data
  } catch {
    return false
  }
}
