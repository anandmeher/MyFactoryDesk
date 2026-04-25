import { QueryClient } from '@tanstack/react-query'

// Defaults per mobile-web-pwa spec § Server state via TanStack Query.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})
