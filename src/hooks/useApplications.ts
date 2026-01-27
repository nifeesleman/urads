/**
 * Applications Hook
 * 
 * Provides functions to fetch and manage influencer applications
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ApplicationWithCampaign {
  id: string;
  campaign_id: string;
  influencer_id: string;
  status: "applied" | "accepted" | "rejected";
  message: string | null;
  created_at: string;
  updated_at: string;
  campaign: {
    id: string;
    title: string;
    description: string | null;
    budget: number;
    deadline: string;
    status: string;
    niche: string[] | null;
    advertiser: {
      id: string;
      company_name: string | null;
      profile: {
        name: string | null;
        avatar_url: string | null;
      };
    };
  };
}

/**
 * Hook to fetch all applications for the current influencer
 */
export function useInfluencerApplications() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["influencer-applications", user?.id],
    queryFn: async (): Promise<ApplicationWithCampaign[]> => {
      if (!user?.id) return [];

      // First get the influencer record
      const { data: influencer, error: influencerError } = await supabase
        .from("influencers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (influencerError) throw influencerError;
      if (!influencer) return [];

      // Fetch applications with campaign and advertiser details
      const { data, error } = await supabase
        .from("applications")
        .select(`
          id,
          campaign_id,
          influencer_id,
          status,
          message,
          created_at,
          updated_at,
          campaign:campaigns!inner(
            id,
            title,
            description,
            budget,
            deadline,
            status,
            niche,
            advertiser:advertisers!inner(
              id,
              company_name,
              profile:profiles!inner(
                name,
                avatar_url
              )
            )
          )
        `)
        .eq("influencer_id", influencer.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform the data to flatten nested structures
      return (data || []).map((app: any) => ({
        ...app,
        campaign: {
          ...app.campaign,
          advertiser: Array.isArray(app.campaign.advertiser) 
            ? {
                ...app.campaign.advertiser[0],
                profile: Array.isArray(app.campaign.advertiser[0]?.profile)
                  ? app.campaign.advertiser[0].profile[0]
                  : app.campaign.advertiser[0]?.profile
              }
            : {
                ...app.campaign.advertiser,
                profile: Array.isArray(app.campaign.advertiser?.profile)
                  ? app.campaign.advertiser.profile[0]
                  : app.campaign.advertiser?.profile
              }
        }
      }));
    },
    enabled: !!user?.id,
  });
}

/**
 * Hook to withdraw an application
 */
export function useWithdrawApplication() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (applicationId: string) => {
      // Get the influencer ID first
      const { data: influencer } = await supabase
        .from("influencers")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (!influencer) throw new Error("Influencer not found");

      // Delete the application (only if status is 'applied')
      const { error } = await supabase
        .from("applications")
        .delete()
        .eq("id", applicationId)
        .eq("influencer_id", influencer.id)
        .eq("status", "applied");

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["influencer-applications", user?.id] });
    },
  });
}
