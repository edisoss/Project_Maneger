import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * POST /api/admin/add-profile
 * Body: { email, full_name, role, password, is_admin? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, full_name, role, password, is_admin } = body

    console.log("Creating profile with data:", { email, full_name, role, is_admin })

    if (!email || !full_name || !password) {
      return NextResponse.json(
        { error: "Missing required fields: email, full_name, and password are required" },
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

    // Insert profile directly into the database
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        email,
        full_name,
        role: role || "user",
        password, // Include password field
        is_admin: is_admin || false,
      })
      .select()
      .single()

    if (profileError) {
      console.error("Profile insert error:", profileError.message)
      return NextResponse.json({ error: `Profile creation failed: ${profileError.message}` }, { status: 500 })
    }

    console.log("Profile created successfully:", profile)

    return NextResponse.json({ success: true, profile })
  } catch (error) {
    console.error("Auth error:", error)
    return NextResponse.json({ error: "Database error creating new user" }, { status: 500 })
  }
}
