import { useState, useCallback, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ConversationList } from "@/components/messaging/ConversationList";
import { ChatWindow } from "@/components/messaging/ChatWindow";
import { NewConversationDialog } from "@/components/messaging/NewConversationDialog";
import {
  useConversations,
  useConversationMessages,
  useSendMessage,
  useMarkAsRead,
} from "@/hooks/useMessages";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function InfluencerMessages() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  const { data: conversations = [], isLoading: conversationsLoading } = useConversations();
  const { data: messages = [], isLoading: messagesLoading } = useConversationMessages(selectedPartnerId);
  const sendMessageMutation = useSendMessage();
  const markAsReadMutation = useMarkAsRead();

  // Find selected conversation details
  const selectedConversation = conversations.find(
    (c) => c.partnerId === selectedPartnerId
  );

  // Mark messages as read when selecting a conversation
  useEffect(() => {
    if (selectedPartnerId && selectedConversation?.unreadCount && selectedConversation.unreadCount > 0) {
      markAsReadMutation.mutate(selectedPartnerId);
    }
  }, [selectedPartnerId, selectedConversation?.unreadCount]);

  const handleSelectConversation = useCallback((partnerId: string) => {
    const conv = conversations.find((c) => c.partnerId === partnerId);
    setSelectedPartnerId(partnerId);
    setSelectedCampaignId(conv?.campaignId || null);
  }, [conversations]);

  const handleNewConversation = useCallback((participantId: string, campaignId?: string) => {
    setSelectedPartnerId(participantId);
    setSelectedCampaignId(campaignId || null);
  }, []);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!selectedPartnerId) return;

    try {
      await sendMessageMutation.mutateAsync({
        content,
        receiverId: selectedPartnerId,
        campaignId: selectedCampaignId,
      });
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
      throw error;
    }
  }, [selectedPartnerId, selectedCampaignId, sendMessageMutation]);

  const handleBack = useCallback(() => {
    setSelectedPartnerId(null);
    setSelectedCampaignId(null);
  }, []);

  // Mobile: show either list or chat
  if (isMobile) {
    return (
      <DashboardLayout role="influencer">
        <div className="h-[calc(100vh-8rem)] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            {selectedPartnerId ? (
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            ) : (
              <h1 className="text-xl font-bold">Messages</h1>
            )}
            {!selectedPartnerId && (
              <NewConversationDialog onSelectParticipant={handleNewConversation} />
            )}
          </div>

          {selectedPartnerId ? (
            <ChatWindow
              messages={messages}
              partnerId={selectedPartnerId}
              partnerName={selectedConversation?.partnerName || null}
              partnerAvatar={selectedConversation?.partnerAvatar || null}
              campaignTitle={selectedConversation?.campaignTitle || null}
              currentUserId={user?.id || ""}
              onSendMessage={handleSendMessage}
              isLoading={messagesLoading}
            />
          ) : (
            <ConversationList
              conversations={conversations}
              selectedPartnerId={selectedPartnerId}
              onSelect={handleSelectConversation}
              isLoading={conversationsLoading}
            />
          )}
        </div>
      </DashboardLayout>
    );
  }

  // Desktop: two-column layout
  return (
    <DashboardLayout role="influencer">
      <div className="h-[calc(100vh-8rem)]">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Messages</h1>
          <NewConversationDialog onSelectParticipant={handleNewConversation} />
        </div>

        <div className="grid grid-cols-[320px,1fr] h-[calc(100%-3rem)] border rounded-lg overflow-hidden bg-background">
          {/* Conversation List */}
          <div className="border-r">
            <ConversationList
              conversations={conversations}
              selectedPartnerId={selectedPartnerId}
              onSelect={handleSelectConversation}
              isLoading={conversationsLoading}
            />
          </div>

          {/* Chat Window */}
          <ChatWindow
            messages={messages}
            partnerId={selectedPartnerId}
            partnerName={selectedConversation?.partnerName || null}
            partnerAvatar={selectedConversation?.partnerAvatar || null}
            campaignTitle={selectedConversation?.campaignTitle || null}
            currentUserId={user?.id || ""}
            onSendMessage={handleSendMessage}
            isLoading={messagesLoading}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
