"use client"

import type React from "react"

import { useState } from "react"
import { createClientClient } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Building2, Play } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Check if Supabase is configured
  const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const handleDemoMode = () => {
    setLoading(true)
    setError("Entering demo mode...")
    setTimeout(() => {
      window.location.href = "/dashboard"
    }, 1000)
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // If Supabase is not configured, go to demo mode
    if (!isSupabaseConfigured) {
      handleDemoMode()
      return
    }

    const supabase = createClientClient()

    if (!supabase) {
      handleDemoMode()
      return
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        window.location.href = "/dashboard"
      }
    } catch (error) {
      // Handle network errors and other fetch failures
      console.error("Login error:", error)
      setError("Network error. Entering demo mode...")
      setTimeout(() => {
        window.location.href = "/dashboard"
      }, 2000)
    }
    setLoading(false)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!isSupabaseConfigured) {
      setError("Demo mode: Sign up is not available in preview mode.")
      setLoading(false)
      return
    }

    const supabase = createClientClient()

    if (!supabase) {
      setError("Demo mode: Sign up is not available in preview mode.")
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        setError("Check your email for the confirmation link!")
      }
    } catch (error) {
      console.error("Sign up error:", error)
      setError("Network error. Sign up is not available in demo mode.")
    }
    setLoading(false)
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <Building2 className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle>Welcome to ConstructPro</CardTitle>
        <CardDescription>Manage your construction projects, workers, and daily operations</CardDescription>
      </CardHeader>
      <CardContent>
        {!isSupabaseConfigured && (
          <Alert className="mb-4 border-blue-200 bg-blue-50">
            <Play className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Demo Mode Available:</strong> Supabase is not configured. You can try the demo version below.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="manager@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required={isSupabaseConfigured}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={isSupabaseConfigured}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : isSupabaseConfigured ? "Sign In" : "Sign In (Demo Mode)"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="manager@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required={isSupabaseConfigured}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={isSupabaseConfigured}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading || !isSupabaseConfigured}>
                {loading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        {/* Demo Mode Button */}
        {!isSupabaseConfigured && (
          <div className="mt-4">
            <Button
              onClick={handleDemoMode}
              variant="outline"
              className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 bg-transparent"
              disabled={loading}
            >
              <Play className="mr-2 h-4 w-4" />
              {loading ? "Loading Demo..." : "Try Demo Mode"}
            </Button>
          </div>
        )}

        {error && (
          <Alert
            className={`mt-4 ${error.includes("Demo mode") || error.includes("demo mode") ? "border-blue-200 bg-blue-50" : ""}`}
          >
            <AlertCircle
              className={`h-4 w-4 ${error.includes("Demo mode") || error.includes("demo mode") ? "text-blue-600" : ""}`}
            />
            <AlertDescription
              className={error.includes("Demo mode") || error.includes("demo mode") ? "text-blue-800" : ""}
            >
              {error}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
