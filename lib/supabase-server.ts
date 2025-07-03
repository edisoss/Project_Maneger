import { createServerClient as createSupabaseServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// When env vars are missing we return a *stub* client so the app doesn’t crash
export function createServerClient() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn(
      "[Supabase] Missing env vars. Authentication disabled in preview. " +
        "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    )
    return null
  }

  const cookieStore = cookies()
  return createSupabaseServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })
}
