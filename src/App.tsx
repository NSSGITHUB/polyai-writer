import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Generator from "./pages/Generator";
import Articles from "./pages/Articles";
import ArticleView from "./pages/ArticleView";
import SeoAnalyzer from "./pages/SeoAnalyzer";
import ImageGenerator from "./pages/ImageGenerator";
import ImageGallery from "./pages/ImageGallery";
import KeyManagement from "./pages/KeyManagement";
import WordPressSites from "./pages/WordPressSites";
import ScheduledPosts from "./pages/ScheduledPosts";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/generator" element={<Generator />} />
          <Route path="/articles" element={<Articles />} />
          <Route path="/articles/:id" element={<ArticleView />} />
          <Route path="/seo-analyzer" element={<SeoAnalyzer />} />
          <Route path="/image-generator" element={<ImageGenerator />} />
          <Route path="/image-gallery" element={<ImageGallery />} />
          <Route path="/key-management" element={<KeyManagement />} />
          <Route path="/wordpress-sites" element={<WordPressSites />} />
          <Route path="/scheduled-posts" element={<ScheduledPosts />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
