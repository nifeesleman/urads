import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquarePlus, Loader2 } from "lucide-react";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import type { Message } from "@/hooks/useMessages";

interface ChatWindowProps {
  messages: Message[];
  partnerId: string | null;
  partnerName: string | null;
  partnerAvatar: string | null;
  campaignTitle: string | null;
  currentUserId: string;
  onSendMessage: (content: string) => Promise<void>;
  isLoading?: boolean;
}

function formatDateHeader(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM d, yyyy");
}

export function ChatWindow({
  messages,
  partnerId,
  partnerName,
  partnerAvatar,
  campaignTitle,
  currentUserId,
  onSendMessage,
  isLoading,
}: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!partnerId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-muted/20">
        <MessageSquarePlus className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-foreground">Select a conversation</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          Choose a conversation from the list or start a new one to begin messaging
        </p>
      </div>
    );
  }

  const initials = partnerName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  // Group messages by date
  const groupedMessages: { date: Date; messages: Message[] }[] = [];
  messages.forEach((msg) => {
    const msgDate = new Date(msg.created_at);
    const lastGroup = groupedMessages[groupedMessages.length - 1];

    if (!lastGroup || !isSameDay(lastGroup.date, msgDate)) {
      groupedMessages.push({ date: msgDate, messages: [msg] });
    } else {
      lastGroup.messages.push(msg);
    }
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4 flex items-center gap-3 bg-background">
        <Avatar className="h-10 w-10">
          <AvatarImage src={partnerAvatar || undefined} alt={partnerName || "User"} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{partnerName || "Unknown User"}</h3>
          {campaignTitle && (
            <Badge variant="secondary" className="text-[10px] mt-0.5">
              {campaignTitle}
            </Badge>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-sm text-muted-foreground">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedMessages.map((group, groupIndex) => (
              <div key={groupIndex}>
                {/* Date header */}
                <div className="flex items-center gap-4 my-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[10px] font-medium text-muted-foreground uppercase">
                    {formatDateHeader(group.date)}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Messages for this date */}
                <div className="space-y-3">
                  {group.messages.map((msg, msgIndex) => {
                    const isSent = msg.sender_id === currentUserId;
                    const showAvatar =
                      !isSent &&
                      (msgIndex === 0 ||
                        group.messages[msgIndex - 1].sender_id !== msg.sender_id);

                    return (
                      <MessageBubble
                        key={msg.id}
                        content={msg.content}
                        timestamp={msg.created_at}
                        isSent={isSent}
                        senderName={msg.sender?.name}
                        senderAvatar={msg.sender?.avatar_url}
                        showAvatar={showAvatar}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <MessageInput
        onSend={onSendMessage}
        disabled={!partnerId}
        placeholder={`Message ${partnerName || ""}...`}
      />
    </div>
  );
}
