import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { toApiError } from '@/lib/apiError'

export function useScoreHistory(address: string, chain: string, enabled: boolean) {
  return useQuery({
    queryKey: ['score-history', chain, address],
    queryFn: async () => {
      const { data, error, response } = await apiClient.GET('/score/{address}/history', {
        params: {
          path: { address },
          query: { chain: chain as never },
        },
      })

      if (error) {
        throw toApiError(response.status, error)
      }

      return data
    },
    enabled: enabled && Boolean(address && chain),
    retry: false,
  })
}
