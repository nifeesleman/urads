/**
 * Campaign Discovery Hook
 * 
 * Provides functions to fetch and filter open campaigns for influencers
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const NICHES = [
  "Fashion", "Beauty", "Tech", "Gaming", "Fitness", "Food", 
  "Travel", "Lifestyle", "Music", "Art", "Education", "Finance"
] as const;

export const BUDGET_RANGES = [
  { label: "Under $500", min: 0, max: 500 },
  { label: "$500 - $1,000", min: 500, max: 1000 },
  { label: "$1,000 - $5,000", min: 1000, max: 5000 },
  { label: "$5,000 - $10,000", min: 5000, max: 10000 },
  { label: "Over $10,000", min: 10000, max: Infinity },
] as const;

export interface CampaignWithAdvertiser {
  id: string;
  title: string;
  description: string | null;
  niche: string[] | null;
  budget: number;
  deadline: string;
  requirements: string | null;
  status: string;
  created_at: string;
  advertiser: {
    id: string;
    company_name: string | null;
    profile: {
      name: string | null;
      avatar_url: string | null;
      verified: boolean | null;
    } | null;
  } | null;
}

export interface CampaignFilters {
  niches: string[];
  budgetRange: { min: number; max: number } | null;
  deadlineRange: "week" | "month" | "quarter" | null;
  searchQuery: string;
}

export function useCampaignDiscovery() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get influencer ID for current user
  const { data: influencer } = useQuery({
    queryKey: ["influencer", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("influencers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch all open campaigns with advertiser info
  const { 
    data: campaigns, 
    isLoading,
    error,
    refetch 
  } = useQuery({
    queryKey: ["discoverable-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select(`
          id,
          title,
          description,
          niche,
          budget,
          deadline,
          requirements,
          status,
          created_at,
          advertiser_id
        `)
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch advertiser details separately
      const advertiserIds = [...new Set(data.map(c => c.advertiser_id))];
      
      const { data: advertisers } = await supabase
        .from("public_advertisers" as any)
        .select(`
          id,
          company_name,
          user_id
        `)
        .in("id", advertiserIds);

      // Fetch profile info for advertisers
      const userIds = advertisers?.map(a => a.user_id) || [];
      const { data: profiles } = await supabase
        .from("public_profiles")
        .select("id, name, avatar_url, verified")
        .in("id", userIds);

      // Map campaigns with advertiser info
      return data.map(campaign => {
        const advertiser = advertisers?.find(a => a.id === campaign.advertiser_id);
        const profile = profiles?.find(p => p.id === advertiser?.user_id);
        
        return {
          ...campaign,
          advertiser: advertiser ? {
            id: advertiser.id,
            company_name: advertiser.company_name,
            profile: profile || null,
          } : null,
        } as CampaignWithAdvertiser;
      });
    },
  });

  // Fetch user's existing applications
  const { data: applications } = useQuery({
    queryKey: ["my-applications", influencer?.id],
    queryFn: async () => {
      if (!influencer?.id) return [];
      
      const { data, error } = await supabase
        .from("applications")
        .select("campaign_id, status")
        .eq("influencer_id", influencer.id);

      if (error) throw error;
      return data;
    },
    enabled: !!influencer?.id,
  });

  // Apply to campaign mutation
  const applyToCampaign = useMutation({
    mutationFn: async ({ campaignId, message }: { campaignId: string; message?: string }) => {
      if (!influencer?.id) {
        throw new Error("Influencer profile not found. Please complete your profile first.");
      }

      const { data, error } = await supabase
        .from("applications")
        .insert({
          campaign_id: campaignId,
          influencer_id: influencer.id,
          message: message || null,
          status: "applied",
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error("You have already applied to this campaign");
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-applications"] });
      toast.success("Application submitted successfully!");
    },
    onError: (error) => {
      toast.error("Failed to apply", { description: error.message });
    },
  });

  // Check if user has applied to a campaign
  const hasApplied = (campaignId: string): boolean => {
    return applications?.some(app => app.campaign_id === campaignId) || false;
  };

  // Get application status for a campaign
  const getApplicationStatus = (campaignId: string): string | null => {
    return applications?.find(app => app.campaign_id === campaignId)?.status || null;
  };

  return {
    campaigns: campaigns || [],
    isLoading,
    error,
    refetch,
    influencer,
    applyToCampaign,
    hasApplied,
    getApplicationStatus,
  };
}

// Filter campaigns based on criteria
export function useFilteredCampaigns(
  campaigns: CampaignWithAdvertiser[],
  filters: CampaignFilters
) {
  return useMemo(() => {
    return campaigns.filter(campaign => {
      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesTitle = campaign.title.toLowerCase().includes(query);
        const matchesDescription = campaign.description?.toLowerCase().includes(query);
        const matchesCompany = campaign.advertiser?.company_name?.toLowerCase().includes(query);
        
        if (!matchesTitle && !matchesDescription && !matchesCompany) {
          return false;
        }
      }

      // Niche filter
      if (filters.niches.length > 0) {
        const campaignNiches = campaign.niche || [];
        const hasMatchingNiche = filters.niches.some(n => campaignNiches.includes(n));
        if (!hasMatchingNiche) return false;
      }

      // Budget filter
      if (filters.budgetRange) {
        const budget = Number(campaign.budget);
        if (budget < filters.budgetRange.min || budget > filters.budgetRange.max) {
          return false;
        }
      }

      // Deadline filter
      if (filters.deadlineRange) {
        const deadline = new Date(campaign.deadline);
        const now = new Date();
        const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        switch (filters.deadlineRange) {
          case "week":
            if (diffDays > 7) return false;
            break;
          case "month":
            if (diffDays > 30) return false;
            break;
          case "quarter":
            if (diffDays > 90) return false;
            break;
        }
      }

      return true;
    });
  }, [campaigns, filters]);
}
