"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"

const formSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
})

type ApiError = {
  [key: string]: string[]
}

export default function LoginPage() {
  const { login, isLoading } = useAuth()
  const router = useRouter()
  const [apiErrors, setApiErrors] = useState<ApiError>({})

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setApiErrors({})
      await login(values.username, values.password)
      router.push("/") // Redirect on successful login
    } catch (err) {
      if (err instanceof Error) {
        try {
          // Try to parse the error as JSON (assuming API returns validation errors in this format)
          const errorData = JSON.parse(err.message)
          if (typeof errorData === 'object' && errorData !== null) {
            setApiErrors(errorData)
          } else {
            setApiErrors({ non_field_errors: [err.message] })
          }
        } catch (e) {
          // If not JSON, treat as plain error message
          setApiErrors({ non_field_errors: [err.message] })
        }
      } else {
        setApiErrors({ non_field_errors: ["Login failed"] })
      }
    }
  }

  // Helper function to render API errors for a specific field
  const renderApiErrors = (fieldName: string) => {
    if (!apiErrors[fieldName]) return null
    
    return (
      <div className="text-sm text-destructive">
        {apiErrors[fieldName].map((error, index) => (
          <p key={index}>{error}</p>
        ))}
      </div>
    )
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Enter your credentials to sign in to your account</p>
        </div>

        <div className="grid gap-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your username" {...field} />
                    </FormControl>
                    <FormMessage />
                    {renderApiErrors("username")}
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter your password" {...field} />
                    </FormControl>
                    <FormMessage />
                    {renderApiErrors("password")}
                  </FormItem>
                )}
              />
              
              {/* Display non-field errors */}
              {apiErrors.non_field_errors && (
                <div className="text-sm text-destructive">
                  {apiErrors.non_field_errors.map((error, index) => (
                    <p key={index}>{error}</p>
                  ))}
                </div>
              )}
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </Form>
          <div className="text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="underline underline-offset-4 hover:text-primary">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}