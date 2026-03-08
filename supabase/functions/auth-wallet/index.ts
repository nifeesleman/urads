/**
 * Wallet Signature Authentication Edge Function
 * 
 * Verifies Ethereum wallet signatures and creates/authenticates users
 * Eliminates predictable passwords by using cryptographic signature verification
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { verifyMessage } from "https://esm.sh/ethers@6.13.4/utils";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AuthWalletRequest {
  action: "signup" | "signin";
  address: string;
  message: string;
  signature: string;
  // Signup-only fields
  name?: string;
  role?: "advertiser" | "influencer";
  email?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body: AuthWalletRequest = await req.json();
    const { action, address, message, signature, name, role, email } = body;

    if (!address || !message || !signature) {
      return new Response(
        JSON.stringify({ error: "Missing address, message, or signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate the message contains a recent timestamp (within 5 minutes)
    const timestampMatch = message.match(/Timestamp: (\d+)/);
    if (!timestampMatch) {
      return new Response(
        JSON.stringify({ error: "Invalid message format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const messageTimestamp = parseInt(timestampMatch[1]);
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    if (Math.abs(now - messageTimestamp) > fiveMinutes) {
      return new Response(
        JSON.stringify({ error: "Signature expired. Please try again." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the signature matches the claimed address
    let recoveredAddress: string;
    try {
      recoveredAddress = verifyMessage(message, signature);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: "Signature does not match address" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const walletLower = address.toLowerCase();
    const walletEmail = email || `${walletLower}@wallet.urads.io`;

    if (action === "signup") {
      if (!name || !role) {
        return new Response(
          JSON.stringify({ error: "Name and role are required for signup" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if wallet already registered
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("wallet_address", walletLower)
        .maybeSingle();

      if (existingProfile) {
        return new Response(
          JSON.stringify({ error: "An account with this wallet already exists. Please sign in." }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create user with cryptographically random password (never exposed)
      const randomPassword = crypto.randomUUID() + crypto.randomUUID();

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: walletEmail,
        password: randomPassword,
        email_confirm: true,
        user_metadata: { wallet_address: walletLower, name },
      });

      if (authError) {
        console.error("Create user error:", authError);
        return new Response(
          JSON.stringify({ error: authError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const userId = authData.user.id;

      // Create profile
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({ id: userId, wallet_address: walletLower, name, email: email || null });

      if (profileError) {
        console.error("Profile insert error:", profileError);
        // Cleanup: delete the auth user
        await supabase.auth.admin.deleteUser(userId);
        return new Response(
          JSON.stringify({ error: "Failed to create profile" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });

      if (roleError) {
        console.error("Role insert error:", roleError);
      }

      // Create role-specific profile
      if (role === "advertiser") {
        await supabase.from("advertisers").insert({ user_id: userId });
      } else if (role === "influencer") {
        await supabase.from("influencers").insert({ user_id: userId });
      }

      // Generate a magic link token for session creation
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: walletEmail,
      });

      if (linkError || !linkData) {
        console.error("Generate link error:", linkError);
        return new Response(
          JSON.stringify({ error: "Account created but session generation failed. Please sign in." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          token_hash: linkData.properties.hashed_token,
          email: walletEmail,
          user_id: userId,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (action === "signin") {
      // Look up profile by wallet address
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("wallet_address", walletLower)
        .maybeSingle();

      if (profileError || !profile) {
        return new Response(
          JSON.stringify({ error: "No account found for this wallet. Please sign up first." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get the auth user to find their email
      const { data: authUser, error: authUserError } = await supabase.auth.admin.getUserById(profile.id);

      if (authUserError || !authUser?.user) {
        return new Response(
          JSON.stringify({ error: "Authentication error. Please try again." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const userEmail = authUser.user.email!;

      // Generate a magic link token for session creation
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: userEmail,
      });

      if (linkError || !linkData) {
        console.error("Generate link error:", linkError);
        return new Response(
          JSON.stringify({ error: "Session generation failed. Please try again." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          token_hash: linkData.properties.hashed_token,
          email: userEmail,
          user_id: profile.id,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
