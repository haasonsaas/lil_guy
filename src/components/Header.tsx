import { Link } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';

export default function Header() {
  return (
    <header className="border-b bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold text-sm">H</span>
            </div>
          </Link>

          <nav className="flex items-center gap-8">
            <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Blog
            </Link>
            <Link to="/tags" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Topics
            </Link>
            <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <Link to="/uses" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Uses
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
} 