import { createBrowserClient } from "@supabase/ssr"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Singleton instance to prevent multiple GoTrueClient instances
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

export function createClientClient() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn(
      "[Supabase] Missing env vars. Authentication disabled in preview. " +
        "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    )
    return null
  }

  // Return existing instance if already created
  if (supabaseInstance) {
    return supabaseInstance
  }

  // Create new instance only if none exists
  supabaseInstance = createBrowserClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })

  return supabaseInstance
}

// Export the instance directly for consistent usage
export const supabase = createClientClient()
