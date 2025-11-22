import { createClientClient } from "./supabase-client"

/**
 * Utility function to verify and fix creator information for daily logs
 */
export async function verifyAndFixCreatorInfo(): Promise<void> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      console.error("Supabase client not available")
      return
    }

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return
    }

    // Check if user exists in profiles
    const { data: profile } = await supabase.from("profiles").select("id, full_name, email").eq("id", user.id).single()

    // Get logs without proper creator info
    const { data: problematicLogs } = await supabase
      .from("daily_logs")
      .select("id, created_by, created_by_user_id, created_at")
      .or("created_by_user_id.is.null,created_by.eq.admin@company.com")
      .order("created_at", { ascending: false })
      .limit(10)

    if (problematicLogs && problematicLogs.length > 0) {
      // Handle problematic logs here
    }
  } catch (error) {
    console.error("Error verifying creator info:", error)
  }
}

/**
 * Get the current user's profile information
 */
export async function getCurrentUserProfile() {
  try {
    const supabase = createClientClient()
    if (!supabase) return null

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, is_admin")
      .eq("id", user.id)
      .single()

    return {
      user,
      profile,
      displayName: profile?.full_name || profile?.email || user.email || "Unknown User",
    }
  } catch (error) {
    console.error("Error getting current user profile:", error)
    return null
  }
}
