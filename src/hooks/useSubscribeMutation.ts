import { useMutation } from '@tanstack/react-query'

interface SubscribePayload {
  email: string
}

interface SubscribeResponse {
  message?: string
}

export function useSubscribeMutation(endpoint = '/api/subscribe') {
  return useMutation<SubscribeResponse, Error, SubscribePayload>({
    mutationFn: async ({ email }) => {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Subscription failed')
      }
      return res.json()
    },
  })
}
