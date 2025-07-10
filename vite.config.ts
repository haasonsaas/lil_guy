import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { markdownPlugin } from './src/vite-markdown-plugin'
import { viteBlogImagesPlugin } from './src/vite-blog-images-plugin'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: '::',
    port: 8082,
    proxy: {
      '/api': {
        target: 'http://localhost:8788',
        changeOrigin: true,
        secure: false,
      },
    },
    hmr: {
      port: 8082,
    },
  },
  plugins: [react(), markdownPlugin(), viteBlogImagesPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['gray-matter'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // Heavy libraries that benefit from separate chunks
            if (id.includes('framer-motion')) return 'framer-motion'
            if (id.includes('katex')) return 'katex'
            if (id.includes('prismjs') || id.includes('highlight.js'))
              return 'syntax-highlighting'
            if (id.includes('marked') || id.includes('gray-matter'))
              return 'markdown'
            if (id.includes('recharts')) return 'charts'
            if (id.includes('@radix-ui')) return 'radix-ui'

            // Keep core React with remaining vendor libraries
            return 'vendor'
          }

          // Interactive calculators - lazy loaded as needed
          if (id.includes('Calculator') || id.includes('Simulator')) {
            return 'calculators'
          }

          // Blog-specific utilities
          if (
            id.includes('src/utils/blog') ||
            id.includes('MarkdownRenderer')
          ) {
            return 'blog-utils'
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    minify: 'esbuild',
    target: 'es2020',
  },
})
