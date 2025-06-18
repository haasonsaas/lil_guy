import { useState } from 'react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAnalytics } from '@/hooks/useAnalytics';
import analytics from '@/utils/analytics';

interface SubscribeProps {
  className?: string;
  source?: string; // Track where the subscription came from
}

export function Subscribe({ className, source = 'unknown' }: SubscribeProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { trackNewsletterSubscribe } = useAnalytics();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe');
      }

      toast.success('Successfully subscribed!');
      setEmail('');
      
      // Track successful newsletter subscription
      trackNewsletterSubscribe(source);
      
      // Track in analytics that welcome series will be triggered
      analytics.track({
        name: 'welcome_series_triggered',
        properties: {
          source,
          email_hash: btoa(email).substring(0, 8) // Anonymous identifier
        }
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to subscribe');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("w-full max-w-md flex flex-col sm:flex-row gap-2", className)}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        className="flex-1 px-4 py-2 rounded-md border bg-background"
        required
      />
      <Button type="submit" disabled={isLoading} className="whitespace-nowrap">
        {isLoading ? 'Subscribing...' : 'Get the Playbook →'}
      </Button>
    </form>
  );
} 