import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelmetProvider } from "react-helmet-async";
import { TranslationProvider } from "@/hooks/use-translation";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import ArticleDetail from "@/pages/article";
import Category from "@/pages/category";
import SearchPage from "@/pages/search";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminArticles from "@/pages/admin/articles";
import AdminCategories from "@/pages/admin/categories";
import AdminSources from "@/pages/admin/sources";
import AdminAds from "@/pages/admin/advertisements";
import AdminAnalytics from "@/pages/admin/analytics";
import AdminSettings from "@/pages/admin/settings";
import AdminAutomation from "@/pages/admin/automation";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/article/:slug" component={ArticleDetail} />
      <Route path="/category/:slug" component={Category} />
      <Route path="/search" component={SearchPage} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/articles" component={AdminArticles} />
      <Route path="/admin/categories" component={AdminCategories} />
      <Route path="/admin/sources" component={AdminSources} />
      <Route path="/admin/advertisements" component={AdminAds} />
      <Route path="/admin/analytics" component={AdminAnalytics} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route path="/admin/automation" component={AdminAutomation} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <HelmetProvider>
      <TranslationProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </TranslationProvider>
    </HelmetProvider>
  );
}

export default App;
