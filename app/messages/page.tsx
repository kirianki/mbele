"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, Search, Clock, ArrowRight } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { communicationsApi } from "@/lib/api"

type Conversation = {
  id: number
  user_id: number
  username: string
  profile_picture?: string
  last_message: string
  last_message_time: string
  unread_count: number
}

export default function MessagesPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
    }

    if (user) {
      fetchConversations()
    }
  }, [user, authLoading, router])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const response = await communicationsApi.getMessages()
      const messages = response.results || []

      // Group messages by sender/receiver to create conversations
      const conversationsMap = new Map<number, Conversation>()

      messages.forEach((message: any) => {
        // Determine the other user in the conversation
        let otherUserId: number
        let otherUsername: string

        if (message.sender.id === user?.id) {
          // Current user is the sender
          otherUserId = message.receiver
          // We might need to fetch the username separately
          otherUsername = `User ${message.receiver}`
        } else if (message.receiver === user?.id) {
          // Current user is the receiver
          otherUserId = message.sender.id
          otherUsername = message.sender.username
        } else {
          // This message doesn't involve the current user
          return
        }

        if (!conversationsMap.has(otherUserId)) {
          conversationsMap.set(otherUserId, {
            id: otherUserId,
            user_id: otherUserId,
            username: otherUsername,
            profile_picture: undefined,
            last_message: message.content,
            last_message_time: message.created_at,
            unread_count: message.receiver === user?.id && !message.is_read ? 1 : 0,
          })
        } else {
          const existing = conversationsMap.get(otherUserId)!
          const messageTime = new Date(message.created_at)
          const existingTime = new Date(existing.last_message_time)

          if (messageTime > existingTime) {
            existing.last_message = message.content
            existing.last_message_time = message.created_at
          }

          if (message.receiver === user?.id && !message.is_read) {
            existing.unread_count += 1
          }
        }
      })

      setConversations(Array.from(conversationsMap.values()))
      setError(null)
    } catch (err) {
      console.error("Error fetching conversations:", err)
      setError("Failed to load conversations")
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (diffDays === 1) {
      return "Yesterday"
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" })
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    }
  }

  const filteredConversations = conversations.filter((conversation) =>
    conversation.username.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (authLoading || !user) {
    return (
      <div className="container py-10">
        <div className="space-y-6">
          <Skeleton className="h-12 w-1/4" />
          <Skeleton className="h-[600px]" />
        </div>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
          <p className="text-muted-foreground">Communicate with service providers and clients</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <CardTitle>Conversations</CardTitle>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search conversations..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <CardDescription>Your recent conversations with service providers and clients</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array(5)
                  .fill(null)
                  .map((_, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>
                  ))}
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={fetchConversations}>Retry</Button>
              </div>
            ) : !Array.isArray(filteredConversations) || filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No conversations yet</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md">
                  {searchQuery
                    ? "No conversations match your search"
                    : "Start a conversation with a service provider or client to see it here"}
                </p>
                {!searchQuery && <Button onClick={() => router.push("/marketplace")}>Find Service Providers</Button>}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredConversations.map((conversation) => (
                  <Link key={conversation.id} href={`/messages/${conversation.user_id}`} className="block">
                    <div
                      className={`flex items-center gap-4 p-3 rounded-md hover:bg-muted transition-colors ${conversation.unread_count > 0 ? "bg-muted/50" : ""}`}
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={conversation.profile_picture || ""} alt={conversation.username} />
                        <AvatarFallback>{conversation.username[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium truncate">{conversation.username}</h4>
                          <span className="text-xs text-muted-foreground flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTime(conversation.last_message_time)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{conversation.last_message}</p>
                      </div>
                      {conversation.unread_count > 0 && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                          {conversation.unread_count}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
                <div className="pt-4 text-center">
                  <Button variant="outline" className="w-full" onClick={() => router.push("/marketplace")}>
                    Find More Providers <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

