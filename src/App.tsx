import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import BlogPage from "./pages/BlogPage";
import BlogPost from "./pages/BlogPost";
import TagsPage from "./pages/TagsPage";
import TagPage from "./pages/TagPage";
import AboutPage from "./pages/AboutPage";
import FAQPage from "./pages/FAQPage";
import UsesPage from "./pages/UsesPage";
import ReadingPage from "./pages/ReadingPage";
import NewsletterPage from "./pages/NewsletterPage";
import ExperimentsPage from "./pages/ExperimentsPage";
import WebGLPage from "./pages/WebGLPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="haas-blog-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/tags" element={<TagsPage />} />
            <Route path="/tags/:tag" element={<TagPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/uses" element={<UsesPage />} />
            <Route path="/reading" element={<ReadingPage />} />
            <Route path="/newsletter" element={<NewsletterPage />} />
            <Route path="/experiments" element={<ExperimentsPage />} />
            <Route path="/webgl" element={<WebGLPage />} />
            {/* Redirect /admin to the home page */}
            <Route path="/admin" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
