/**
 * Protected Route Component
 * 
 * Protects routes based on authentication and role requirements
 */

import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useWeb3 } from "@/contexts/Web3Context";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole | UserRole[];
  requireAuth?: boolean;
}

export function ProtectedRoute({
  children,
  requiredRole,
  requireAuth = true,
}: ProtectedRouteProps) {
  const location = useLocation();
  const { user, role, isLoading } = useAuth();
  const { isConnected, isConnecting } = useWeb3();

  // Show loading state
  if (isLoading || isConnecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Check authentication
  if (requireAuth && (!isConnected || !user)) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role requirement
  if (requiredRole && role) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(role)) {
      // Redirect to their dashboard instead
      const dashboardRoute = role === "advertiser" 
        ? "/advertiser" 
        : role === "influencer" 
          ? "/influencer" 
          : "/admin";
      return <Navigate to={dashboardRoute} replace />;
    }
  }

  return <>{children}</>;
}
