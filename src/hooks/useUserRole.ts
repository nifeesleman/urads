/**
 * Hook to get and manage user roles
 */

import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export function useUserRole() {
  const { role, isAuthenticated, isLoading } = useAuth();

  const getDashboardRoute = (userRole: UserRole | null): string => {
    switch (userRole) {
      case "advertiser":
        return "/advertiser";
      case "influencer":
        return "/influencer";
      case "admin":
        return "/admin";
      default:
        return "/";
    }
  };

  return {
    role,
    isAdvertiser: role === "advertiser",
    isInfluencer: role === "influencer",
    isAdmin: role === "admin",
    isAuthenticated,
    isLoading,
    getDashboardRoute,
    dashboardRoute: getDashboardRoute(role),
  };
}

/**
 * Hook to redirect based on role
 */
export function useRoleRedirect() {
  const navigate = useNavigate();
  const { role, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated && role) {
      switch (role) {
        case "advertiser":
          navigate("/advertiser");
          break;
        case "influencer":
          navigate("/influencer");
          break;
        case "admin":
          navigate("/admin");
          break;
      }
    }
  }, [role, isAuthenticated, isLoading, navigate]);
}

/**
 * Hook to protect routes by role
 */
export function useRequireRole(requiredRole: UserRole | UserRole[]) {
  const navigate = useNavigate();
  const { role, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (role && !roles.includes(role)) {
      navigate("/");
    }
  }, [role, isAuthenticated, isLoading, requiredRole, navigate]);

  return { isAuthorized: role && (Array.isArray(requiredRole) ? requiredRole : [requiredRole]).includes(role) };
}
