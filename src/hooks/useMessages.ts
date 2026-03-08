/**
 * Messages Hook
 * 
 * Provides real-time messaging functionality between advertisers and influencers
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useCallback } from "react";
import { z } from "zod";

// Validation schema for message content
const messageSchema = z.object({
  content: z.string().trim().min(1, "Message cannot be empty").max(1000, "Message must be less than 1000 characters"),
  receiverId: z.string().uuid("Invalid receiver ID"),
  campaignId: z.string().uuid("Invalid campaign ID").nullable().optional(),
});

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  campaign_id: string | null;
  content: string;
  read: boolean;
  created_at: string;
  sender?: { name: string | null; avatar_url: string | null };
  receiver?: { name: string | null; avatar_url: string | null };
}

export interface Conversation {
  partnerId: string;
  partnerName: string;
  partnerAvatar: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  campaignId: string | null;
  campaignTitle: string | null;
}

/**
 * Hook to fetch all conversations for the current user
 */
export function useConversations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async (): Promise<Conversation[]> => {
      if (!user?.id) return [];

      // Fetch all messages where user is sender or receiver
      const { data: messages, error } = await supabase
        .from("messages")
        .select(`
          id,
          sender_id,
          receiver_id,
          campaign_id,
          content,
          read,
          created_at
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!messages || messages.length === 0) return [];

      // Get unique partner IDs
      const partnerIds = new Set<string>();
      messages.forEach((msg) => {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        partnerIds.add(partnerId);
      });

      // Fetch partner profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("public_profiles")
        .select("id, name, avatar_url")
        .in("id", Array.from(partnerIds));

      if (profilesError) throw profilesError;

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      // Get unique campaign IDs
      const campaignIds = new Set<string>();
      messages.forEach((msg) => {
        if (msg.campaign_id) campaignIds.add(msg.campaign_id);
      });

      // Fetch campaign titles
      let campaignMap = new Map<string, string>();
      if (campaignIds.size > 0) {
        const { data: campaigns } = await supabase
          .from("campaigns")
          .select("id, title")
          .in("id", Array.from(campaignIds));

        campaignMap = new Map(campaigns?.map((c) => [c.id, c.title]) || []);
      }

      // Group messages by partner
      const conversationMap = new Map<string, Conversation>();

      messages.forEach((msg) => {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        
        if (!conversationMap.has(partnerId)) {
          const profile = profileMap.get(partnerId);
          conversationMap.set(partnerId, {
            partnerId,
            partnerName: profile?.name || "Unknown User",
            partnerAvatar: profile?.avatar_url || null,
            lastMessage: msg.content,
            lastMessageTime: msg.created_at,
            unreadCount: 0,
            campaignId: msg.campaign_id,
            campaignTitle: msg.campaign_id ? campaignMap.get(msg.campaign_id) || null : null,
          });
        }

        // Count unread messages
        if (msg.receiver_id === user.id && !msg.read) {
          const conv = conversationMap.get(partnerId)!;
          conv.unreadCount++;
        }
      });

      return Array.from(conversationMap.values());
    },
    enabled: !!user?.id,
  });

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("conversations-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["conversations", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return query;
}

/**
 * Hook to fetch messages for a specific conversation
 */
export function useConversationMessages(partnerId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["messages", user?.id, partnerId],
    queryFn: async (): Promise<Message[]> => {
      if (!user?.id || !partnerId) return [];

      const { data, error } = await supabase
        .from("messages")
        .select(`
          id,
          sender_id,
          receiver_id,
          campaign_id,
          content,
          read,
          created_at
        `)
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch profile info for both users
      const { data: profiles } = await supabase
        .from("public_profiles")
        .select("id, name, avatar_url")
        .in("id", [user.id, partnerId]);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      return (data || []).map((msg) => ({
        ...msg,
        sender: profileMap.get(msg.sender_id) || { name: null, avatar_url: null },
        receiver: profileMap.get(msg.receiver_id) || { name: null, avatar_url: null },
      }));
    },
    enabled: !!user?.id && !!partnerId,
  });

  // Set up real-time subscription for this conversation
  useEffect(() => {
    if (!user?.id || !partnerId) return;

    const channel = supabase
      .channel(`messages-${partnerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMsg = payload.new as Message;
          // Only update if message is part of this conversation
          if (
            (newMsg.sender_id === user.id && newMsg.receiver_id === partnerId) ||
            (newMsg.sender_id === partnerId && newMsg.receiver_id === user.id)
          ) {
            queryClient.invalidateQueries({ queryKey: ["messages", user.id, partnerId] });
            queryClient.invalidateQueries({ queryKey: ["conversations", user.id] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, partnerId, queryClient]);

  return query;
}

/**
 * Hook to send a new message
 */
export function useSendMessage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      content,
      receiverId,
      campaignId,
    }: {
      content: string;
      receiverId: string;
      campaignId?: string | null;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      // Validate input
      const validated = messageSchema.parse({ content, receiverId, campaignId });

      const { data, error } = await supabase
        .from("messages")
        .insert({
          sender_id: user.id,
          receiver_id: validated.receiverId,
          campaign_id: validated.campaignId || null,
          content: validated.content,
          read: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["messages", user?.id, variables.receiverId] });
      queryClient.invalidateQueries({ queryKey: ["conversations", user?.id] });
    },
  });
}

/**
 * Hook to mark messages as read
 */
export function useMarkAsRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (partnerId: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("messages")
        .update({ read: true })
        .eq("receiver_id", user.id)
        .eq("sender_id", partnerId)
        .eq("read", false);

      if (error) throw error;
    },
    onSuccess: (_, partnerId) => {
      queryClient.invalidateQueries({ queryKey: ["messages", user?.id, partnerId] });
      queryClient.invalidateQueries({ queryKey: ["conversations", user?.id] });
    },
  });
}

/**
 * Hook to get unread message count
 */
export function useUnreadCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["unread-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      const { count, error } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("read", false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
  });
}
