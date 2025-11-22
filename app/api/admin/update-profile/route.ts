import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * PUT /api/admin/update-profile
 * Body: { id, email, full_name, role, password?, is_admin }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, email, full_name, role, password, is_admin } = body

    if (!id || !email || !full_name) {
      return NextResponse.json(
        { error: "Missing required fields: id, email, and full_name are required" },
        { status: 400 },
      )
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Check if auth user exists
    const { data: authUser, error: getUserError } = await supabase.auth.admin.getUserById(id)

    if (getUserError && getUserError.message !== "User not found") {
      return NextResponse.json({ error: `Auth error: ${getUserError.message}` }, { status: 500 })
    }

    // Update auth user if exists
    if (authUser?.user) {
      const authUpdateData: any = { email }
      if (password) {
        authUpdateData.password = password
      }

      const { error: authUpdateError } = await supabase.auth.admin.updateUserById(id, authUpdateData)

      if (authUpdateError) {
        console.error("Auth user update error:", authUpdateError.message)
        return NextResponse.json({ error: `Auth update failed: ${authUpdateError.message}` }, { status: 500 })
      }
    }

    // Update profile in database
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .update({
        email,
        full_name,
        role: role || "user",
        is_admin: is_admin || false,
      })
      .eq("id", id)
      .select()
      .single()

    if (profileError) {
      console.error("Profile update error:", profileError.message)
      return NextResponse.json({ error: `Profile update failed: ${profileError.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, profile })
  } catch (error) {
    console.error("Update error:", error)
    return NextResponse.json({ error: "Database error updating user" }, { status: 500 })
  }
}
