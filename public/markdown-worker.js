// Markdown Processing Web Worker
// Handles heavy markdown parsing off the main thread

// Simple markdown processor for web worker
// Uses a lightweight approach to avoid complex module loading in worker

let processorReady = false;

// Simplified markdown processing without heavy dependencies
function processMarkdownSimple(content) {
  // Remove frontmatter
  const contentWithoutFrontmatter = content.replace(/^---[\s\S]*?---/, '').trim();
  
  // Process custom component tags first
  let processedContent = contentWithoutFrontmatter;
  const componentMatches = [];
  
  // Find and replace custom components
  const componentRegex = /<([\w-]+)([^>]*)>/g;
  let match;
  while ((match = componentRegex.exec(contentWithoutFrontmatter)) !== null) {
    const [fullMatch, componentName, propsString] = match;
    componentMatches.push(fullMatch);
    
    const props = {};
    const propRegex = /(\w+)="([^"]+)"/g;
    let propMatch;
    while ((propMatch = propRegex.exec(propsString)) !== null) {
      props[propMatch[1]] = propMatch[2];
    }
    
    const placeholder = `<div data-component="${componentName}" data-props='${JSON.stringify(props)}'></div>`;
    processedContent = processedContent.replace(fullMatch, placeholder);
  }
  
  // Basic markdown to HTML conversion
  // Headers
  processedContent = processedContent.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  processedContent = processedContent.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  processedContent = processedContent.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Bold
  processedContent = processedContent.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
  
  // Italic
  processedContent = processedContent.replace(/\*(.*)\*/gim, '<em>$1</em>');
  
  // Code blocks
  processedContent = processedContent.replace(/```(\w+)?\n([\s\S]*?)```/gim, (match, lang, code) => {
    const language = lang || '';
    return `<pre><code class="language-${language}">${code.trim()}</code></pre>`;
  });
  
  // Inline code
  processedContent = processedContent.replace(/`([^`]+)`/gim, '<code>$1</code>');
  
  // Links
  processedContent = processedContent.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>');
  
  // Line breaks (convert double newlines to paragraphs)
  const paragraphs = processedContent.split('\n\n').filter(p => p.trim());
  processedContent = paragraphs.map(p => {
    // Don't wrap if it's already an HTML block element
    if (p.startsWith('<h') || p.startsWith('<pre') || p.startsWith('<div') || p.startsWith('<ul') || p.startsWith('<ol')) {
      return p;
    }
    // Convert single newlines to br tags within paragraphs
    const withBreaks = p.replace(/\n/g, '<br>');
    return `<p>${withBreaks}</p>`;
  }).join('\n');
  
  return processedContent;
}

// Message handler
self.addEventListener('message', async (event) => {
  const { id, type, content } = event.data;
  
  try {
    if (type === 'PROCESS_MARKDOWN') {
      // Process markdown using simple processor
      const result = processMarkdownSimple(content);
      
      // Send result back to main thread
      self.postMessage({
        id,
        type: 'MARKDOWN_PROCESSED',
        result
      });
    }
  } catch (error) {
    // Send error back to main thread
    self.postMessage({
      id,
      type: 'MARKDOWN_ERROR',
      error: error.message
    });
  }
});

// Signal that worker is ready
self.postMessage({
  type: 'WORKER_READY'
});