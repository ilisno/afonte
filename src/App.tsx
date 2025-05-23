import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ProgrammeGenerator from "./pages/ProgrammeGenerator";
import Blog from "./pages/Blog";
import BlogPostDetail from "./pages/BlogPostDetail";
import CoachVirtuel from "./pages/CoachVirtuel";
import MonEspace from "./pages/MonEspace"; // Import MonEspace
import Login from "./pages/Login"; // Import Login page
import { PopupProvider } from "./contexts/PopupContext";
import { supabase } from "@/integrations/supabase/client"; // Import Supabase client
import { SessionContextProvider, useSession } from '@supabase/auth-helpers-react'; // Import SessionContextProvider and useSession

const queryClient = new QueryClient();

// Component to handle authentication redirects
const AuthRedirectHandler = ({ children }: { children: React.ReactNode }) => {
  const session = useSession();
  const navigate = useNavigate();
  const location = useLocation();

  const publicPaths = ['/', '/programme', '/blog', '/coach-virtuel']; // Define public paths
  // Add dynamic blog post paths to public paths
  if (location.pathname.match(/^\/[^/]+\/[^/]+$/)) { // Basic regex for /category/post
      // This is a blog post detail page, it should be public
  } else if (!publicPaths.includes(location.pathname) && !session && location.pathname !== '/login') {
      // If not a public path, not logged in, and not already on the login page, redirect to login
      console.log(`Redirecting to /login from ${location.pathname} (no session)`);
      navigate('/login', { replace: true });
  } else if (session && location.pathname === '/login') {
      // If logged in and on the login page, redirect to home
      console.log(`Redirecting to / from ${location.pathname} (session exists)`);
      navigate('/', { replace: true });
  }


  return <>{children}</>;
};


const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        {/* Wrap with SessionContextProvider */}
        <SessionContextProvider supabaseClient={supabase}>
          <PopupProvider>
            {/* Wrap Routes with AuthRedirectHandler */}
            <AuthRedirectHandler>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/programme" element={<ProgrammeGenerator />} />
                <Route path="/blog" element={<Blog />} />
                {/* Route for individual blog posts */}
                <Route path="/:categorySlug/:postSlug" element={<BlogPostDetail />} />
                <Route path="/coach-virtuel" element={<CoachVirtuel />} />
                <Route path="/mon-espace" element={<MonEspace />} /> {/* Route for Mon Espace */}
                <Route path="/login" element={<Login />} /> {/* Route for Login */}
                {/* Catch-all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthRedirectHandler>
          </PopupProvider>
        </SessionContextProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;