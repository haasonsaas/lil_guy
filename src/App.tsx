import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { HelmetProvider } from "react-helmet-async";
import ScrollToTop from "@/components/ScrollToTop";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./styles/print.css";

// Critical routes - load immediately
import Index from "./pages/Index";
import BlogPage from "./pages/BlogPage";
import BlogPost from "./pages/BlogPost";
import NotFound from "./pages/NotFound";

// Lazy-loaded routes - load on demand
const Archive = lazy(() => import("./pages/Archive"));
const TagsPage = lazy(() => import("./pages/TagsPage"));
const TagPage = lazy(() => import("./pages/TagPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const UsesPage = lazy(() => import("./pages/UsesPage"));
const ReadingPage = lazy(() => import("./pages/ReadingPage"));
const NewsletterPage = lazy(() => import("./pages/NewsletterPage"));
const ExperimentsPage = lazy(() => import("./pages/ExperimentsPage"));
const WebGLPage = lazy(() => import("./pages/WebGLPage"));
const CodeRainPage = lazy(() => import("./pages/CodeRainPage"));
const DraftsPage = lazy(() => import("./pages/DraftsPage"));

// Loading component
const PageLoading = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="haas-blog-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Router>
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
                <Route path="/newsletter" element={<NewsletterPage />} />
                <Route path="/experiments" element={<ExperimentsPage />} />
                <Route path="/webgl" element={<WebGLPage />} />
                <Route path="/code-rain" element={<CodeRainPage />} />
                {/* Redirect /admin to the home page */}
                <Route path="/admin" element={<Navigate to="/" replace />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </Router>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
