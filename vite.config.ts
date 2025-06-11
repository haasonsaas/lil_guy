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
  }
}));
