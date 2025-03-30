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

type Participant = {
  id: number
  username: string  // Changed to required string
  profile_picture?: string
}

type ConversationResponse = {
  id: number
  participant_one: number | Participant
  participant_two: number | Participant
  created_at: string
}

type Message = {
  id: number
  sender: Participant
  content: string
  created_at: string
  is_read: boolean
}

type EnhancedConversation = {
  id: number
  created_at: string
  otherParticipant: Participant
  lastMessage?: {
    content: string
    created_at: string
    is_read: boolean
  }
  unreadCount: number
}

export default function MessagesPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [conversations, setConversations] = useState<EnhancedConversation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
      return
    }
    if (user) {
      fetchConversations()
    }
  }, [user, authLoading, router])

  const getParticipantInfo = async (participantId: number): Promise<Participant> => {
    try {
      const userInfo = await communicationsApi.getUserInfo(participantId)
      return {
        id: participantId,
        username: userInfo.username || `User ${participantId}`,
        profile_picture: userInfo.profile_picture
      }
    } catch (err) {
      console.error(`Error fetching user info for ${participantId}:`, err)
      return {
        id: participantId,
        username: `User ${participantId}`,
        profile_picture: undefined
      }
    }
  }

  const fetchConversations = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await communicationsApi.getConversations()
      const conversationsData = Array.isArray(response?.results) 
        ? response.results 
        : Array.isArray(response) 
          ? response 
          : []
      
      const enhancedConversations = await Promise.all(
        conversationsData.map(async (conversation: ConversationResponse) => {
          try {
            const participantOneId = typeof conversation.participant_one === 'number' 
              ? conversation.participant_one 
              : conversation.participant_one.id
            const participantTwoId = typeof conversation.participant_two === 'number' 
              ? conversation.participant_two 
              : conversation.participant_two.id
            
            const otherParticipantId = participantOneId === user?.id 
              ? participantTwoId 
              : participantOneId
            
            const otherParticipant = await getParticipantInfo(otherParticipantId)
            
            const messagesResponse = await communicationsApi.getConversationMessages(conversation.id)
            const messagesData = Array.isArray(messagesResponse?.results) 
              ? messagesResponse.results 
              : Array.isArray(messagesResponse) 
                ? messagesResponse 
                : []
            
            const lastMessage = messagesData.length > 0 
              ? messagesData[messagesData.length - 1] 
              : undefined
            
            const unreadCount = messagesData.filter(
              (msg: Message) => msg.sender.id !== user?.id && !msg.is_read
            ).length
            
            return {
              id: conversation.id,
              created_at: conversation.created_at,
              otherParticipant,
              lastMessage: lastMessage ? {
                content: lastMessage.content,
                created_at: lastMessage.created_at,
                is_read: lastMessage.is_read
              } : undefined,
              unreadCount
            }
          } catch (err) {
            console.error(`Error processing conversation ${conversation.id}:`, err)
            const participantOneId = typeof conversation.participant_one === 'number' 
              ? conversation.participant_one 
              : conversation.participant_one.id
            const participantTwoId = typeof conversation.participant_two === 'number' 
              ? conversation.participant_two 
              : conversation.participant_two.id
            const otherParticipantId = participantOneId === user?.id 
              ? participantTwoId 
              : participantOneId
            
            return {
              id: conversation.id,
              created_at: conversation.created_at,
              otherParticipant: {
                id: otherParticipantId,
                username: `User ${otherParticipantId}`,
                profile_picture: undefined
              },
              lastMessage: undefined,
              unreadCount: 0
            }
          }
        })
      )
      
      setConversations(enhancedConversations)
    } catch (err) {
      console.error("Error fetching conversations:", err)
      setError("Failed to load conversations")
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateString: string) => {
    if (!dateString) return ""
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

  const filteredConversations = conversations.filter(conversation => {
    const username = conversation.otherParticipant.username.toLowerCase()
    return username.includes(searchQuery.toLowerCase())
  })

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
            ) : filteredConversations.length === 0 ? (
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
                  <Link 
                    key={conversation.id} 
                    href={`/messages/${conversation.otherParticipant.id}`} 
                    className="block"
                  >
                    <div
                      className={`flex items-center gap-4 p-3 rounded-md hover:bg-muted transition-colors ${
                        conversation.unreadCount > 0 ? "bg-muted/50" : ""
                      }`}
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage 
                          src={conversation.otherParticipant.profile_picture} 
                          alt={conversation.otherParticipant.username} 
                        />
                        <AvatarFallback>
                          {conversation.otherParticipant.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium truncate">
                            {conversation.otherParticipant.username}
                          </h4>
                          {conversation.lastMessage && (
                            <span className="text-xs text-muted-foreground flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatTime(conversation.lastMessage.created_at)}
                            </span>
                          )}
                        </div>
                        {conversation.lastMessage && (
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.lastMessage.content}
                          </p>
                        )}
                      </div>
                      {conversation.unreadCount > 0 && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                          {conversation.unreadCount}
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