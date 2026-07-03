import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/healthz')
      if (error) {
        throw new Error('Failed to reach the OTI API')
      }
      return data
    },
  })
}
