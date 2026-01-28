/**
 * Authentication Context
 * 
 * Combines wallet-based authentication with Supabase for data persistence
 * Uses wallet address as the primary identifier (no password required)
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWeb3 } from "./Web3Context";
import { toast } from "sonner";

// =============================================================
//                           TYPES
// =============================================================

export type UserRole = "advertiser" | "influencer" | "admin";

export interface UserProfile {
  id: string;
  wallet_address: string | null;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthContextType {
  // User state
  user: UserProfile | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Auth actions
  signUp: (role: UserRole, name: string, email?: string) => Promise<void>;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  
  // Profile actions
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  
  // Error
  error: string | null;
  clearError: () => void;
}

// =============================================================
//                         CONTEXT
// =============================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// =============================================================
//                        PROVIDER
// =============================================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { address, isConnected, disconnect } = useWeb3();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  const isAuthenticated = !!user && isConnected;

  const clearError = useCallback(() => setError(null), []);

  /**
   * Fetch user profile and role from database by wallet address
   */
  const fetchUserData = useCallback(async (walletAddress: string): Promise<boolean> => {
    try {
      console.log("Fetching user data for wallet:", walletAddress);
      
      // Check if user exists in profiles
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("wallet_address", walletAddress.toLowerCase())
        .maybeSingle();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        throw profileError;
      }

      if (profile) {
        console.log("Found profile:", profile.id);
        setUser(profile as UserProfile);
        
        // Fetch role
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", profile.id)
          .maybeSingle();

        if (roleError) {
          console.error("Role fetch error:", roleError);
          throw roleError;
        }
        
        if (roleData) {
          console.log("Found role:", roleData.role);
          setRole(roleData.role as UserRole);
        }
        return true;
      } else {
        console.log("No profile found for wallet");
        setUser(null);
        setRole(null);
        return false;
      }
    } catch (err: any) {
      console.error("Error fetching user data:", err);
      setError(err.message);
      return false;
    }
  }, []);

  /**
   * Sign up with wallet - creates user in Supabase
   * Uses anonymous sign up since we're using wallet as the primary auth method
   */
  const signUp = useCallback(async (selectedRole: UserRole, name: string, email?: string) => {
    if (!address) {
      setError("Please connect your wallet first");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const walletLower = address.toLowerCase();
      
      // Check if user already exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("wallet_address", walletLower)
        .maybeSingle();

      if (existingProfile) {
        setError("An account with this wallet already exists. Please sign in instead.");
        setIsLoading(false);
        return;
      }

      // Sign up anonymously first to get a user ID
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: `${walletLower}@wallet.urads.io`,
        password: `wallet_${walletLower}_${Date.now()}_${Math.random().toString(36)}`,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            wallet_address: walletLower,
            name: name,
          }
        }
      });

      if (authError) {
        console.error("Auth signup error:", authError);
        throw authError;
      }
      
      if (!authData.user) {
        throw new Error("Failed to create user account");
      }

      console.log("Auth user created:", authData.user.id);

      // Create profile
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: authData.user.id,
          wallet_address: walletLower,
          name: name,
          email: email || null,
        });

      if (profileError) {
        console.error("Profile insert error:", profileError);
        // If profile already exists, it might be a race condition
        if (profileError.code === "23505") {
          throw new Error("An account with this wallet already exists");
        }
        throw profileError;
      }

      // Create role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: authData.user.id,
          role: selectedRole,
        });

      if (roleError) {
        console.error("Role insert error:", roleError);
        throw roleError;
      }

      // Create advertiser or influencer profile
      if (selectedRole === "advertiser") {
        const { error: advError } = await supabase
          .from("advertisers")
          .insert({
            user_id: authData.user.id,
          });
        if (advError) {
          console.error("Advertiser insert error:", advError);
          throw advError;
        }
      } else if (selectedRole === "influencer") {
        const { error: infError } = await supabase
          .from("influencers")
          .insert({
            user_id: authData.user.id,
          });
        if (infError) {
          console.error("Influencer insert error:", infError);
          throw infError;
        }
      }

      // Update local state
      setUser({
        id: authData.user.id,
        wallet_address: walletLower,
        name: name,
        email: email || null,
        avatar_url: null,
        verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setRole(selectedRole);

      toast.success(`Welcome to UrAds, ${name}!`);
    } catch (err: any) {
      console.error("Sign up error:", err);
      setError(err.message);
      toast.error(err.message || "Sign up failed");
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  /**
   * Sign in with wallet - finds existing user by wallet address
   * No password needed - wallet ownership is the authentication
   */
  const signIn = useCallback(async () => {
    if (!address) {
      setError("Please connect your wallet first");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const walletLower = address.toLowerCase();
      
      // Check if user exists by wallet address
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("wallet_address", walletLower)
        .maybeSingle();

      if (profileError) {
        console.error("Profile lookup error:", profileError);
        throw profileError;
      }

      if (!profile) {
        setError("No account found for this wallet. Please sign up first.");
        setIsLoading(false);
        return;
      }

      console.log("Found user profile:", profile.id);

      // Set user state
      setUser(profile as UserProfile);

      // Fetch role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", profile.id)
        .maybeSingle();

      if (roleError) {
        console.error("Role lookup error:", roleError);
        throw roleError;
      }

      if (roleData) {
        setRole(roleData.role as UserRole);
      } else {
        console.warn("No role found for user");
      }

      toast.success(`Welcome back, ${profile.name || walletLower.slice(0, 8)}...!`);
    } catch (err: any) {
      console.error("Sign in error:", err);
      setError(err.message);
      toast.error(err.message || "Sign in failed");
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  /**
   * Sign out - clears all auth state and disconnects wallet
   */
  const signOut = useCallback(async () => {
    try {
      // Sign out from Supabase if there's a session
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Supabase signout error (non-critical):", err);
    }
    
    // Always clear local state and disconnect wallet
    setUser(null);
    setRole(null);
    setError(null);
    disconnect();
    
    toast.success("Signed out successfully");
  }, [disconnect]);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (data: Partial<UserProfile>) => {
    if (!user) {
      setError("No user logged in");
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update(data)
        .eq("id", user.id);

      if (error) throw error;

      setUser({ ...user, ...data });
      toast.success("Profile updated");
    } catch (err: any) {
      console.error("Update profile error:", err);
      setError(err.message);
      toast.error(err.message || "Failed to update profile");
    }
  }, [user]);

  /**
   * Watch for wallet connection changes
   */
  useEffect(() => {
    if (address && !user && !hasCheckedAuth) {
      setIsLoading(true);
      setHasCheckedAuth(true);
      fetchUserData(address).finally(() => {
        setIsLoading(false);
      });
    } else if (!address) {
      // Wallet disconnected
      setUser(null);
      setRole(null);
      setHasCheckedAuth(false);
      setIsLoading(false);
    }
  }, [address, user, hasCheckedAuth, fetchUserData]);

  /**
   * Initial loading state
   */
  useEffect(() => {
    // Set initial loading to false after a short delay if no wallet
    const timer = setTimeout(() => {
      if (!address) {
        setIsLoading(false);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [address]);

  const value: AuthContextType = {
    user,
    role,
    isLoading,
    isAuthenticated,
    signUp,
    signIn,
    signOut,
    updateProfile,
    error,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// =============================================================
//                           HOOK
// =============================================================

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
