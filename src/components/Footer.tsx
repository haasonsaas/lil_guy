import { Github, Twitter, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-background to-muted/10 border-t border-border mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <h3 className="text-xl font-semibold mb-6 font-serif">Haas on SaaS</h3>
            <p className="text-muted-foreground">
              Exploring technology, AI, and the future of software development.
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-6">Links</h3>
            <ul className="grid grid-cols-2 gap-y-3 gap-x-4">
              <li>
                <Link to="/" className="text-foreground/70 hover:text-primary transition-colors hover:underline underline-offset-4 decoration-primary/30 flex items-center gap-1">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-foreground/70 hover:text-primary transition-colors hover:underline underline-offset-4 decoration-primary/30 flex items-center gap-1">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-foreground/70 hover:text-primary transition-colors hover:underline underline-offset-4 decoration-primary/30 flex items-center gap-1">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/uses" className="text-foreground/70 hover:text-primary transition-colors hover:underline underline-offset-4 decoration-primary/30 flex items-center gap-1">
                  Uses
                </Link>
              </li>
              <li>
                <Link to="/reading" className="text-foreground/70 hover:text-primary transition-colors hover:underline underline-offset-4 decoration-primary/30 flex items-center gap-1">
                  Reading
                </Link>
              </li>
              <li>
                <Link to="/tags" className="text-foreground/70 hover:text-primary transition-colors hover:underline underline-offset-4 decoration-primary/30 flex items-center gap-1">
                  Tags
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-foreground/70 hover:text-primary transition-colors hover:underline underline-offset-4 decoration-primary/30 flex items-center gap-1">
                  About
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-6">Connect</h3>
            <div className="flex gap-5">
              <a 
                href="https://github.com/haasonsaas" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-foreground/5 hover:bg-foreground/10 p-3 rounded-full transition-all hover:scale-110 text-foreground/70 hover:text-foreground"
                aria-label="GitHub"
              >
                <Github size={20} />
              </a>
              <a 
                href="https://twitter.com/haasonsaas" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-foreground/5 hover:bg-foreground/10 p-3 rounded-full transition-all hover:scale-110 text-foreground/70 hover:text-foreground"
                aria-label="Twitter"
              >
                <Twitter size={20} />
              </a>
              <a 
                href="https://linkedin.com/in/haasonsaas" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-foreground/5 hover:bg-foreground/10 p-3 rounded-full transition-all hover:scale-110 text-foreground/70 hover:text-foreground"
                aria-label="LinkedIn"
              >
                <Linkedin size={20} />
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-border pt-6 mt-12 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Jonathan Haas. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
