import { Link } from 'react-router-dom';
import { Linkedin, Twitter } from 'lucide-react';
import { Subscribe } from './Subscribe';

export default function AuthorBio() {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 rounded-lg border bg-card">
      <img 
        src="/images/author.jpg" 
        alt="Jonathan Haas" 
        className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
      />
      <div className="flex-1 space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Jonathan Haas</h3>
          <p className="text-sm text-muted-foreground">
            Product Manager @ Vanta | ex-Snap, DoorDash, Carta
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            I turn hairy B2B roadmaps into products users pay for—and write the playbook as I go.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <a 
            href="https://www.linkedin.com/in/haasonsaas" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Linkedin size={18} />
          </a>
          <a 
            href="https://twitter.com/haasonsaas" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Twitter size={18} />
          </a>
        </div>
      </div>
      <div className="w-full sm:w-auto">
        <Subscribe className="w-full sm:w-auto" />
      </div>
    </div>
  );
} 