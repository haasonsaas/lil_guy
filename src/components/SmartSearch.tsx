import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Sparkles, Clock, TrendingUp, Book } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllPosts } from '@/utils/blog/postUtils';
import { BlogPost } from '@/types/blog';

interface SearchResult {
  title: string;
  slug: string;
  description: string;
  tags: string[];
  pubDate: string;
  similarity: number;
  excerpt: string;
  readingTime: number;
}

interface SmartSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

// Search logic using actual blog posts
const searchPosts = async (query: string): Promise<SearchResult[]> => {
  if (!query.trim()) return [];
  
  // Simulate API delay for better UX
  await new Promise(resolve => setTimeout(resolve, 200));
  
  try {
    const posts = await getAllPosts();
    const keywords = query.toLowerCase().split(' ').filter(k => k.length > 1);
    
    const results = posts
      .map(post => {
        let score = 0;
        let matchedContext = '';
        
        // Search in title (highest weight)
        const titleMatches = keywords.filter(keyword => 
          post.frontmatter.title.toLowerCase().includes(keyword)
        );
        score += titleMatches.length * 0.4;
        
        // Search in description
        const descMatches = keywords.filter(keyword => 
          post.frontmatter.description?.toLowerCase().includes(keyword)
        );
        score += descMatches.length * 0.3;
        
        // Search in tags
        const tagMatches = keywords.filter(keyword => 
          post.frontmatter.tags.some(tag => tag.toLowerCase().includes(keyword))
        );
        score += tagMatches.length * 0.2;
        
        // Search in content (basic)
        const contentMatches = keywords.filter(keyword => 
          post.content.toLowerCase().includes(keyword)
        );
        score += contentMatches.length * 0.1;
        
        // Generate excerpt from content if match found there
        if (contentMatches.length > 0) {
          const firstMatch = keywords.find(k => post.content.toLowerCase().includes(k));
          if (firstMatch) {
            const index = post.content.toLowerCase().indexOf(firstMatch);
            const start = Math.max(0, index - 50);
            const end = Math.min(post.content.length, index + 100);
            matchedContext = post.content.slice(start, end) + '...';
          }
        }
        
        return {
          title: post.frontmatter.title,
          slug: post.slug,
          description: post.frontmatter.description || '',
          tags: post.frontmatter.tags,
          pubDate: post.frontmatter.pubDate,
          similarity: Math.min(score, 1.0), // Cap at 1.0
          excerpt: matchedContext || post.frontmatter.description || post.content.slice(0, 150) + '...',
          readingTime: Math.ceil(post.content.split(' ').length / 200) // 200 WPM
        };
      })
      .filter(result => result.similarity > 0)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 8);
    
    return results;
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
};

const suggestedQueries = [
  "WebGL experiments",
  "AI workflow", 
  "HDR effects",
  "Fluid dynamics",
  "Creative coding",
  "Security automation",
  "Startup experience"
];

const recentSearches = [
  "liquid metal physics",
  "holographic displays",
  "claude code workflow"
];

export default function SmartSearch({ isOpen, onClose, onOpen }: SmartSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Perform search
  useEffect(() => {
    const performSearch = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const searchResults = await searchPosts(query);
        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < results.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : results.length - 1
          );
          break;
        case 'Enter':
          if (selectedIndex >= 0 && results[selectedIndex]) {
            window.location.href = `/blog/${results[selectedIndex].slug}`;
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onOpen]);

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    inputRef.current?.focus();
  };

  const getSimilarityBadge = (similarity: number) => {
    if (similarity >= 0.9) return { variant: "default" as const, text: "Excellent match" };
    if (similarity >= 0.8) return { variant: "secondary" as const, text: "Good match" };
    return { variant: "outline" as const, text: "Related" };
  };

  const formatReadingTime = (minutes: number) => {
    return `${minutes} min read`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="container max-w-2xl mx-auto pt-24 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="bg-background border-border shadow-2xl">
            {/* Search Input */}
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Search size={20} />
                <Sparkles size={16} className="text-primary" />
              </div>
              <input
                ref={inputRef}
                type="text"
                placeholder="Search with AI understanding..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-lg placeholder:text-muted-foreground"
              />
              <div className="flex items-center gap-2">
                <kbd className="hidden sm:inline-flex h-6 px-2 text-xs font-mono border border-border rounded bg-muted text-muted-foreground">
                  ⌘K
                </kbd>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X size={16} />
                </Button>
              </div>
            </div>

            {/* Search Results */}
            <div ref={resultsRef} className="max-h-96 overflow-y-auto">
              {isSearching && (
                <div className="flex items-center justify-center p-8">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing content...</span>
                  </div>
                </div>
              )}

              <AnimatePresence>
                {results.length > 0 && !isSearching && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-2"
                  >
                    {results.map((result, index) => {
                      const badge = getSimilarityBadge(result.similarity);
                      return (
                        <motion.div
                          key={result.slug}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Link
                            to={`/blog/${result.slug}`}
                            onClick={onClose}
                            className={cn(
                              "block p-3 rounded-lg hover:bg-muted transition-colors",
                              selectedIndex === index && "bg-muted"
                            )}
                          >
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <h3 className="font-medium text-sm line-clamp-2">
                                {result.title}
                              </h3>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Badge variant={badge.variant} className="text-xs">
                                  {Math.round(result.similarity * 100)}%
                                </Badge>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                              {result.excerpt}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {result.tags.slice(0, 2).map(tag => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock size={12} />
                                <span>{formatReadingTime(result.readingTime)}</span>
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* No Results */}
              {!isSearching && query && results.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground mb-4">
                    No semantic matches found for "{query}"
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Try a different query or browse suggested topics below
                  </p>
                </div>
              )}

              {/* Suggestions */}
              {!query && (
                <div className="p-4 space-y-6">
                  {recentSearches.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Clock size={14} className="text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">Recent</span>
                      </div>
                      <div className="space-y-1">
                        {recentSearches.map((search, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick(search)}
                            className="flex items-center gap-3 w-full p-2 text-left text-sm hover:bg-muted rounded-lg transition-colors"
                          >
                            <Search size={14} className="text-muted-foreground" />
                            <span>{search}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp size={14} className="text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Suggested</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {suggestedQueries.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="flex items-center gap-2 p-2 text-left text-sm hover:bg-muted rounded-lg transition-colors"
                        >
                          <Book size={14} className="text-muted-foreground" />
                          <span>{suggestion}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-border bg-muted/30">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Sparkles size={12} className="text-primary" />
                  <span>Semantic search powered by AI</span>
                </div>
                <div className="hidden sm:flex items-center gap-4">
                  <span>↑↓ navigate</span>
                  <span>↵ select</span>
                  <span>esc close</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}