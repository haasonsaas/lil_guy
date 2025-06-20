import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import BlogCard from '@/components/BlogCard';
import { getAllPosts, getAllTags, calculateReadingTime } from '@/utils/blogUtils';
import { Input } from '@/components/ui/input';
import { Search, ChevronLeft, ChevronRight, Filter, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BlogPost } from '@/types/blog';
import WeeklyPlaybook from '@/components/WeeklyPlaybook';
import SmartSearch from '@/components/SmartSearch';

const POSTS_PER_PAGE = 9;

export default function BlogPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [allTags, setAllTags] = useState<Array<{tag: string; count: number}>>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [selectedYear, setSelectedYear] = useState(searchParams.get("year") || "all");
  const [selectedReadingTime, setSelectedReadingTime] = useState(searchParams.get("readingTime") || "all");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "date-desc");
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(searchParams.get("featured") === "true");
  const [selectedTags, setSelectedTags] = useState<string[]>(
    searchParams.get("tags")?.split(",").filter(Boolean) || []
  );
  const [isSmartSearchOpen, setIsSmartSearchOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const [allPosts, tags] = await Promise.all([
        getAllPosts(),
        getAllTags()
      ]);
      setPosts(allPosts);
      setAllTags(tags);
    };
    loadData();
  }, []);

  useEffect(() => {
    let filtered = [...posts];

    // Text search filter
    const search = searchParams.get("search");
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (post) =>
          post.frontmatter.title.toLowerCase().includes(searchLower) ||
          post.frontmatter.description.toLowerCase().includes(searchLower) ||
          post.content.toLowerCase().includes(searchLower)
      );
    }

    // Legacy tag filter (for backwards compatibility)
    const legacyTag = searchParams.get("tag");
    if (legacyTag) {
      filtered = filtered.filter((post) =>
        post.frontmatter.tags.some((t) => t.toLowerCase() === legacyTag.toLowerCase())
      );
    }

    // Multi-tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter((post) =>
        selectedTags.some(selectedTag =>
          post.frontmatter.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase())
        )
      );
    }

    // Year filter
    if (selectedYear !== "all") {
      filtered = filtered.filter((post) => {
        const postYear = new Date(post.frontmatter.pubDate).getFullYear().toString();
        return postYear === selectedYear;
      });
    }

    // Reading time filter
    if (selectedReadingTime !== "all") {
      filtered = filtered.filter((post) => {
        const readingTime = calculateReadingTime(post.content).minutes;
        switch (selectedReadingTime) {
          case "short": return readingTime <= 3;
          case "medium": return readingTime > 3 && readingTime <= 8;
          case "long": return readingTime > 8;
          default: return true;
        }
      });
    }

    // Featured filter
    if (showFeaturedOnly) {
      filtered = filtered.filter((post) => post.frontmatter.featured);
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.frontmatter.pubDate).getTime() - new Date(a.frontmatter.pubDate).getTime();
        case "date-asc":
          return new Date(a.frontmatter.pubDate).getTime() - new Date(b.frontmatter.pubDate).getTime();
        case "title-asc":
          return a.frontmatter.title.localeCompare(b.frontmatter.title);
        case "title-desc":
          return b.frontmatter.title.localeCompare(a.frontmatter.title);
        case "reading-time-asc":
          return calculateReadingTime(a.content).minutes - calculateReadingTime(b.content).minutes;
        case "reading-time-desc":
          return calculateReadingTime(b.content).minutes - calculateReadingTime(a.content).minutes;
        default:
          return 0;
      }
    });

    setFilteredPosts(filtered);
    setTotalPages(Math.ceil(filtered.length / POSTS_PER_PAGE));
    setCurrentPage(1);
  }, [posts, searchParams, selectedYear, selectedReadingTime, sortBy, showFeaturedOnly, selectedTags]);

  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  );

  // Helper function to update URL parameters
  const updateUrlParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== "all" && value !== "false") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    
    navigate(`?${params.toString()}`, { replace: true });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    updateUrlParams({ search: value || null });
  };

  const handleYearChange = (value: string) => {
    setSelectedYear(value);
    updateUrlParams({ year: value === "all" ? null : value });
  };

  const handleReadingTimeChange = (value: string) => {
    setSelectedReadingTime(value);
    updateUrlParams({ readingTime: value === "all" ? null : value });
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    updateUrlParams({ sort: value === "date-desc" ? null : value });
  };

  const handleFeaturedToggle = () => {
    const newValue = !showFeaturedOnly;
    setShowFeaturedOnly(newValue);
    updateUrlParams({ featured: newValue ? "true" : null });
  };

  const handleTagToggle = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    
    setSelectedTags(newTags);
    updateUrlParams({ tags: newTags.length > 0 ? newTags.join(",") : null });
  };

  const clearFilters = () => {
    setSelectedYear("all");
    setSelectedReadingTime("all");
    setSortBy("date-desc");
    setShowFeaturedOnly(false);
    setSelectedTags([]);
    setSearchInput("");
    
    // Clear all URL parameters except for legacy tag support
    const params = new URLSearchParams();
    const legacyTag = searchParams.get("tag");
    if (legacyTag) {
      params.set("tag", legacyTag);
    }
    navigate(`?${params.toString()}`, { replace: true });
  };

  // Get available years from posts
  const availableYears = [...new Set(posts.map(post => 
    new Date(post.frontmatter.pubDate).getFullYear().toString()
  ))].sort((a, b) => parseInt(b) - parseInt(a));

  // Check if any filters are active
  const hasActiveFilters = selectedYear !== "all" || 
                         selectedReadingTime !== "all" || 
                         sortBy !== "date-desc" || 
                         showFeaturedOnly || 
                         selectedTags.length > 0 ||
                         searchInput.length > 0;

  return (
    <Layout>
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 animate-fade-in">
            <h1 className="text-4xl font-bold mb-4">Insights for Builders, Backers, and Operators</h1>
            <p className="text-muted-foreground mb-8">
              Hard-earned lessons and forward-looking analysis on AI-native SaaS, product-market fit, and scaling trust in software. Read what top-tier founders and VCs are already talking about.
            </p>
            
            {/* Search and Filter Controls */}
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="flex items-center justify-center gap-3 max-w-lg mx-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search articles..."
                    className="pl-10"
                    value={searchInput}
                    onChange={handleSearchChange}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSmartSearchOpen(true)}
                  className="flex items-center gap-2 px-3"
                >
                  <Sparkles size={16} />
                  <span className="hidden sm:inline">Smart Search</span>
                </Button>
              </div>

              {/* Filter Toggle */}
              <div className="flex justify-center items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-1">
                      {[
                        selectedYear !== "all" && "Year",
                        selectedReadingTime !== "all" && "Time",
                        sortBy !== "date-desc" && "Sort",
                        showFeaturedOnly && "Featured",
                        selectedTags.length > 0 && `Tags (${selectedTags.length})`
                      ].filter(Boolean).length}
                    </Badge>
                  )}
                </Button>
                
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="flex items-center gap-2 text-muted-foreground"
                  >
                    <X className="h-4 w-4" />
                    Clear all
                  </Button>
                )}
              </div>

              {/* Advanced Filters */}
              <Collapsible open={showFilters} onOpenChange={setShowFilters}>
                <CollapsibleContent>
                  <div className="max-w-4xl mx-auto mt-6 p-6 border rounded-lg bg-muted/20">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      {/* Year Filter */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Year</label>
                        <Select value={selectedYear} onValueChange={handleYearChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Years</SelectItem>
                            {availableYears.map(year => (
                              <SelectItem key={year} value={year}>{year}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Reading Time Filter */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Reading Time</label>
                        <Select value={selectedReadingTime} onValueChange={handleReadingTimeChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Lengths</SelectItem>
                            <SelectItem value="short">Quick Read (≤3 min)</SelectItem>
                            <SelectItem value="medium">Medium Read (4-8 min)</SelectItem>
                            <SelectItem value="long">Long Read (9+ min)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Sort Options */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Sort By</label>
                        <Select value={sortBy} onValueChange={handleSortChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="date-desc">Newest First</SelectItem>
                            <SelectItem value="date-asc">Oldest First</SelectItem>
                            <SelectItem value="title-asc">Title A-Z</SelectItem>
                            <SelectItem value="title-desc">Title Z-A</SelectItem>
                            <SelectItem value="reading-time-asc">Shortest First</SelectItem>
                            <SelectItem value="reading-time-desc">Longest First</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Featured Toggle */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Featured</label>
                        <Button
                          variant={showFeaturedOnly ? "default" : "outline"}
                          size="sm"
                          onClick={handleFeaturedToggle}
                          className="w-full justify-start"
                        >
                          {showFeaturedOnly ? "Featured Only" : "All Posts"}
                        </Button>
                      </div>
                    </div>

                    {/* Tag Filter */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium">Tags</label>
                      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                        {allTags.slice(0, 20).map(({ tag, count }) => (
                          <Button
                            key={tag}
                            variant={selectedTags.includes(tag) ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleTagToggle(tag)}
                            className="text-xs h-8"
                          >
                            {tag} ({count})
                          </Button>
                        ))}
                      </div>
                      
                      {/* Selected Tags Display */}
                      {selectedTags.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t">
                          <span className="text-sm font-medium text-muted-foreground">Selected:</span>
                          {selectedTags.map(tag => (
                            <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => handleTagToggle(tag)}>
                              {tag} <X className="h-3 w-3 ml-1" />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>

          {/* Results Summary */}
          <div className="text-center mb-6">
            <p className="text-sm text-muted-foreground">
              Showing {filteredPosts.length} of {posts.length} articles
              {hasActiveFilters && " (filtered)"}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedPosts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
            
            {filteredPosts.length === 0 && (
              <div className="col-span-full text-center py-12">
                <h3 className="text-xl font-medium mb-2">No articles found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search query
                </p>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="mt-16">
            <WeeklyPlaybook />
          </div>
        </div>
      </section>
      
      {/* Smart Search Modal */}
      <SmartSearch
        isOpen={isSmartSearchOpen}
        onClose={() => setIsSmartSearchOpen(false)}
        onOpen={() => setIsSmartSearchOpen(true)}
      />
    </Layout>
  );
}
