import { useState } from 'react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SubscribeProps {
  className?: string;
}

export function Subscribe({ className }: SubscribeProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('https://haas-blog.haasholdings.workers.dev', {
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