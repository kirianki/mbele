"use client"

import React, { useEffect, useState, useRef, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { communicationsApi } from "@/lib/api";
import { ChatWebSocket } from "@/lib/websocket";
import { useToast } from "@/components/ui/use-toast";

type Message = {
  id?: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: string;
  is_read: boolean;
  client_uuid?: string;
};

export default function ChatPage({ params }: { params: Promise<{ userId: string }> }) {
  const unwrappedParams = use(params);
  const receiverId = Number.parseInt(unwrappedParams.userId);
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState("");
  const [receiverUser, setReceiverUser] = useState<any>(null);
  const [socket, setSocket] = useState<ChatWebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Deduplicate messages
  const deduplicatedMessages = messages.reduce((acc, message) => {
    const exists = acc.some(m => 
      (m.id && m.id === message.id) || 
      (m.client_uuid && m.client_uuid === message.client_uuid)
    );
    return exists ? acc : [...acc, message];
  }, [] as Message[]);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await communicationsApi.getMessages();
      const allMessages = response.results || [];

      const filteredMessages = allMessages.filter(
        (msg: any) =>
          (msg.sender.id === user?.id && msg.receiver === receiverId) ||
          (msg.sender.id === receiverId && msg.receiver === user?.id)
      );

      setMessages(
        filteredMessages.map((msg: any) => ({
          id: msg.id,
          sender_id: msg.sender.id,
          receiver_id: msg.receiver,
          content: msg.content,
          created_at: msg.created_at,
          is_read: msg.is_read,
          client_uuid: crypto.randomUUID(),
        }))
      );

      if (filteredMessages.some((msg: any) => msg.sender.id === receiverId && !msg.is_read)) {
        await communicationsApi.markMessagesAsRead(user?.id);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, receiverId, toast]);

  const fetchReceiverInfo = useCallback(async () => {
    try {
      const userInfo = await communicationsApi.getUserInfo(receiverId);
      setReceiverUser({
        id: receiverId,
        username: userInfo.username || `User ${receiverId}`,
        profile_picture: userInfo.profile_picture || null,
      });
    } catch (error) {
      setReceiverUser({
        id: receiverId,
        username: `User ${receiverId}`,
        profile_picture: null,
      });
    }
  }, [receiverId]);

  const sendMessage = useCallback(async () => {
    if (!messageInput.trim() || !user) return;
  
    const tempId = crypto.randomUUID();
    const newMessage: Message = {
      sender_id: user.id,
      receiver_id: receiverId,
      content: messageInput,
      created_at: new Date().toISOString(),
      is_read: false,
      client_uuid: tempId,
    };
  
    // Optimistic update
    setMessages(prev => [...prev, newMessage]);
    setMessageInput("");
  
    try {
      // Send only via WebSocket
      if (socket?.isConnected()) {
        socket.sendMessage(messageInput);
      } else {
        throw new Error("WebSocket not connected");
      }
    } catch (error) {
      // Remove if failed to send
      setMessages(prev => prev.filter(msg => msg.client_uuid !== tempId));
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  }, [messageInput, user, receiverId, socket, toast]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
      return;
    }

    if (user) {
      fetchMessages();
      fetchReceiverInfo();

      const chatSocket = new ChatWebSocket(receiverId);
      setSocket(chatSocket);

      const handleError = (error: Event | string) => {
        setConnectionStatus("disconnected");
        toast({
          title: "Connection Error",
          description: typeof error === "string" ? error : "Connection failed",
          variant: "destructive",
          action: (
            <Button variant="ghost" onClick={() => {
              setConnectionStatus("connecting");
              chatSocket.connect();
            }}>
              Retry
            </Button>
          ),
        });
      };

      const handleConnect = () => {
        setConnectionStatus("connected");
      };

      const handleClose = () => {
        setConnectionStatus("disconnected");
      };

      const handleMessage = (data: any) => {
        // Skip if this is our own message (already added optimistically)
        if (data.sender_id === user.id) return;
        
        setMessages(prev => {
          // Skip if we already have this message
          if (data.id && prev.some(msg => msg.id === data.id)) return prev;
          
          return [
            ...prev,
            {
              id: data.id,
              sender_id: data.sender_id,
              receiver_id: user.id,
              content: data.message,
              created_at: new Date().toISOString(),
              is_read: false,
              client_uuid: crypto.randomUUID(),
            },
          ];
        });
      };

      chatSocket.onError(handleError);
      chatSocket.onConnect(handleConnect);
      chatSocket.onClose(handleClose);
      chatSocket.onMessage(handleMessage);
      chatSocket.connect();

      return () => {
        chatSocket.offError(handleError);
        chatSocket.disconnect();
      };
    }
  }, [user, authLoading, receiverId, router, toast, fetchMessages, fetchReceiverInfo]);

  useEffect(() => {
    scrollToBottom();
  }, [deduplicatedMessages, scrollToBottom]);

  if (authLoading || !user) {
    return (
      <div className="container py-10">
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="flex flex-col h-[calc(100vh-200px)] border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center">
            {receiverUser ? (
              <>
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src={receiverUser.profile_picture || ""} 
                    alt={receiverUser.username} />
                  <AvatarFallback>
                    {receiverUser.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold">{receiverUser.username}</h2>
                  <p className={`text-xs ${
                    connectionStatus === "connected" ? "text-green-600" :
                    connectionStatus === "connecting" ? "text-yellow-600" :
                    "text-red-600"
                  }`}>
                    {connectionStatus.toUpperCase()}
                  </p>
                </div>
              </>
            ) : (
              <div className="flex items-center">
                <Skeleton className="h-10 w-10 rounded-full mr-3" />
                <div>
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            )}
          </div>
          {connectionStatus === "disconnected" && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setConnectionStatus("connecting");
                socket?.connect();
              }}
            >
              Reconnect
            </Button>
          )}
        </div>

        <div className="flex-1 p-4 overflow-y-auto bg-muted/30">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div 
                  key={`loading-${i}`}
                  className={`flex ${
                    i % 2 === 0 ? "justify-start" : "justify-end"
                  }`}
                >
                  <Skeleton className="h-12 w-2/3 rounded-lg" />
                </div>
              ))}
            </div>
          ) : deduplicatedMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <p className="text-muted-foreground mb-2">No messages yet</p>
                <p className="text-sm text-muted-foreground">
                  Send a message to start the conversation
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {deduplicatedMessages.map((message) => (
                <div
                  key={message.client_uuid || `msg-${message.created_at}-${message.sender_id}`}
                  className={`flex ${
                    message.sender_id === user?.id ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      message.sender_id === user?.id 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted"
                    }`}
                  >
                    <p>{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender_id === user?.id 
                        ? "text-primary-foreground/70" 
                        : "text-muted-foreground"
                    }`}>
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              className="flex-1"
              disabled={connectionStatus !== "connected"}
            />
            <Button
              onClick={sendMessage}
              disabled={!messageInput.trim() || connectionStatus !== "connected"}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}