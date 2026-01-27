import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";

interface MessageBubbleProps {
  content: string;
  timestamp: string;
  isSent: boolean;
  senderName?: string | null;
  senderAvatar?: string | null;
  showAvatar?: boolean;
}

export function MessageBubble({
  content,
  timestamp,
  isSent,
  senderName,
  senderAvatar,
  showAvatar = true,
}: MessageBubbleProps) {
  const initials = senderName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <div
      className={cn(
        "flex gap-2 max-w-[80%]",
        isSent ? "ml-auto flex-row-reverse" : "mr-auto"
      )}
    >
      {!isSent && showAvatar && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={senderAvatar || undefined} alt={senderName || "User"} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
      )}
      
      <div className="flex flex-col gap-1">
        <div
          className={cn(
            "rounded-2xl px-4 py-2 text-sm",
            isSent
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted rounded-bl-md"
          )}
        >
          <p className="whitespace-pre-wrap break-words">{content}</p>
        </div>
        <span
          className={cn(
            "text-[10px] text-muted-foreground",
            isSent ? "text-right" : "text-left"
          )}
        >
          {format(new Date(timestamp), "h:mm a")}
        </span>
      </div>
    </div>
  );
}
