import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";

interface MessageInputProps {
  onSend: (message: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

const MAX_LENGTH = 1000;

export function MessageInput({
  onSend,
  disabled = false,
  placeholder = "Type a message...",
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(async () => {
    const trimmed = message.trim();
    if (!trimmed || isSending || disabled) return;

    setIsSending(true);
    try {
      await onSend(trimmed);
      setMessage("");
      textareaRef.current?.focus();
    } finally {
      setIsSending(false);
    }
  }, [message, isSending, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_LENGTH) {
      setMessage(value);
    }
  }, []);

  const charCount = message.length;
  const isOverLimit = charCount > MAX_LENGTH;
  const canSend = message.trim().length > 0 && !isOverLimit && !isSending && !disabled;

  return (
    <div className="border-t bg-background p-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isSending}
            className="min-h-[44px] max-h-[120px] resize-none pr-16"
            rows={1}
          />
          <span className="absolute bottom-2 right-2 text-[10px] text-muted-foreground">
            {charCount}/{MAX_LENGTH}
          </span>
        </div>
        <Button
          onClick={handleSend}
          disabled={!canSend}
          size="icon"
          className="shrink-0"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}
