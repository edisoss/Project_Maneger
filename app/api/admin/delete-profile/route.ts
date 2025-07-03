import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Profile ID is required" }, { status: 400 })
    }

    // Create admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Get the profile first to get the email
    const { data: profile, error: profileError } = await supabase.from("profiles").select("email").eq("id", id).single()

    if (profileError) {
      console.error("Error fetching profile:", profileError)
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Try to delete the auth user, but don't fail if user doesn't exist
    try {
      const { error: authError } = await supabase.auth.admin.deleteUser(id)

      if (authError) {
        console.warn("Auth user deletion warning:", authError.message)
        // Only log the warning, don't fail the operation
        // This handles cases where the profile exists but no auth user exists
      }
    } catch (authDeleteError) {
      console.warn("Auth user deletion failed (continuing with profile deletion):", authDeleteError)
    }

    // Delete the profile from the profiles table
    const { error: deleteError } = await supabase.from("profiles").delete().eq("id", id)

    if (deleteError) {
      console.error("Error deleting profile:", deleteError)
      return NextResponse.json({ error: "Failed to delete profile" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in delete profile API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
