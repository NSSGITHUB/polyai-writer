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
import AmoebaDashboard from "./pages/AmoebaDashboard";
import AmoebaSetup from "./pages/AmoebaSetup";
import AmoebaUnits from "./pages/AmoebaUnits";
import AmoebaAccounting from "./pages/AmoebaAccounting";
import AmoebaTransfers from "./pages/AmoebaTransfers";
import AmoebaReports from "./pages/AmoebaReports";
import AmoebaSettings from "./pages/AmoebaSettings";
import AmoebaGoals from "./pages/AmoebaGoals";
import AmoebaBudgets from "./pages/AmoebaBudgets";
import AmoebaComparison from "./pages/AmoebaComparison";
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
          <Route path="/amoeba" element={<AmoebaDashboard />} />
          <Route path="/amoeba/setup" element={<AmoebaSetup />} />
          <Route path="/amoeba/units" element={<AmoebaUnits />} />
          <Route path="/amoeba/accounting" element={<AmoebaAccounting />} />
          <Route path="/amoeba/transfers" element={<AmoebaTransfers />} />
          <Route path="/amoeba/goals" element={<AmoebaGoals />} />
          <Route path="/amoeba/budgets" element={<AmoebaBudgets />} />
          <Route path="/amoeba/reports" element={<AmoebaReports />} />
          <Route path="/amoeba/comparison" element={<AmoebaComparison />} />
          <Route path="/amoeba/settings" element={<AmoebaSettings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
