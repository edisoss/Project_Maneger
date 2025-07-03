import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function PUT(request: NextRequest) {
  try {
    const { id, email, full_name, role, password, is_admin } = await request.json()

    if (!id || !email || !full_name) {
      return NextResponse.json({ error: "ID, email, and full name are required" }, { status: 400 })
    }

    // Create Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Update auth user
    const authUpdateData: any = {
      email,
      user_metadata: {
        full_name,
        role,
      },
    }

    // Only update password if provided
    if (password && password.trim() !== "") {
      authUpdateData.password = password
    }

    const { error: authError } = await supabase.auth.admin.updateUserById(id, authUpdateData)

    if (authError) {
      console.error("Auth error:", authError)
      return NextResponse.json({ error: `Failed to update auth user: ${authError.message}` }, { status: 500 })
    }

    // Update profile data
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .update({
        email,
        full_name,
        role,
        is_admin: is_admin || false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (profileError) {
      console.error("Profile error:", profileError)
      return NextResponse.json({ error: `Failed to update profile: ${profileError.message}` }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      profile: profileData,
      message: "User updated successfully",
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
