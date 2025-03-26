"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

type User = {
  id: number
  username: string
  email: string
  role: string
  role_display: string
  first_name: string
  last_name: string
  profile_picture?: string
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<boolean>
  updateProfile: (profileData: Partial<User>) => Promise<void>
}

type RegisterData = {
  username: string
  email: string
  password: string
  password2: string
  role: string
  first_name: string
  last_name: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

  useEffect(() => {
    const initAuth = async () => {
      const accessToken = localStorage.getItem("accessToken")
      if (accessToken) {
        try {
          const success = await refreshToken()
          if (success) {
            await fetchUserProfile()
          }
        } catch (error) {
          console.error("Auth initialization error:", error)
          localStorage.removeItem("accessToken")
          localStorage.removeItem("refreshToken")
        }
      }
      setIsLoading(false)
    }

    initAuth()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken")
      if (!accessToken) return

      const response = await fetch(`${API_URL}/accounts/profile/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        throw new Error("Failed to fetch user profile")
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
    }
  }

  const login = async (username: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/accounts/auth/token/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Login failed")
      }

      const data = await response.json()
      localStorage.setItem("accessToken", data.access)
      localStorage.setItem("refreshToken", data.refresh)

      setUser({
        id: data.user_id,
        username: data.username,
        email: data.email,
        role: data.role,
        role_display: data.role_display,
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        profile_picture: data.profile_picture,
      })

      toast({
        title: "Login successful",
        description: `Welcome back, ${data.username}!`,
      })

      router.push("/dashboard")
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (userData: RegisterData) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/accounts/auth/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = Object.values(errorData).flat().join(", ")
        throw new Error(errorMessage || "Registration failed")
      }

      toast({
        title: "Registration successful",
        description: "You can now log in with your credentials",
      })

      router.push("/auth/login")
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      const refreshToken = localStorage.getItem("refreshToken")
      if (refreshToken) {
        await fetch(`${API_URL}/accounts/auth/logout/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh: refreshToken }),
        })
      }
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      localStorage.removeItem("accessToken")
      localStorage.removeItem("refreshToken")
      setUser(null)
      setIsLoading(false)
      router.push("/")
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      })
    }
  }

  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem("refreshToken")
      if (!refreshToken) return false

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
      setUser(null)
      return false
    }
  }

  const updateProfile = async (profileData: Partial<User>) => {
    setIsLoading(true)
    try {
      const accessToken = localStorage.getItem("accessToken")
      if (!accessToken) throw new Error("Not authenticated")

      // Use the user ID in the URL
      const response = await fetch(`${API_URL}/accounts/profile/${user?.id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(profileData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = Object.values(errorData).flat().join(", ")
        throw new Error(errorMessage || "Profile update failed")
      }

      const data = await response.json()
      setUser((prev) => (prev ? { ...prev, ...data.user } : null))

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      })
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        refreshToken,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

