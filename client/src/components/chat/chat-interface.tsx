import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Message } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import ChatMessage from "./message";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ChatInterface() {
  const [input, setInput] = useState("");
  const { toast } = useToast();

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
  });

  const mutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", "/api/messages", {
        content,
        role: "user",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message. Please try again.",
      });
      console.error("Chat error:", error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    mutation.mutate(input);
    setInput("");
  };

  if (isLoading) {
    return (
      <Card className="h-[800px] flex flex-col">
        <CardHeader>
          <CardTitle>Chat with AI Travel Assistant</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="animate-pulse">Loading messages...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[800px] flex flex-col">
      <CardHeader>
        <CardTitle>Chat with AI Travel Assistant</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 pr-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {mutation.isPending && (
            <div className="flex justify-center py-2">
              <div className="animate-pulse text-muted-foreground">
                AI is thinking...
              </div>
            </div>
          )}
        </ScrollArea>

        <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about travel plans..."
            className="flex-1"
            disabled={mutation.isPending}
          />
          <Button type="submit" disabled={mutation.isPending}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}