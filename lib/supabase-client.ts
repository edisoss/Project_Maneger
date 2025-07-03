import { createBrowserClient } from "@supabase/ssr"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Singleton instance to prevent multiple GoTrueClient instances
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

export function createClientClient() {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return null
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn(
      "[Supabase] Missing environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file"
    )
    return null
  }

  // Return existing instance if already created
  if (supabaseInstance) {
    return supabaseInstance
  }

  try {
    // Create new instance only if none exists
    supabaseInstance = createBrowserClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
    })

    return supabaseInstance
  } catch (error) {
    console.error("[Supabase] Failed to create client:", error)
    return null
  }
}

// Export the instance directly for consistent usage
export const supabase = createClientClient()