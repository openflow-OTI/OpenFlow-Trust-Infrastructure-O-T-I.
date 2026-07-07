import { useQuery } from '@tanstack/react-query'

const baseUrl = import.meta.env.VITE_API_BASE_URL as string

export function useAnonymousLimit() {
  return useQuery({
    queryKey: ['anonymous-limit'],
    queryFn: async () => {
      // Use the public endpoint — not the admin one (which requires x-admin-secret)
      const res = await fetch(`${baseUrl}/api/config/anonymous-limit`)
      if (!res.ok) throw new Error('Could not fetch anonymous limit')
      const data = await res.json() as { daily_limit: number | null }
      const limit = data.daily_limit
      // null means the DB hasn't been explicitly set yet — fall back to the
      // architectural default of 3 (anonymous plan always rate-limits to 3/day)
      if (limit == null || !Number.isFinite(limit)) return 3
      return limit as number
    },
    // Refresh every 5 minutes so it picks up live DB changes without a redeploy
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}
