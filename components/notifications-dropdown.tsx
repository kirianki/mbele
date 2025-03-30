"use client"

import { useEffect, useState } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { communicationsApi } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

type Notification = {
  id: number
  message: string
  is_read: boolean
  created_at: string
}

type NotificationsDropdownProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function NotificationsDropdown({ open, onOpenChange }: NotificationsDropdownProps) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const unreadCount = notifications.filter((n) => !n.is_read).length

  useEffect(() => {
    if (user && open) {
      fetchNotifications()
    }
  }, [user, open])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const data = await communicationsApi.getNotifications()
      setNotifications(data)
      setError(null)
    } catch (err) {
      console.error("Error fetching notifications:", err)
      setError("Failed to load notifications")
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async () => {
    if (unreadCount === 0) return

    try {
      await communicationsApi.markNotificationsAsRead()
      setNotifications((prev) => prev.map((notification) => ({ ...notification, is_read: true })))
    } catch (err) {
      console.error("Error marking notifications as read:", err)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (!user) return null

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-auto text-xs px-2 py-1" onClick={markAsRead}>
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading ? (
          Array(3)
            .fill(null)
            .map((_, index) => (
              <div key={index} className="p-3">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))
        ) : error ? (
          <div className="p-4 text-center text-sm text-muted-foreground">{error}</div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">No notifications yet</div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem key={notification.id} className="cursor-default p-0">
              <div className={`w-full p-3 ${!notification.is_read ? "bg-muted/50" : ""}`}>
                <p className="text-sm">{notification.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatDate(notification.created_at)}</p>
              </div>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Button variant="ghost" className="w-full justify-center" asChild>
            <a href="/notifications">View all notifications</a>
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

