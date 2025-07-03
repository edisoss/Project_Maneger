import { createClient } from "@supabase/supabase-js"

let adminClient: ReturnType<typeof createClient> | null = null

/**
 * createAdminClient
 * Server-only helper that bypasses RLS by authenticating with the
 * `SUPABASE_SERVICE_ROLE_KEY`.  NEVER use this in the browser.
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    // Extra safety – service-role key must never be shipped to the client.
    throw new Error("createAdminClient() must only be called on the server")
  }

  if (adminClient) return adminClient

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Supabase admin env vars are missing")
    return null
  }

  adminClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
    },
  })
  return adminClient
}
