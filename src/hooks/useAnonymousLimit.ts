import { useQuery } from '@tanstack/react-query'

const baseUrl = import.meta.env.VITE_API_BASE_URL as string

/**
 * Fetches the anonymous plan's daily_limit from the backend.
 *
 * Returns:
 *   number  — the configured daily limit
 *   null    — explicitly unlimited (daily_limit IS null in the DB, meaning no cap)
 *
 * Throws (React Query error state) on network failure or non-OK response.
 * Never silently substitutes 3 for a legitimate null — that would misrepresent
 * an unlimited plan to users.
 *
 * @param enabled  Set to false when the input form isn't visible (e.g. while a
 *                 score result is being shown) to avoid wasting the freshness
 *                 window with a network request the user can't see.
 */
export function useAnonymousLimit({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery<number | null>({
    queryKey: ['anonymous-limit'],
    enabled,
    queryFn: async () => {
      // Public endpoint — no admin secret required.
      // cache:'no-store' prevents browser/CDN from serving a stale response
      // after the admin updates the limit.
      const res = await fetch(`${baseUrl}/api/config/anonymous-limit`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Could not fetch anonymous limit')
      const data = await res.json() as { daily_limit: number | null; updated_at?: string }
      const limit = data.daily_limit

      // null is a valid value — it means "Unlimited" in the DB.
      // Propagate it as null so the UI can display "Unlimited free lookups / day"
      // rather than silently showing a wrong number.
      if (limit === null) return null

      if (!Number.isFinite(limit)) {
        // Unexpected shape — log and treat as unlimited rather than showing garbage.
        console.warn('[useAnonymousLimit] Received non-finite limit value:', limit, '— treating as unlimited')
        return null
      }

      return limit
    },
    // staleTime: 60s — keeps the value fresh enough that normal browsing
    // doesn't hammer the endpoint on every render.
    // invalidateQueries() in PlanConfigs overrides this so admin saves
    // cause an immediate refetch regardless.
    staleTime: 60_000,
    retry: false,
  })
}
