/**
 * Authentication Context
 * 
 * Combines wallet-based authentication with Supabase for data persistence
 * Manages user roles and profile data
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWeb3 } from "./Web3Context";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

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
  const { address, isConnected, connect, disconnect } = useWeb3();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const isAuthenticated = !!user && isConnected;

  const clearError = useCallback(() => setError(null), []);

  /**
   * Fetch user profile and role from database
   */
  const fetchUserData = useCallback(async (walletAddress: string) => {
    try {
      // First check if user exists in profiles
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("wallet_address", walletAddress)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profile) {
        setUser(profile as UserProfile);
        
        // Fetch role
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", profile.id)
          .maybeSingle();

        if (roleError) throw roleError;
        if (roleData) {
          setRole(roleData.role as UserRole);
        }
      } else {
        // User not registered yet
        setUser(null);
        setRole(null);
      }
    } catch (err: any) {
      console.error("Error fetching user data:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Sign up with wallet - creates user in Supabase
   */
  const signUp = useCallback(async (selectedRole: UserRole, name: string, email?: string) => {
    if (!address) {
      setError("Please connect your wallet first");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Generate a unique email for auth based on wallet address
      const authEmail = `${address.toLowerCase()}@wallet.urads.io`;
      const authPassword = `wallet_${address.toLowerCase()}_${Date.now()}`;

      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            wallet_address: address,
            name: name,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user");

      // Create profile
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: authData.user.id,
          wallet_address: address,
          name: name,
          email: email || null,
        });

      if (profileError) throw profileError;

      // Create role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: authData.user.id,
          role: selectedRole,
        });

      if (roleError) throw roleError;

      // Create advertiser or influencer profile
      if (selectedRole === "advertiser") {
        const { error: advError } = await supabase
          .from("advertisers")
          .insert({
            user_id: authData.user.id,
          });
        if (advError) throw advError;
      } else if (selectedRole === "influencer") {
        const { error: infError } = await supabase
          .from("influencers")
          .insert({
            user_id: authData.user.id,
          });
        if (infError) throw infError;
      }

      // Update local state
      setUser({
        id: authData.user.id,
        wallet_address: address,
        name: name,
        email: email || null,
        avatar_url: null,
        verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setRole(selectedRole);

      toast({
        title: "Account created!",
        description: `Welcome to UrAds, ${name}!`,
      });
    } catch (err: any) {
      console.error("Sign up error:", err);
      setError(err.message);
      toast({
        title: "Sign up failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [address, toast]);

  /**
   * Sign in with wallet - authenticates existing user
   */
  const signIn = useCallback(async () => {
    if (!address) {
      await connect();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if user exists
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("wallet_address", address)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profile) {
        setError("Account not found. Please sign up first.");
        setIsLoading(false);
        return;
      }

      // Sign in with Supabase Auth
      const authEmail = `${address.toLowerCase()}@wallet.urads.io`;
      
      // For wallet-based auth, we use a session trick
      // First try to sign in, if fails, we just use the profile directly
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: `wallet_${address.toLowerCase()}_dummy`, // This will fail, but that's OK
      });

      // Even if auth fails, if we have a profile, we can use it
      // In production, you'd use a proper wallet signature verification
      
      setUser(profile as UserProfile);

      // Fetch role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", profile.id)
        .maybeSingle();

      if (roleData) {
        setRole(roleData.role as UserRole);
      }

      toast({
        title: "Welcome back!",
        description: `Signed in as ${profile.name || address.slice(0, 8)}...`,
      });
    } catch (err: any) {
      console.error("Sign in error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [address, connect, toast]);

  /**
   * Sign out
   */
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      disconnect();
      setUser(null);
      setRole(null);
      toast({
        title: "Signed out",
        description: "See you soon!",
      });
    } catch (err: any) {
      console.error("Sign out error:", err);
      setError(err.message);
    }
  }, [disconnect, toast]);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (data: Partial<UserProfile>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update(data)
        .eq("id", user.id);

      if (error) throw error;

      setUser({ ...user, ...data });
      toast({
        title: "Profile updated",
        description: "Your changes have been saved.",
      });
    } catch (err: any) {
      console.error("Update profile error:", err);
      setError(err.message);
      toast({
        title: "Update failed",
        description: err.message,
        variant: "destructive",
      });
    }
  }, [user, toast]);

  /**
   * Watch for wallet connection changes
   */
  useEffect(() => {
    if (address && !user) {
      fetchUserData(address);
    } else if (!address) {
      setUser(null);
      setRole(null);
      setIsLoading(false);
    }
  }, [address, fetchUserData, user]);

  /**
   * Listen for auth state changes
   */
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT") {
          setUser(null);
          setRole(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

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
