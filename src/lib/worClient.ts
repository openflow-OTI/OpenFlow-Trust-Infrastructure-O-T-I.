const baseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined

function getBase(): string {
  if (!baseUrl) throw new Error('VITE_API_BASE_URL not configured.')
  return baseUrl
}

export interface WORResult<T = Record<string, unknown>> {
  data: T
  status: number
  ok: boolean
}

export async function worFetch<T = Record<string, unknown>>(
  path: string,
  options: RequestInit = {},
): Promise<WORResult<T>> {
  const res = await fetch(`${getBase()}/api${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  })
  const text = await res.text()
  const data: T = text ? (JSON.parse(text) as T) : ({} as T)
  return { data, status: res.status, ok: res.ok }
}
