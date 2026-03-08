/**
 * Authentication Context
 * 
 * Wallet signature-based authentication with Supabase
 * Uses cryptographic wallet signatures for secure, passwordless auth
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
  user: UserProfile | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (role: UserRole, name: string, email?: string) => Promise<void>;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  error: string | null;
  clearError: () => void;
}

// =============================================================
//                         CONTEXT
// =============================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// =============================================================
//                     SIGNATURE HELPERS
// =============================================================

function buildSignMessage(action: "signup" | "signin", address: string): string {
  const timestamp = Date.now();
  return `UrAds ${action === "signup" ? "Registration" : "Login"}\nWallet: ${address}\nTimestamp: ${timestamp}`;
}

// =============================================================
//                        PROVIDER
// =============================================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { address, isConnected, signer, disconnect } = useWeb3();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user && isConnected;
  const clearError = useCallback(() => setError(null), []);

  /**
   * Exchange a magic link token for a Supabase session
   */
  const exchangeToken = useCallback(async (tokenHash: string, email: string) => {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "magiclink",
    });
    if (verifyError) {
      console.error("Token exchange error:", verifyError);
      throw new Error("Session creation failed. Please try again.");
    }
  }, []);

  /**
   * Fetch user profile and role from database
   */
  const fetchUserData = useCallback(async (walletAddress: string): Promise<boolean> => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("wallet_address", walletAddress.toLowerCase())
        .maybeSingle();

      if (profileError) throw profileError;

      if (profile) {
        setUser(profile as UserProfile);
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", profile.id)
          .maybeSingle();
        if (roleData) setRole(roleData.role as UserRole);
        return true;
      }
      setUser(null);
      setRole(null);
      return false;
    } catch (err: any) {
      console.error("Error fetching user data:", err);
      setError(err.message);
      return false;
    }
  }, []);

  /**
   * Sign up with wallet signature verification
   */
  const signUp = useCallback(async (selectedRole: UserRole, name: string, email?: string) => {
    if (!address || !signer) {
      setError("Please connect your wallet first");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const message = buildSignMessage("signup", address);

      // Request wallet signature — proves ownership
      const signature = await signer.signMessage(message);

      // Call edge function to verify and create account
      const { data, error: fnError } = await supabase.functions.invoke("auth-wallet", {
        body: {
          action: "signup",
          address,
          message,
          signature,
          name,
          role: selectedRole,
          email: email || undefined,
        },
      });

      if (fnError) throw new Error(fnError.message || "Signup failed");
      if (data?.error) throw new Error(data.error);

      // Exchange token for session
      await exchangeToken(data.token_hash, data.email);

      // Set local state
      setUser({
        id: data.user_id,
        wallet_address: address.toLowerCase(),
        name,
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
      const msg = err.message || "Sign up failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [address, signer, exchangeToken]);

  /**
   * Sign in with wallet signature verification
   */
  const signIn = useCallback(async () => {
    if (!address || !signer) {
      setError("Please connect your wallet first");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const message = buildSignMessage("signin", address);

      // Request wallet signature — proves ownership
      const signature = await signer.signMessage(message);

      // Call edge function to verify and authenticate
      const { data, error: fnError } = await supabase.functions.invoke("auth-wallet", {
        body: { action: "signin", address, message, signature },
      });

      if (fnError) throw new Error(fnError.message || "Sign in failed");
      if (data?.error) throw new Error(data.error);

      // Exchange token for session
      await exchangeToken(data.token_hash, data.email);

      // Fetch full profile
      await fetchUserData(address);

      toast.success("Welcome back!");
    } catch (err: any) {
      console.error("Sign in error:", err);
      const msg = err.message || "Sign in failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [address, signer, exchangeToken, fetchUserData]);

  /**
   * Sign out
   */
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Signout error (non-critical):", err);
    }
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
    if (!user) { setError("No user logged in"); return; }
    try {
      const { error } = await supabase.from("profiles").update(data).eq("id", user.id);
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
   * Listen for Supabase auth state changes
   */
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session && address && !user) {
        await fetchUserData(address);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setRole(null);
      }
    });
    return () => subscription.unsubscribe();
  }, [address, user, fetchUserData]);

  /**
   * Check existing session on mount
   */
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && address) {
        await fetchUserData(address);
      }
      setIsLoading(false);
    };

    if (address) {
      checkSession();
    } else {
      setUser(null);
      setRole(null);
      setIsLoading(false);
    }
  }, [address, fetchUserData]);

  const value: AuthContextType = {
    user, role, isLoading, isAuthenticated,
    signUp, signIn, signOut, updateProfile,
    error, clearError,
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
