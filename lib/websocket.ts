export class ChatWebSocket {
  private socket: WebSocket | null = null
  private messageHandlers: ((data: any) => void)[] = []
  private connectionHandlers: (() => void)[] = []
  private errorHandlers: ((error: Event) => void)[] = []
  private closeHandlers: ((event: CloseEvent) => void)[] = []
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectTimeout: NodeJS.Timeout | null = null
  private receiverId: number

  constructor(receiverId: number) {
    this.receiverId = receiverId
  }

  connect() {
    const accessToken = localStorage.getItem("accessToken")
    if (!accessToken) {
      console.error("No access token available")
      return
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const wsUrl = API_URL.replace(/^https?:/, wsProtocol)

    this.socket = new WebSocket(`${wsUrl}/ws/chat/${this.receiverId}/?token=${accessToken}`)

    this.socket.onopen = () => {
      console.log("WebSocket connection established")
      this.reconnectAttempts = 0
      this.connectionHandlers.forEach((handler) => handler())
    }

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        this.messageHandlers.forEach((handler) => handler(data))
      } catch (error) {
        console.error("Error parsing WebSocket message:", error)
      }
    }

    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error)
      this.errorHandlers.forEach((handler) => handler(error))
    }

    this.socket.onclose = (event) => {
      console.log("WebSocket connection closed:", event)
      this.closeHandlers.forEach((handler) => handler(event))

      // Attempt to reconnect if not a clean close
      if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
        console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`)

        this.reconnectTimeout = setTimeout(() => {
          this.connect()
        }, delay)
      }
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
  }

  sendMessage(message: string) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ message }))
      return true
    }
    return false
  }

  onMessage(handler: (data: any) => void) {
    this.messageHandlers.push(handler)
    return () => {
      this.messageHandlers = this.messageHandlers.filter((h) => h !== handler)
    }
  }

  onConnect(handler: () => void) {
    this.connectionHandlers.push(handler)
    return () => {
      this.connectionHandlers = this.connectionHandlers.filter((h) => h !== handler)
    }
  }

  onError(handler: (error: Event) => void) {
    this.errorHandlers.push(handler)
    return () => {
      this.errorHandlers = this.errorHandlers.filter((h) => h !== handler)
    }
  }

  onClose(handler: (event: CloseEvent) => void) {
    this.closeHandlers.push(handler)
    return () => {
      this.closeHandlers = this.closeHandlers.filter((h) => h !== handler)
    }
  }

  isConnected() {
    return this.socket && this.socket.readyState === WebSocket.OPEN
  }
}

