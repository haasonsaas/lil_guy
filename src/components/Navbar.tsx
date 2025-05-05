import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { Menu, X, BookOpen } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

const Navbar = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);
  
  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Insights', path: '/blog' },
    { name: 'About Me', path: '/about' },
    { name: 'Uses', path: '/uses' },
    { name: 'Reading', path: '/reading' },
    { name: 'FAQ', path: '/faq' },
  ];
  
  return (
    <nav className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-lg font-bold">Where Technical Vision Meets Market Reality</span>
            </Link>
          </div>
          
          {/* Desktop menu */}
          {!isMobile && (
            <div className="flex items-center space-x-4">
              {navLinks.map((link) => (
                <Link to={link.path} key={link.name}>
                  <Button
                    variant={location.pathname === link.path ? "default" : "ghost"}
                    className="text-sm"
                  >
                    {link.name}
                  </Button>
                </Link>
              ))}
              <a 
                href="https://sidechannel.ventures" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:opacity-80 transition-opacity"
              >
                <Button variant="ghost" className="text-sm">
                  💰
                </Button>
              </a>
              <ThemeToggle />
            </div>
          )}
          
          {/* Mobile menu button */}
          {isMobile && (
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={toggleMenu}>
                {isMenuOpen ? <X /> : <Menu />}
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMobile && isMenuOpen && (
        <div className="border-t border-border">
          <div className="pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link to={link.path} key={link.name}>
                <Button
                  variant={location.pathname === link.path ? "default" : "ghost"}
                  className="w-full justify-start rounded-none text-left"
                >
                  {link.name}
                </Button>
              </Link>
            ))}
            <a 
              href="https://sidechannel.ventures" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="block"
            >
              <Button
                variant="ghost"
                className="w-full justify-start rounded-none text-left"
              >
                💰
              </Button>
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
