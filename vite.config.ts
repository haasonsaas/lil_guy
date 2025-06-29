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
          // Vendor libraries - emergency fix for createContext error
          if (id.includes('node_modules')) {
            return 'vendor'
          }

          // Interactive calculators - each gets its own chunk for lazy loading
          if (id.includes('UnitEconomicsCalculator'))
            return 'calc-unit-economics'
          if (id.includes('ABTestSimulator')) return 'calc-ab-test'
          if (id.includes('TechnicalDebtSimulator')) return 'calc-tech-debt'
          if (id.includes('PricingPsychologySimulator')) return 'calc-pricing'
          if (id.includes('SaaSMetricsDashboard')) return 'calc-saas-metrics'
          if (id.includes('StartupRunwayCalculator')) return 'calc-runway'
          if (id.includes('ProductMarketFitScorer')) return 'calc-pmf'
          if (id.includes('TAMSAMSOMCalculator')) return 'calc-tam-sam-som'
          if (id.includes('GrowthStrategySimulator')) return 'calc-growth'
          if (id.includes('HiringCostCalculator')) return 'calc-hiring'
          if (id.includes('FeaturePrioritizationMatrix'))
            return 'calc-feature-priority'
          if (id.includes('TechnicalArchitectureVisualizer'))
            return 'calc-tech-arch'
          if (id.includes('CustomerDevelopmentSimulator'))
            return 'calc-customer-dev'
          if (id.includes('EngineeringVelocityTracker')) return 'calc-velocity'
          if (id.includes('RetentionCohortAnalyzer')) return 'calc-retention'
          if (id.includes('PerformanceBudgetCalculator'))
            return 'calc-performance'
          if (id.includes('BuildTimeAnalyzer')) return 'calc-build-time'

          // Blog utilities
          if (id.includes('src/utils/blog')) {
            return 'blog-utils'
          }

          // Large pages
          if (id.includes('BlogPage') || id.includes('BlogPost')) {
            return 'page-blog'
          }
          if (id.includes('ExperimentsPage')) {
            return 'page-experiments'
          }

          // Core markdown renderer
          if (id.includes('MarkdownRenderer')) {
            return 'markdown-core'
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    minify: false, // Disabled due to circular dependency issues with markdown libraries
  },
})
