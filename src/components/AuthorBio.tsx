import { Link } from 'react-router-dom';
import { Linkedin } from 'lucide-react';

export default function AuthorBio() {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <img 
        src="/images/author.jpg" 
        alt="Jonathan Haas" 
        className="w-6 h-6 rounded-full object-cover"
      />
      <span>Product Manager at Vanta</span>
      <a 
        href="https://www.linkedin.com/in/haasonsaas" 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-primary hover:text-primary/80"
      >
        <Linkedin size={14} />
      </a>
    </div>
  );
} 