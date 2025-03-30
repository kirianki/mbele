export class ChatWebSocket {
  private socket: WebSocket | null = null;
  private messageHandlers: ((data: any) => void)[] = [];
  private connectionHandlers: (() => void)[] = [];
  private errorHandlers: ((error: Event | string) => void)[] = [];
  private closeHandlers: ((event: CloseEvent) => void)[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private receiverId: number;
  private url: string;
  private pingInterval: NodeJS.Timeout | null = null;
  private readonly PING_INTERVAL = 30000;

  constructor(receiverId: number) {
    this.receiverId = receiverId;
    this.url = this.buildWebSocketUrl();
  }

  private buildWebSocketUrl(): string {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      throw new Error("No access token available");
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    let wsUrl = API_URL;
    
    if (API_URL.startsWith("http://")) {
      wsUrl = API_URL.replace("http://", "ws://");
    } else if (API_URL.startsWith("https://")) {
      wsUrl = API_URL.replace("https://", "wss://");
    }
    
    return `${wsUrl}/ws/chat/${this.receiverId}/?token=${accessToken}`;
  }

  private startPing() {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      if (this.isConnected()) {
        this.send(JSON.stringify({ type: "ping" }));
      }
    }, this.PING_INTERVAL);
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  connect() {
    try {
      if (this.socket) {
        this.disconnect();
      }

      console.log("Connecting to WebSocket URL:", this.url);
      this.socket = new WebSocket(this.url);

      this.socket.onopen = () => {
        console.log("WebSocket connection established");
        this.reconnectAttempts = 0;
        this.startPing();
        this.connectionHandlers.forEach(handler => handler());
      };

      this.socket.onmessage = (event) => {
        if (typeof event.data === "string" && event.data.trim().startsWith("<!DOCTYPE")) {
          console.error("Received HTML response. Check WebSocket URL:", this.url);
          this.errorHandlers.forEach(handler => 
            handler("Server returned HTML instead of WebSocket response")
          );
          this.disconnect();
          return;
        }

        try {
          const data = JSON.parse(event.data);
          if (data.type === "pong") return;
          this.messageHandlers.forEach(handler => handler(data));
        } catch (error) {
          console.error("Error parsing WebSocket message:", error, event.data);
          this.errorHandlers.forEach(handler => 
            handler("Invalid message format from server")
          );
        }
      };

      this.socket.onerror = (errorEvent) => {
        console.error("WebSocket error:", errorEvent);
        this.errorHandlers.forEach(handler => 
          handler("Connection error occurred")
        );
      };

      this.socket.onclose = (event) => {
        console.log(`WebSocket connection closed: ${this.getCloseReason(event)}`);
        this.stopPing();
        this.closeHandlers.forEach(handler => handler(event));

        if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
          console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
          this.reconnectTimeout = setTimeout(() => this.connect(), delay);
        }
      };
    } catch (error) {
      console.error("WebSocket connection error:", error);
      this.errorHandlers.forEach(handler => 
        handler(error instanceof Error ? error.message : "Connection failed")
      );
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.stopPing();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  send(message: string) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(message);
      return true;
    }
    console.warn("WebSocket is not open. Cannot send message.");
    return false;
  }

  sendMessage(message: string) {
    return this.send(JSON.stringify({ message }));
  }

  onMessage(handler: (data: any) => void) {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  onConnect(handler: () => void) {
    this.connectionHandlers.push(handler);
    return () => {
      this.connectionHandlers = this.connectionHandlers.filter(h => h !== handler);
    };
  }

  onError(handler: (error: Event | string) => void) {
    this.errorHandlers.push(handler);
    return () => {
      this.errorHandlers = this.errorHandlers.filter(h => h !== handler);
    };
  }

  onClose(handler: (event: CloseEvent) => void) {
    this.closeHandlers.push(handler);
    return () => {
      this.closeHandlers = this.closeHandlers.filter(h => h !== handler);
    };
  }

  offError(handler: (error: Event | string) => void) {
    this.errorHandlers = this.errorHandlers.filter(h => h !== handler);
  }

  isConnected() {
    return this.socket && this.socket.readyState === WebSocket.OPEN;
  }

  private getCloseReason(event: CloseEvent): string {
    if (event.wasClean) {
      return `Clean close (code ${event.code})`;
    }
    return `Unclean close (code ${event.code})`;
  }
}