import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { markdownPlugin } from "./src/vite-markdown-plugin";
import { viteBlogImagesPlugin } from "./src/vite-blog-images-plugin";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    markdownPlugin(),
    viteBlogImagesPlugin(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: ['gray-matter']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor libraries
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-toast', '@radix-ui/react-tooltip', '@radix-ui/react-switch', '@radix-ui/react-tabs'],
          'vendor-utils': ['clsx', 'tailwind-merge', 'lucide-react'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-animation': ['framer-motion'],
          
          // Blog utilities (excluding content)
          'blog-utils': ['./src/utils/blogUtils.ts', './src/utils/blog/imageUtils.ts', './src/utils/blog/dateUtils.ts'],
          'blog-content': ['./src/utils/blog/postUtils.ts', './src/utils/blog/fileLoader.ts'],
          
          // Large components
          'page-blog': ['./src/pages/BlogPage.tsx', './src/pages/BlogPost.tsx'],
          'page-experiments': ['./src/pages/ExperimentsPage.tsx'],
          'markdown': ['./src/components/MarkdownRenderer.tsx'],
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
}));
