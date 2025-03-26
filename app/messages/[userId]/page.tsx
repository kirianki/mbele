"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { communicationsApi } from "@/lib/api"
import { ChatWebSocket } from "@/lib/websocket"
import { use } from "react"

type Message = {
  id?: number
  sender_id: number
  receiver_id: number
  content: string
  created_at: string
  is_read: boolean
  temp_id?: string
}

export default function ChatPage({ params }: { params: { userId: string } }) {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [messageInput, setMessageInput] = useState("")
  const [receiverUser, setReceiverUser] = useState<any>(null)
  const [socket, setSocket] = useState<ChatWebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Unwrap params using React.use()
  const unwrappedParams = use(params)
  const receiverId = Number.parseInt(unwrappedParams.userId)

  // Track processed message IDs to prevent duplicates
  const processedMessageIds = useRef(new Set<number>())

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
      return
    }

    if (user) {
      fetchMessages()
      fetchReceiverInfo()

      // Initialize WebSocket
      const chatSocket = new ChatWebSocket(receiverId)
      setSocket(chatSocket)
      chatSocket.connect()

      chatSocket.onMessage((data) => {
        if (data.sender_id !== user.id) {
          // Check if we already have this message (by ID if available)
          if (data.id && processedMessageIds.current.has(data.id)) {
            return
          }

          setMessages((prevMessages) => [
            ...prevMessages,
            {
              id: data.id,
              sender_id: data.sender_id,
              receiver_id: user.id,
              content: data.message,
              created_at: new Date().toISOString(),
              is_read: false,
            },
          ])

          // If the message has an ID, mark it as processed
          if (data.id) {
            processedMessageIds.current.add(data.id)
          }
        }
      })

      return () => {
        chatSocket.disconnect()
      }
    }
  }, [user, authLoading, receiverId, router])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const response = await communicationsApi.getMessages()
      const allMessages = response.results || []

      // Filter messages between current user and the receiver
      const filteredMessages = allMessages.filter(
        (msg: any) =>
          (msg.sender.id === user?.id && msg.receiver === receiverId) ||
          (msg.sender.id === receiverId && msg.receiver === user?.id),
      )

      // Clear the processed IDs set
      processedMessageIds.current.clear()

      // Add all message IDs to the processed set
      filteredMessages.forEach((msg: any) => {
        processedMessageIds.current.add(msg.id)
      })

      setMessages(
        filteredMessages.map((msg: any) => ({
          id: msg.id,
          sender_id: msg.sender.id,
          receiver_id: msg.receiver,
          content: msg.content,
          created_at: msg.created_at,
          is_read: msg.is_read,
        })),
      )

      // Mark messages as read
      if (filteredMessages.some((msg: any) => msg.sender.id === receiverId && !msg.is_read)) {
        communicationsApi.markMessagesAsRead(receiverId)
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchReceiverInfo = async () => {
    try {
      // In a real app, you would fetch user info from an API
      // For now, we'll use the information from the messages if available
      const response = await communicationsApi.getMessages()
      const allMessages = response.results || []

      // Find a message from the receiver to get their username
      const messageFromReceiver = allMessages.find((msg: any) => msg.sender.id === receiverId)

      if (messageFromReceiver) {
        setReceiverUser({
          id: receiverId,
          username: messageFromReceiver.sender.username,
          profile_picture: null,
        })
      } else {
        // Fallback if no message from receiver is found
        setReceiverUser({
          id: receiverId,
          username: `User ${receiverId}`,
          profile_picture: null,
        })
      }
    } catch (error) {
      console.error("Error fetching receiver info:", error)
      // Fallback
      setReceiverUser({
        id: receiverId,
        username: `User ${receiverId}`,
        profile_picture: null,
      })
    }
  }

  const sendMessage = async () => {
    if (!messageInput.trim() || !user) return

    const tempId = Date.now().toString()
    const newMessage: Message = {
      temp_id: tempId,
      sender_id: user.id,
      receiver_id: receiverId,
      content: messageInput,
      created_at: new Date().toISOString(),
      is_read: false,
    }

    // Add message to UI immediately
    setMessages((prevMessages) => [...prevMessages, newMessage])
    setMessageInput("")

    // Send via WebSocket if connected
    if (socket && socket.isConnected()) {
      socket.sendMessage(messageInput)
    }

    // Also send via REST API for persistence
    try {
      const response = await communicationsApi.sendMessage({
        receiver: receiverId,
        content: messageInput,
      })

      // Add the new message ID to the processed set to prevent duplicates
      if (response.id) {
        processedMessageIds.current.add(response.id)
      }

      // Update the temporary message with the real one
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.temp_id === tempId
            ? {
                id: response.id,
                sender_id: user.id,
                receiver_id: receiverId,
                content: messageInput,
                created_at: response.created_at,
                is_read: response.is_read,
              }
            : msg,
        ),
      )
    } catch (error) {
      console.error("Error sending message:", error)
      // Handle error (e.g., show error state for the message)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  if (authLoading || !user) {
    return (
      <div className="container py-10">
        <Skeleton className="h-[600px]" />
      </div>
    )
  }

  return (
    <div className="container py-6">
      <div className="flex flex-col h-[calc(100vh-200px)] border rounded-lg overflow-hidden">
        {/* Chat header */}
        <div className="flex items-center p-4 border-b">
          {receiverUser ? (
            <>
              <Avatar className="h-10 w-10 mr-3">
                <AvatarImage src={receiverUser.profile_picture || ""} alt={receiverUser.username} />
                <AvatarFallback>{receiverUser.username[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold">{receiverUser.username}</h2>
                <p className="text-xs text-muted-foreground">{socket?.isConnected() ? "Online" : "Offline"}</p>
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

        {/* Messages area */}
        <div className="flex-1 p-4 overflow-y-auto bg-muted/30">
          {loading ? (
            <div className="space-y-4">
              <div className="flex justify-start">
                <Skeleton className="h-12 w-2/3 rounded-lg" />
              </div>
              <div className="flex justify-end">
                <Skeleton className="h-12 w-2/3 rounded-lg" />
              </div>
              <div className="flex justify-start">
                <Skeleton className="h-12 w-1/2 rounded-lg" />
              </div>
            </div>
          ) : Array.isArray(messages) && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <p className="text-muted-foreground mb-2">No messages yet</p>
                <p className="text-sm text-muted-foreground">Send a message to start the conversation</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {Array.isArray(messages) &&
                messages.map((message, index) => {
                  const isSender = message.sender_id === user.id
                  return (
                    <div
                      key={message.id || message.temp_id || index}
                      className={`flex ${isSender ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          isSender ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        <p>{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${isSender ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                        >
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              className="flex-1"
            />
            <Button onClick={sendMessage} disabled={!messageInput.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

