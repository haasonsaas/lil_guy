import { Github, Twitter, Linkedin, ExternalLink, Gamepad2, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import SnakeGame from './SnakeGame';

export default function Footer() {
  const [showSnakeGame, setShowSnakeGame] = useState(false);

  return (
    <footer className="border-t bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-sm text-muted-foreground">
            Thinking in public. AI, systems, leverage—and the cost of chasing them.
          </p>

          <div className="flex items-center gap-4">
            <Link 
              to="/faq"
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="FAQ"
            >
              <HelpCircle className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setShowSnakeGame(true)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Play Snake"
            >
              <Gamepad2 className="w-4 h-4" />
            </button>
            <a 
              href="https://twitter.com/haasonsaas" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Twitter className="w-4 h-4" />
            </a>
            <a 
              href="https://github.com/haasonsaas" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="w-4 h-4" />
            </a>
            <a 
              href="https://linkedin.com/in/haasonsaas" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Linkedin className="w-4 h-4" />
            </a>
            <a 
              href="https://news.ycombinator.com/user?id=haasonsaas" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
      {showSnakeGame && <SnakeGame onClose={() => setShowSnakeGame(false)} />}
    </footer>
  );
}
