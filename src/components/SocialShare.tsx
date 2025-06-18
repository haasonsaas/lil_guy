import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAnalytics } from '@/hooks/useAnalytics';
import { 
  Share2, 
  Twitter, 
  Linkedin, 
  Copy, 
  Check,
  ExternalLink 
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

interface SocialShareProps {
  title: string;
  url: string;
  description?: string;
  className?: string;
  slug?: string; // For analytics tracking
}

export default function SocialShare({ title, url, description, className = "", slug }: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const { trackPostShare } = useAnalytics();

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      // Track copy link action
      if (slug) {
        trackPostShare(slug, 'copy_link');
      }
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const shareToTwitter = () => {
    const text = `${title}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&via=haasonsaas`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    
    // Track Twitter share
    if (slug) {
      trackPostShare(slug, 'twitter');
    }
  };

  const shareToLinkedIn = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(linkedInUrl, '_blank', 'noopener,noreferrer');
    
    // Track LinkedIn share
    if (slug) {
      trackPostShare(slug, 'linkedin');
    }
  };

  const shareToHackerNews = () => {
    const hnUrl = `https://news.ycombinator.com/submitlink?u=${encodeURIComponent(url)}&t=${encodeURIComponent(title)}`;
    window.open(hnUrl, '_blank', 'noopener,noreferrer');
    
    // Track Hacker News share
    if (slug) {
      trackPostShare(slug, 'hackernews');
    }
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    }
  };

  const hasNativeShare = typeof navigator !== 'undefined' && navigator.share;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={`flex items-center gap-2 ${className}`}>
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {hasNativeShare && (
          <>
            <DropdownMenuItem onClick={shareNative} className="flex items-center gap-2 cursor-pointer">
              <Share2 className="h-4 w-4" />
              Share via...
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        
        <DropdownMenuItem onClick={shareToTwitter} className="flex items-center gap-2 cursor-pointer">
          <Twitter className="h-4 w-4" />
          Share on Twitter
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={shareToLinkedIn} className="flex items-center gap-2 cursor-pointer">
          <Linkedin className="h-4 w-4" />
          Share on LinkedIn
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={shareToHackerNews} className="flex items-center gap-2 cursor-pointer">
          <ExternalLink className="h-4 w-4" />
          Submit to Hacker News
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleCopyLink} className="flex items-center gap-2 cursor-pointer">
          {copied ? (
            <>
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-green-600">Link copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy link
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}