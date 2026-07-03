import createClient from 'openapi-fetch'
import type { paths } from './schema.gen'

const baseUrl = import.meta.env.VITE_API_BASE_URL

if (!baseUrl) {
  throw new Error(
    'VITE_API_BASE_URL is not set. Copy .env.example to .env and set the API base URL.',
  )
}

export const apiClient = createClient<paths>({
  baseUrl: `${baseUrl}/api`,
})
