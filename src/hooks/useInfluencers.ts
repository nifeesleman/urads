/**
 * Influencers Hook
 * 
 * Provides functions to fetch and search influencer profiles
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface InfluencerWithProfile {
  id: string;
  user_id: string;
  niche: string[] | null;
  followers: number | null;
  engagement_rate: number | null;
  platforms: string[] | null;
  country: string | null;
  price_per_post: number | null;
  bio: string | null;
  portfolio_url: string | null;
  profile: {
    id: string;
    name: string | null;
    wallet_address: string | null;
    avatar_url: string | null;
    verified: boolean | null;
  };
}

export function useInfluencers(searchQuery?: string) {
  return useQuery({
    queryKey: ["influencers", searchQuery],
    queryFn: async (): Promise<InfluencerWithProfile[]> => {
      let query = supabase
        .from("influencers")
        .select(`
          id,
          user_id,
          niche,
          followers,
          engagement_rate,
          platforms,
          country,
          price_per_post,
          bio,
          portfolio_url,
          profile:profiles!influencers_user_id_fkey (
            id,
            name,
            wallet_address,
            avatar_url,
            verified
          )
        `)
        .order("followers", { ascending: false })
        .limit(50);

      const { data, error } = await query;

      if (error) throw error;

      // Filter by search query if provided (name or wallet address)
      let results = (data || []).map(item => ({
        ...item,
        profile: Array.isArray(item.profile) ? item.profile[0] : item.profile
      })) as InfluencerWithProfile[];

      if (searchQuery) {
        const lowerSearch = searchQuery.toLowerCase();
        results = results.filter(
          (inf) =>
            inf.profile?.name?.toLowerCase().includes(lowerSearch) ||
            inf.profile?.wallet_address?.toLowerCase().includes(lowerSearch)
        );
      }

      return results;
    },
  });
}

export function useInfluencerByWallet(walletAddress: string | null) {
  return useQuery({
    queryKey: ["influencer-by-wallet", walletAddress],
    queryFn: async (): Promise<InfluencerWithProfile | null> => {
      if (!walletAddress) return null;

      const { data, error } = await supabase
        .from("influencers")
        .select(`
          id,
          user_id,
          niche,
          followers,
          engagement_rate,
          platforms,
          country,
          price_per_post,
          bio,
          portfolio_url,
          profile:profiles!influencers_user_id_fkey (
            id,
            name,
            wallet_address,
            avatar_url,
            verified
          )
        `)
        .eq("profiles.wallet_address", walletAddress.toLowerCase())
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        ...data,
        profile: Array.isArray(data.profile) ? data.profile[0] : data.profile
      } as InfluencerWithProfile;
    },
    enabled: !!walletAddress,
  });
}
