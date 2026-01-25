import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Web3Provider } from "@/contexts/Web3Context";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Public pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

// Dashboard pages
import AdvertiserDashboard from "./pages/advertiser/AdvertiserDashboard";
import InfluencerDashboard from "./pages/influencer/InfluencerDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";

// Sub-pages (placeholders)
import AdvertiserCampaigns from "./pages/advertiser/AdvertiserCampaigns";
import AdvertiserDiscover from "./pages/advertiser/AdvertiserDiscover";
import AdvertiserMessages from "./pages/advertiser/AdvertiserMessages";
import CreateCampaign from "./pages/advertiser/CreateCampaign";

import InfluencerCampaigns from "./pages/influencer/InfluencerCampaigns";
import InfluencerApplications from "./pages/influencer/InfluencerApplications";
import InfluencerMessages from "./pages/influencer/InfluencerMessages";
import InfluencerEarnings from "./pages/influencer/InfluencerEarnings";

import AdminUsers from "./pages/admin/AdminUsers";
import AdminCampaigns from "./pages/admin/AdminCampaigns";
import AdminDisputes from "./pages/admin/AdminDisputes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Web3Provider>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Advertiser Routes */}
              <Route
                path="/advertiser"
                element={
                  <ProtectedRoute requiredRole="advertiser">
                    <AdvertiserDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/advertiser/campaigns"
                element={
                  <ProtectedRoute requiredRole="advertiser">
                    <AdvertiserCampaigns />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/advertiser/campaigns/new"
                element={
                  <ProtectedRoute requiredRole="advertiser">
                    <CreateCampaign />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/advertiser/discover"
                element={
                  <ProtectedRoute requiredRole="advertiser">
                    <AdvertiserDiscover />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/advertiser/messages"
                element={
                  <ProtectedRoute requiredRole="advertiser">
                    <AdvertiserMessages />
                  </ProtectedRoute>
                }
              />

              {/* Influencer Routes */}
              <Route
                path="/influencer"
                element={
                  <ProtectedRoute requiredRole="influencer">
                    <InfluencerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/influencer/campaigns"
                element={
                  <ProtectedRoute requiredRole="influencer">
                    <InfluencerCampaigns />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/influencer/applications"
                element={
                  <ProtectedRoute requiredRole="influencer">
                    <InfluencerApplications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/influencer/messages"
                element={
                  <ProtectedRoute requiredRole="influencer">
                    <InfluencerMessages />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/influencer/earnings"
                element={
                  <ProtectedRoute requiredRole="influencer">
                    <InfluencerEarnings />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminUsers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/campaigns"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminCampaigns />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/disputes"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDisputes />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </Web3Provider>
  </QueryClientProvider>
);

export default App;
