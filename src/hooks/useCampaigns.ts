/**
 * Campaigns Hook
 * 
 * Provides functions to create and manage campaigns with escrow
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface CampaignInsert {
  title: string;
  description?: string;
  niche?: string[];
  budget: number;
  deadline: string;
  requirements?: string;
  escrow_address?: string;
  escrow_tx_hash?: string;
}

export interface EscrowInsert {
  campaign_id: string;
  amount: number;
  contract_address?: string;
  deposit_tx_hash?: string;
  status?: "pending" | "locked" | "released" | "refunded";
}

export function useCampaigns() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch advertiser ID for current user
  const { data: advertiser } = useQuery({
    queryKey: ["advertiser", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("advertisers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Create campaign mutation
  const createCampaign = useMutation({
    mutationFn: async (campaignData: CampaignInsert) => {
      if (!advertiser?.id) {
        throw new Error("Advertiser profile not found");
      }

      const { data, error } = await supabase
        .from("campaigns")
        .insert({
          ...campaignData,
          advertiser_id: advertiser.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campaign created successfully!");
    },
    onError: (error) => {
      toast.error("Failed to create campaign", { description: error.message });
    },
  });

  // Create escrow record mutation
  const createEscrowRecord = useMutation({
    mutationFn: async (escrowData: EscrowInsert) => {
      const { data, error } = await supabase
        .from("escrow")
        .insert(escrowData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["escrow"] });
    },
  });

  // Update campaign with escrow info
  const updateCampaignEscrow = useMutation({
    mutationFn: async ({
      campaignId,
      escrowAddress,
      txHash,
    }: {
      campaignId: string;
      escrowAddress: string;
      txHash: string;
    }) => {
      const { data, error } = await supabase
        .from("campaigns")
        .update({
          escrow_address: escrowAddress,
          escrow_tx_hash: txHash,
          status: "open",
        })
        .eq("id", campaignId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });

  // Fetch campaigns for current advertiser
  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ["campaigns", advertiser?.id],
    queryFn: async () => {
      if (!advertiser?.id) return [];

      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("advertiser_id", advertiser.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!advertiser?.id,
  });

  return {
    advertiser,
    campaigns,
    campaignsLoading,
    createCampaign,
    createEscrowRecord,
    updateCampaignEscrow,
  };
}
