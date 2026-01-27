import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare } from "lucide-react";
import type { Conversation } from "@/hooks/useMessages";

interface ConversationListProps {
  conversations: Conversation[];
  selectedPartnerId: string | null;
  onSelect: (partnerId: string) => void;
  isLoading?: boolean;
}

export function ConversationList({
  conversations,
  selectedPartnerId,
  onSelect,
  isLoading,
}: ConversationListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="animate-pulse text-muted-foreground">Loading conversations...</div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="font-medium text-foreground">No conversations yet</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Start a conversation with creators or brands
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="divide-y">
        {conversations.map((conv) => {
          const initials = conv.partnerName
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) || "?";

          const timeAgo = formatDistanceToNow(new Date(conv.lastMessageTime), {
            addSuffix: true,
          });

          return (
            <button
              key={conv.partnerId}
              onClick={() => onSelect(conv.partnerId)}
              className={cn(
                "w-full p-4 text-left transition-colors hover:bg-accent/50",
                selectedPartnerId === conv.partnerId && "bg-accent"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={conv.partnerAvatar || undefined} alt={conv.partnerName} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-medium flex items-center justify-center">
                      {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn(
                      "font-medium truncate",
                      conv.unreadCount > 0 && "text-foreground"
                    )}>
                      {conv.partnerName}
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {timeAgo}
                    </span>
                  </div>

                  <p className={cn(
                    "text-sm truncate mt-0.5",
                    conv.unreadCount > 0 
                      ? "text-foreground font-medium" 
                      : "text-muted-foreground"
                  )}>
                    {conv.lastMessage}
                  </p>

                  {conv.campaignTitle && (
                    <Badge variant="secondary" className="mt-2 text-[10px]">
                      {conv.campaignTitle}
                    </Badge>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
