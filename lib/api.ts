const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// Helper function to handle API requests with authentication
async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const accessToken = localStorage.getItem("accessToken")

  const headers = {
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...options.headers,
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    })

    // Handle 401 Unauthorized - Token might be expired
    if (response.status === 401) {
      // Try to refresh the token
      const refreshed = await refreshAccessToken()
      if (refreshed) {
        // Retry the request with the new token
        const newAccessToken = localStorage.getItem("accessToken")
        const newHeaders = {
          ...headers,
          Authorization: `Bearer ${newAccessToken}`,
        }

        return fetch(`${API_URL}${endpoint}`, {
          ...options,
          headers: newHeaders,
        })
      } else {
        // If refresh failed, throw an error
        throw new Error("Authentication failed")
      }
    }

    return response
  } catch (error) {
    console.error("API request error:", error)
    throw error
  }
}

// Function to refresh the access token
async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem("refreshToken")
  if (!refreshToken) return false

  try {
    const response = await fetch(`${API_URL}/accounts/auth/token/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: refreshToken }),
    })

    if (!response.ok) {
      throw new Error("Token refresh failed")
    }

    const data = await response.json()
    localStorage.setItem("accessToken", data.access)
    return true
  } catch (error) {
    console.error("Token refresh error:", error)
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    return false
  }
}

// Marketplace API
export const marketplaceApi = {
  // Providers
  getProviders: async (params = "") => {
    const response = await fetchWithAuth(`/marketplace/providers/${params}`)
    return response.json()
  },

  getProviderById: async (id: number) => {
    const response = await fetchWithAuth(`/marketplace/providers/${id}/`)
    return response.json()
  },

  getProviderByUserId: async (userId: number) => {
    const response = await fetchWithAuth(`/marketplace/providers/by-user/${userId}/`)
    return response.json()
  },

  getFeaturedProviders: async (lat?: number, lng?: number, radius?: number) => {
    let params = ""
    if (lat && lng && radius) {
      params = `?lat=${lat}&lng=${lng}&radius=${radius}`
    }
    const response = await fetchWithAuth(`/marketplace/providers/featured/${params}`)
    return response.json()
  },

  // Sectors
  getSectors: async () => {
    const response = await fetchWithAuth("/marketplace/sectors/")
    return response.json()
  },

  // Subcategories
  getSubcategories: async () => {
    const response = await fetchWithAuth("/marketplace/subcategories/")
    return response.json()
  },

  // Reviews
  getReviews: async (providerId?: number) => {
    let endpoint = "/marketplace/reviews/"
    if (providerId) {
      endpoint += `?provider=${providerId}`
    }
    const response = await fetchWithAuth(endpoint)
    return response.json()
  },

  createReview: async (data: { provider: number; rating: number; comment: string }) => {
    const response = await fetchWithAuth("/marketplace/reviews/", {
      method: "POST",
      body: JSON.stringify(data),
    })
    return response.json()
  },

  respondToReview: async (reviewId: number, providerResponse: string) => {
    const response = await fetchWithAuth(`/marketplace/reviews/${reviewId}/respond/`, {
      method: "PATCH",
      body: JSON.stringify({ provider_response: providerResponse }),
    })
    return response.json()
  },

  createBusinessProfile: async (data: any) => {
    const response = await fetchWithAuth("/marketplace/providers/", {
      method: "POST",
      body: JSON.stringify(data),
    })
    return response.json()
  },

  updateBusinessProfile: async (providerId: number, data: any) => {
    const response = await fetchWithAuth(`/marketplace/providers/${providerId}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
    return response.json()
  },

  uploadPortfolioItem: async (providerId: number, data: any) => {
    const response = await fetchWithAuth(`/marketplace/providers/${providerId}/portfolio/`, {
      method: "POST",
      body: JSON.stringify(data),
    })
    return response.json()
  },
}

function getAccessToken(): string | null {
  return localStorage.getItem("accessToken")
}

// Communications API
export const communicationsApi = {
  // Messages
  getMessages: async () => {
    try {
      const response = await fetchWithAuth("/communications/messages/")
      return response.json()
    } catch (error) {
      console.error("Error in getMessages:", error)
      throw error
    }
  },

  sendMessage: async (data: { receiver: number; content: string }) => {
    try {
      const response = await fetchWithAuth("/communications/messages/", {
        method: "POST",
        body: JSON.stringify(data),
      })
      return response.json()
    } catch (error) {
      console.error("Error in sendMessage:", error)
      throw error
    }
  },

  // Mark messages from a specific user as read
  markMessagesAsRead: async (senderId: number) => {
    try {
      const response = await fetchWithAuth(`/communications/messages/mark-read/${senderId}/`, {
        method: "POST",
      })
      return response.json()
    } catch (error) {
      console.error("Error marking messages as read:", error)
      throw error
    }
  },

  // Get unread message count
  getUnreadCount: async () => {
    try {
      const response = await fetchWithAuth("/communications/messages/unread-count/")
      return response.json()
    } catch (error) {
      console.error("Error getting unread count:", error)
      return { count: 0 }
    }
  },

  // Notifications
  getNotifications: async () => {
    const response = await fetchWithAuth("/communications/notifications/")
    return response.json()
  },

  markNotificationsAsRead: async () => {
    const response = await fetchWithAuth("/communications/notifications/mark-read/", {
      method: "POST",
    })
    return response.json()
  },
}

// Transactions API
export const transactionsApi = {
  // Bookings
  getBookings: async () => {
    const response = await fetchWithAuth("/transactions/bookings/")
    return response.json()
  },

  createBooking: async (data: { provider: number; service_date: string }) => {
    const response = await fetchWithAuth("/transactions/bookings/", {
      method: "POST",
      body: JSON.stringify(data),
    })
    return response.json()
  },

  // Reports
  getReports: async () => {
    const response = await fetchWithAuth("/transactions/reports/")
    return response.json()
  },

  submitReport: async (data: { provider: number; description: string }) => {
    const response = await fetchWithAuth("/transactions/reports/", {
      method: "POST",
      body: JSON.stringify(data),
    })
    return response.json()
  },

  // Favorites
  getFavorites: async () => {
    const response = await fetchWithAuth("/transactions/favorites/")
    return response.json()
  },

  addFavorite: async (providerId: number) => {
    const response = await fetchWithAuth("/transactions/favorites/", {
      method: "POST",
      body: JSON.stringify({ provider: providerId }),
    })
    return response.json()
  },

  removeFavorite: async (favoriteId: number) => {
    const response = await fetchWithAuth(`/transactions/favorites/${favoriteId}/`, {
      method: "DELETE",
    })
    return response.status === 204
  },
}

