import { useState } from 'react'
import { toast } from 'sonner'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useSubscribeMutation } from '@/hooks/useSubscribeMutation'
import { cn } from '@/lib/utils'
import analytics from '@/utils/analytics'
import { Button } from './ui/button'

interface SubscribeProps {
  className?: string
  source?: string // Track where the subscription came from
}

export function Subscribe({ className, source = 'unknown' }: SubscribeProps) {
  const [email, setEmail] = useState('')
  const { trackNewsletterSubscribe } = useAnalytics()
  const { mutate, isPending } = useSubscribeMutation()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    mutate(
      { email },
      {
        onSuccess: () => {
          toast.success('Successfully subscribed!')
          setEmail('')
          trackNewsletterSubscribe(source)
          analytics.track({
            name: 'welcome_series_triggered',
            properties: {
              source,
              email_hash: btoa(email).substring(0, 8),
            },
          })
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('w-full max-w-md flex flex-col sm:flex-row gap-2', className)}
    >
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        className="flex-1 px-4 py-2 rounded-md border bg-background"
        required
      />
      <Button type="submit" disabled={isPending} className="whitespace-nowrap">
        {isPending ? 'Subscribing...' : 'Get the Playbook →'}
      </Button>
    </form>
  )
}
