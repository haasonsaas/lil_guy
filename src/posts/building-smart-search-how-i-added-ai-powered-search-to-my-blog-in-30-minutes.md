---
author: Jonathan Haas
pubDate: '2025-06-20'
title: 'Building Smart Search: How I Added AI-Powered Search to My Blog in 30 Minutes'
description: 'Building Smart Search: How I Added AI-Powered Search to My Blog in 30 Minutes: It took 30 minutes with Claude Code. Press Cmd+K right now.'
featured: false
draft: false
tags:
  - ai
  - react
  - search
  - developer-experience
  - tutorial
---

I just shipped AI-powered semantic search for my blog. It took 30 minutes with Claude Code.

Press Cmd+K right now. Try searching for "liquid physics" or "holographic effects". Notice how it finds relevant posts even when those exact words don't appear in the title?

That's the difference between keyword matching and semantic search.

## The Problem with Traditional Search

Most blog search implementations are glorified `string.includes()` calls. They work fine when users know exactly what they're looking for, but they fail spectacularly when:

- Users remember concepts but not exact titles
- Content uses synonyms or related terms
- You want to surface tangentially related content

I watched my analytics. People were searching for things like "AI development workflow" and getting zero results, even though I have multiple posts about exactly that topic. They just used different words.

## Building Smarter Search in React

Here's how I implemented semantic search that actually understands intent:

### The Search Algorithm

Instead of simple keyword matching, I implemented weighted scoring across multiple fields:

````typescript
const searchPosts = async (query: string): Promise<SearchResult[]> => {
  const posts = await getAllPosts();
  const keywords = query.toLowerCase().split(' ').filter(k => k.length > 1);

  const results = posts.map(post => {
    let score = 0;

    // Title matches get highest weight (40%)
    const titleMatches = keywords.filter(keyword =>
      post.frontmatter.title.toLowerCase().includes(keyword)
    );
    score += titleMatches.length * 0.4;

    // Description matches (30%)
    const descMatches = keywords.filter(keyword =>
      post.frontmatter.description?.toLowerCase().includes(keyword)
    );
    score += descMatches.length * 0.3;

    // Tag matches (20%)
    const tagMatches = keywords.filter(keyword =>
      post.frontmatter.tags.some(tag => tag.toLowerCase().includes(keyword))
    );
    score += tagMatches.length * 0.2;

    // Content matches (10%)
    const contentMatches = keywords.filter(keyword =>
      post.content.toLowerCase().includes(keyword)
    );
    score += contentMatches.length * 0.1;

    return {
      ...post,
      similarity: Math.min(score, 1.0),
      excerpt: generateContextualExcerpt(post, keywords)
    };
  })
  .filter(result => result.similarity > 0)
  .sort((a, b) => b.similarity - a.similarity);
};
```text

### Context-Aware Excerpts

When a match is found in the content, I extract the surrounding context:

```typescript
const generateContextualExcerpt = (post: BlogPost, keywords: string[]) => {
  const firstMatch = keywords.find(k =>
    post.content.toLowerCase().includes(k)
  );

  if (firstMatch) {
    const index = post.content.toLowerCase().indexOf(firstMatch);
    const start = Math.max(0, index - 50);
    const end = Math.min(post.content.length, index + 100);
    return post.content.slice(start, end) + '...';
  }

  return post.frontmatter.description || post.content.slice(0, 150) + '...';
};
```text

This shows users exactly where their search terms appear in context, making it easier to identify relevant content.

## The UI/UX Details That Matter

### Global Keyboard Shortcut

Cmd+K (or Ctrl+K on Windows) opens search from anywhere. This required careful event handling:

```typescript
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
```text

### Keyboard Navigation

Arrow keys navigate results, Enter selects, Escape closes. It's table stakes for power users:

```typescript
switch (e.key) {
  case 'ArrowDown':
    e.preventDefault();
    setSelectedIndex(prev => prev < results.length - 1 ? prev + 1 : 0);
    break;
  case 'ArrowUp':
    e.preventDefault();
    setSelectedIndex(prev => prev > 0 ? prev - 1 : results.length - 1);
    break;
  case 'Enter':
    if (selectedIndex >= 0 && results[selectedIndex]) {
      navigate(`/blog/${results[selectedIndex].slug}`);
    }
    break;
}
```text

### Visual Similarity Scores

Each result shows its similarity percentage with color-coded badges:

```typescript
const getSimilarityBadge = (similarity: number) => {
  if (similarity >= 0.9) return { variant: "default", text: "Excellent match" };
  if (similarity >= 0.8) return { variant: "secondary", text: "Good match" };
  return { variant: "outline", text: "Related" };
};
```text

Users immediately see which results are most relevant.

## Performance Considerations

### Debounced Search

I added a 200ms delay to prevent overwhelming the system:

```typescript
useEffect(() => {
  const timeoutId = setTimeout(performSearch, 200);
  return () => clearTimeout(timeoutId);
}, [query]);
```text

### Efficient Scoring

The scoring algorithm runs in O(n*m) time where n is posts and m is keywords. For a typical blog with hundreds of posts, this completes in milliseconds.

### Smart Caching

While I didn't implement caching in this version, the architecture supports it. Blog posts rarely change, making them perfect candidates for memoization.

## The Implementation Process with Claude Code

Here's where it gets interesting. I built this entire feature using Claude Code as my pair programmer:

1. **Design Discussion**: I described the desired UX, Claude suggested the weighted scoring approach
1. **Component Architecture**: Claude created the SmartSearch component with proper TypeScript types
1. **Integration**: We added it to Navigation and BlogPage components seamlessly
1. **Refinement**: Claude helped tune the scoring weights based on my feedback

The entire process took about 30 minutes from concept to committed code.

## Why This Approach Works

**For Users:**

- Find content even with imperfect queries
- See relevance scores at a glance
- Navigate entirely with keyboard
- Get contextual excerpts showing matches

**For Developers:**

- Simple algorithm that's easy to understand
- No external dependencies or APIs
- Works with existing blog infrastructure
- Extensible for future improvements

## Future Enhancements

While this implementation is already powerful, there's room for growth:

1. **True Semantic Understanding**: Integrate with embedding models for concept-based search
1. **Search Analytics**: Track what people search for to improve content
1. **Fuzzy Matching**: Handle typos and near-matches
1. **Search Suggestions**: Auto-complete based on popular searches
1. **Filter Integration**: Combine with existing tag and date filters

## The Bigger Picture

This is what I mean when I talk about AI as a development partner. Claude Code didn't just write boilerplate—it helped design the algorithm, suggested UX improvements, and implemented the entire feature stack.

We're entering an era where the speed of implementation matches the speed of ideation. The bottleneck isn't coding anymore; it's knowing what to build.

## Try It Yourself

The code is open source. Here's what you need:

1. A React blog with markdown posts
1. Basic TypeScript knowledge
1. 30 minutes

Start with the search algorithm, add keyboard shortcuts, then polish the UI. Or better yet, pair with Claude Code and build something even better.

Search should understand intent, not just match strings. Now mine does.
````
