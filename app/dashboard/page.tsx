import { redirect } from 'next/navigation'
import { createServerClient } from "@/lib/supabase-server"
import DashboardContent from "@/components/dashboard-content"

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  try {
    const supabase = createServerClient()

    if (!supabase) {
      // If Supabase is not available, redirect to login
      redirect("/")
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      redirect("/")
    }

    return <DashboardContent user={user} />
  } catch (error) {
    console.error("Dashboard error:", error)
    redirect("/")
  }
}
