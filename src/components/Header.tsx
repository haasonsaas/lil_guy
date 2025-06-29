import { Link } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'
import { Button } from './ui/button'
import { useState } from 'react'
import { Menu, X, Search } from 'lucide-react'
import SmartSearch from './SmartSearch'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">
                JH
              </span>
            </div>
            <span className="font-display text-lg font-medium text-foreground">
              Jonathan Haas
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/about"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </Link>
            <Link
              to="/blog"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Articles
            </Link>
            <Link
              to="/uses"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Uses
            </Link>
            <Link
              to="/experiments"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Experiments
            </Link>
            <Link to="/newsletter">
              <Button variant="default" size="sm" className="font-medium">
                Subscribe
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <Search size={16} />
              <span className="hidden lg:inline">Search</span>
              <kbd className="hidden lg:inline-flex h-5 px-1.5 text-xs font-mono border border-border rounded bg-muted text-muted-foreground">
                ⌘K
              </kbd>
            </Button>
            <ThemeToggle />
          </nav>

          {/* Mobile menu button */}
          <div className="flex items-center gap-4 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(true)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Search size={18} />
            </Button>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="border-t md:hidden">
            <div className="space-y-1 px-2 pb-3 pt-2">
              <Link
                to="/about"
                className="block rounded-md px-3 py-2 text-base font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link
                to="/blog"
                className="block rounded-md px-3 py-2 text-base font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                onClick={() => setIsMenuOpen(false)}
              >
                Blog
              </Link>
              <Link
                to="/uses"
                className="block rounded-md px-3 py-2 text-base font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                onClick={() => setIsMenuOpen(false)}
              >
                Uses
              </Link>
              <Link
                to="/experiments"
                className="block rounded-md px-3 py-2 text-base font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                onClick={() => setIsMenuOpen(false)}
              >
                Experiments
              </Link>
              <Link
                to="/newsletter"
                className="block rounded-md px-3 py-2 text-base font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                onClick={() => setIsMenuOpen(false)}
              >
                Newsletter
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Smart Search Modal */}
      <SmartSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onOpen={() => setIsSearchOpen(true)}
      />
    </header>
  )
}
