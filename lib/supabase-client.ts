import { createBrowserClient } from "@supabase/ssr"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let client: ReturnType<typeof createBrowserClient> | null | "stub" = null

export function createClientClient() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    if (client !== "stub") {
      console.warn(
        "[Supabase] Missing env vars. Authentication disabled in preview. " +
          "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      )
      client = "stub"
    }
    return null
  }

  if (!client || client === "stub") {
    client = createBrowserClient(SUPABASE_URL, SUPABASE_KEY)
  }
  return client
}
