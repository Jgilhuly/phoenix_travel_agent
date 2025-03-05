import { Message } from "@shared/schema";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isAI = message.role === "assistant";

  return (
    <div
      className={cn(
        "flex gap-3 mb-4",
        isAI ? "justify-start" : "justify-end"
      )}
    >
      <div
        className={cn(
          "rounded-lg px-4 py-2 max-w-[80%]",
          isAI
            ? "bg-secondary text-secondary-foreground"
            : "bg-primary text-primary-foreground"
        )}
      >
        {message.content}
      </div>
    </div>
  );
}
