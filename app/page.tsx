import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import LoginForm from "@/components/login-form"

export default async function HomePage() {
  try {
    const supabase = createServerClient()

    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        redirect("/dashboard")
      }
    }
  } catch (error) {
    console.warn("Authentication check failed:", error)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ConstructPro</h1>
          <p className="text-gray-600">Professional Construction Management System</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
