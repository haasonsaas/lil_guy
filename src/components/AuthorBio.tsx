import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Linkedin } from 'lucide-react';

export default function AuthorBio() {
  return (
    <div className="bg-gradient-to-br from-primary/5 to-background p-6 rounded-lg border border-primary/20 shadow-sm">
      <div className="flex items-start gap-4">
        <img 
          src="/images/author.jpg" 
          alt="Jonathan Haas" 
          className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
        />
        <div>
          <h3 className="font-semibold text-lg mb-1">Jonathan Haas</h3>
          <p className="text-muted-foreground text-sm mb-3">
            Product Manager at Vanta, passionate about building great products and writing about technology, design, and AI.
          </p>
          <div className="flex gap-2">
            <Link to="/about">
              <Button variant="outline" size="sm" className="text-xs">
                About
              </Button>
            </Link>
            <a 
              href="https://www.linkedin.com/in/haasonsaas" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm" className="text-xs flex items-center gap-1">
                <Linkedin size={14} />
                LinkedIn
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 