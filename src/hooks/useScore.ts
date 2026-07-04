import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { toApiError, ApiError } from '@/lib/apiError'
import { isKnownChain } from '@/lib/chains'
import type { components } from '@/api/schema.gen'
import type { ScoreMetadata } from '@/lib/types'

type Chain = components['schemas']['Chain']

type ScoreResponseWithMetadata = components['schemas']['ScoreResponse'] & {
  metadata?: ScoreMetadata
}

type ScoreQueryResult =
  | ScoreResponseWithMetadata
  | components['schemas']['CompromisedScoreResponse']

export function useScore(address: string, chain: string) {
  return useQuery({
    queryKey: ['score', chain, address],
    queryFn: async () => {
      if (!isKnownChain(chain)) {
        throw new ApiError(400, `Unsupported chain: "${chain}"`)
      }

      const { data, error, response } = await apiClient.GET('/score/{address}', {
        params: {
          path: { address },
          query: { chain: chain as Chain },
        },
      })

      if (error) {
        throw toApiError(response.status, error)
      }

      return data as ScoreQueryResult
    },
    enabled: Boolean(address && chain),
    retry: false,
  })
}
