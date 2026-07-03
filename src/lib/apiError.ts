export class ApiError extends Error {
  status: number
  details?: string | string[]
  limit?: number
  reset?: string

  constructor(status: number, message: string, extra?: { details?: string | string[]; limit?: number; reset?: string }) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = extra?.details
    this.limit = extra?.limit
    this.reset = extra?.reset
  }
}

interface RawErrorBody {
  error?: string
  details?: string | string[]
  limit?: number
  reset?: string
}

export function toApiError(status: number, body: unknown): ApiError {
  const raw = (body ?? {}) as RawErrorBody

  if (status === 429) {
    if (typeof raw.limit === 'number') {
      return new ApiError(429, 'Daily rate limit exceeded', { limit: raw.limit, reset: raw.reset })
    }
    return new ApiError(429, raw.error ?? 'Too many requests', { details: raw.details })
  }

  if (status === 404) {
    return new ApiError(404, raw.error ?? 'Wallet not found or has no activity')
  }

  if (status === 400) {
    return new ApiError(400, raw.error ?? 'Invalid request', { details: raw.details })
  }

  if (status === 502) {
    return new ApiError(502, raw.error ?? 'Failed to fetch on-chain data', { details: raw.details })
  }

  return new ApiError(status, raw.error ?? 'Something went wrong')
}

export function friendlyErrorMessage(err: unknown): { title: string; message: string } {
  if (err instanceof ApiError) {
    switch (err.status) {
      case 400:
        return { title: 'Invalid request', message: typeof err.details === 'string' ? err.details : Array.isArray(err.details) ? err.details.join(', ') : err.message }
      case 404:
        return { title: 'Wallet not found', message: 'No on-chain activity was found for this address on the selected chain.' }
      case 429:
        return {
          title: 'Rate limit reached',
          message: err.limit
            ? `You've hit the anonymous limit of ${err.limit} requests/day. Resets at ${err.reset ? new Date(err.reset).toLocaleString() : 'midnight UTC'}.`
            : typeof err.details === 'string'
              ? err.details
              : 'Too many requests — please wait before retrying.',
        }
      case 502:
        return { title: 'Upstream data unavailable', message: 'The chain data provider timed out or failed. Try again in a moment.' }
      default:
        return { title: 'Service unavailable', message: 'The OTI API could not be reached. Please try again shortly.' }
    }
  }

  return { title: 'Service unavailable', message: 'The OTI API could not be reached. Please try again shortly.' }
}
