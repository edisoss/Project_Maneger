import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Basic helpers --------------------------------------------------------------

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * POST /api/admin/add-profile
 * Body: { email, full_name, role, password, is_admin? }
 */
export async function POST(request: NextRequest) {
  try {
    // Check environment variables first
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing environment variables:", {
        supabaseUrl: !!supabaseUrl,
        supabaseServiceKey: !!supabaseServiceKey,
      })
      return NextResponse.json(
        {
          error: "Server configuration error: Missing Supabase credentials",
        },
        { status: 500 },
      )
    }

    const body = await request.json()

    const { email, full_name, role, password, is_admin } = body

    // 1 – Input validation ----------------------------------------------------
    if (!email || !full_name || !password) {
      console.error("Missing required fields:", { email: !!email, full_name: !!full_name, password: !!password })
      return NextResponse.json(
        {
          error: "Required fields: email, full_name and password.",
        },
        { status: 400 },
      )
    }

    if (!isValidEmail(email)) {
      console.error("Invalid email format:", email)
      return NextResponse.json(
        {
          error: "Invalid e-mail format.",
        },
        { status: 400 },
      )
    }

    if (password.length < 6) {
      console.error("Password too short")
      return NextResponse.json(
        {
          error: "Password must be at least 6 characters long.",
        },
        { status: 400 },
      )
    }

    // 2 – Supabase client (service role) -------------------------------------
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // 3 – Check if user already exists ----------------------------------------
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
      console.error("Error listing users:", listError)
      return NextResponse.json(
        {
          error: `Failed to check existing users: ${listError.message}`,
        },
        { status: 500 },
      )
    }

    const existingUser = existingUsers.users.find((u) => u.email === email)
    let userId: string

    if (existingUser) {
      userId = existingUser.id
    } else {
      // 4 – Create new auth user --------------------------------------------
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name,
          role: role || "user",
        },
      })

      if (authError) {
        console.error("Auth user creation error:", authError)
        return NextResponse.json(
          {
            error: `Auth user creation failed: ${authError.message}`,
          },
          { status: 500 },
        )
      }

      if (!authUser.user) {
        console.error("Auth user creation returned no user")
        return NextResponse.json(
          {
            error: "Auth user creation failed: No user returned",
          },
          { status: 500 },
        )
      }

      userId = authUser.user.id
    }

    // 5 – Insert / upsert profile --------------------------------------------
    const profileData = {
      id: userId,
      email,
      full_name,
      role: role || "user",
      is_admin: is_admin ?? false,
      password, // Store plain password as per your schema
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .upsert(profileData, { onConflict: "id" })
      .select()
      .single()

    if (profileError) {
      console.error("Profile upsert error:", profileError)
      return NextResponse.json(
        {
          error: `Profile creation failed: ${profileError.message}`,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      profile,
      message: "User created successfully",
    })
  } catch (err: any) {
    console.error("=== UNHANDLED ERROR IN ADD-PROFILE API ===")
    console.error("Error type:", typeof err)
    console.error("Error message:", err?.message)
    console.error("Error stack:", err?.stack)
    console.error("Full error object:", err)

    return NextResponse.json(
      {
        error: "Unexpected server error occurred",
        details: err?.message || "Unknown error",
        type: typeof err,
      },
      { status: 500 },
    )
  }
}
