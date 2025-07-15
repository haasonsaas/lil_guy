import { UpdateNotifier } from '@/components/UpdateNotifier'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import React, { Suspense, lazy } from 'react'
import { HelmetProvider } from 'react-helmet-async'
import ScrollToTop from '@/components/ScrollToTop'
import { ThemeProvider } from '@/components/ThemeProvider'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useServiceWorker } from '@/hooks/useServiceWorker'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { DevTools } from '@/components/DevTools'
import PerformanceDashboard from '@/components/PerformanceDashboard'
import './styles/print.css'

// Critical routes - load immediately (only homepage for fastest startup)
import Index from './pages/Index'

// Lazy-loaded routes - load on demand (including blog pages for faster initial load)
const BlogPage = lazy(() => import('./pages/BlogPage'))
const BlogPost = lazy(() => import('./pages/BlogPost'))
const NotFound = lazy(() => import('./pages/NotFound'))
const Archive = lazy(() => import('./pages/Archive'))
const TagsPage = lazy(() => import('./pages/TagsPage'))
const TagPage = lazy(() => import('./pages/TagPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const FAQPage = lazy(() => import('./pages/FAQPage'))
const UsesPage = lazy(() => import('./pages/UsesPage'))
const ReadingPage = lazy(() => import('./pages/ReadingPage'))
const NewsletterPage = lazy(() => import('./pages/NewsletterPage'))
const ExperimentsPage = lazy(() => import('./pages/ExperimentsPage'))
const WebGLPage = lazy(() => import('./pages/WebGLPage'))
const CodeRainPage = lazy(() => import('./pages/CodeRainPage'))
const AudioVisualizerPage = lazy(() => import('./pages/AudioVisualizerPage'))
const RayMarchingPage = lazy(() => import('./pages/RayMarchingPage'))
const NBodySimulationPage = lazy(() => import('./pages/NBodySimulationPage'))
const CellularAutomataPage = lazy(() => import('./pages/CellularAutomataPage'))
const GenerativeArtPage = lazy(() => import('./pages/GenerativeArtPage'))
const DraftsPage = lazy(() => import('./pages/DraftsPage'))
const OfflinePage = lazy(() => import('./pages/OfflinePage'))
const HDRHolographicFoilPage = lazy(() => import('./pages/HDRHolographicFoilPage'))
const LiquidMetalPage = lazy(() => import('./pages/LiquidMetalPage'))
const AIPage = lazy(() => import('./pages/AIPage'))
const AgentsPage = lazy(() => import('./pages/AgentsPage'))
const DiagnosticsPage = lazy(() => import('./pages/DiagnosticsPage'))

// Loading component with better UX
const PageLoading = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
)

const queryClient = new QueryClient()

// Deferred services initialization component (will be loaded later)
function DeferredServicesProvider() {
  useAnalytics() // This initializes analytics
  useServiceWorker() // This initializes service worker

  return null
}

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="haas-blog-theme">
        <TooltipProvider>
          <ErrorBoundary>
            <Toaster />
            <Sonner />
            <UpdateNotifier />
            <Router>
              <DeferredServicesProvider />
              <ScrollToTop />
              <Suspense fallback={<PageLoading />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/blog" element={<BlogPage />} />
                  <Route path="/blog/:slug" element={<BlogPost />} />
                  <Route path="/drafts" element={<DraftsPage />} />
                  <Route path="/archive" element={<Archive />} />
                  <Route path="/tags" element={<TagsPage />} />
                  <Route path="/tags/:tag" element={<TagPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/faq" element={<FAQPage />} />
                  <Route path="/uses" element={<UsesPage />} />
                  <Route path="/reading" element={<ReadingPage />} />
                  <Route path="/ai" element={<AIPage />} />
                  <Route path="/agents" element={<AgentsPage />} />

                  <Route path="/newsletter" element={<NewsletterPage />} />
                  <Route path="/experiments" element={<ExperimentsPage />} />
                  <Route path="/webgl" element={<WebGLPage />} />
                  <Route path="/code-rain" element={<CodeRainPage />} />
                  <Route path="/audio-visualizer" element={<AudioVisualizerPage />} />
                  <Route path="/ray-marching" element={<RayMarchingPage />} />
                  <Route path="/n-body" element={<NBodySimulationPage />} />
                  <Route path="/cellular-automata" element={<CellularAutomataPage />} />
                  <Route path="/generative-art" element={<GenerativeArtPage />} />
                  <Route
                    path="/experiments/hdr-holographic-foil"
                    element={<HDRHolographicFoilPage />}
                  />
                  <Route path="/experiments/liquid-metal" element={<LiquidMetalPage />} />
                  <Route path="/offline" element={<OfflinePage />} />
                  <Route path="/diagnostics" element={<DiagnosticsPage />} />
                  {/* Redirect /admin to the home page */}
                  <Route path="/admin" element={<Navigate to="/" replace />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </Router>
            <DevTools />
            <PerformanceDashboard />
          </ErrorBoundary>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </HelmetProvider>
)

export default App
