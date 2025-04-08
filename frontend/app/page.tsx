"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/components/auth-provider"
import { Footer } from "@/components/footer"

export default function Home() {
  const { user, loading, login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [redirected, setRedirected] = useState(false)
  const router = useRouter()

  // One-time redirect to dashboard if user is already logged in
  useEffect(() => {
    // Avoid redirect loop by checking if we've already tried redirecting
    if (redirected) return;
    
    // Only proceed if auth check is complete
    if (loading) return;

    // Check for token in localStorage as a fallback check
    const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('token');
    
    if ((user || hasToken) && typeof window !== 'undefined') {
      setRedirected(true);
      router.push('/dashboard');
    }
  }, [user, loading, redirected, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      await login(email, password)
      setRedirected(true);
      router.push('/dashboard');
    } catch (error) {
      console.error("Login error:", error)
      setError("Invalid credentials. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  // Show login form if not authenticated
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Spend Wise</CardTitle>
            <CardDescription className="text-center">
              Track your expenses easily and get insights into your spending habits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col">
            <p className="text-xs text-center text-muted-foreground mt-2">
              Don't have an account? <a href="/register" className="text-primary hover:underline">Register here</a>
            </p>
          </CardFooter>
        </Card>
      </main>
      <Footer />
    </div>
  )
}

