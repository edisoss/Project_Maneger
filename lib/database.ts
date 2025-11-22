import { createClientClient } from "./supabase-client"
import { createAdminClient } from "./supabase-admin"

// --- utility --------------------------------------------------------------
const toInt = (n: number) => Math.max(0, Math.round(n))

export interface Material {
  id: string
  name: string
  description: string
  category: string
  unit: string
  current_stock: number
  min_stock: number
  unit_cost?: number
  supplier?: string
  location: string
  project_id?: string | null
  created_at: string
  updated_at: string
}

export interface MaterialTransaction {
  id: number
  material_id: string
  transaction_type: "added" | "used" | "adjusted" | "returned"
  quantity: number
  previous_stock: number
  new_stock: number
  reference_type?: string
  reference_id?: string
  project?: string
  notes?: string
  created_by?: string
  created_at: string
}

export interface DailyLog {
  id: string
  date: string
  project_id: string
  title: string
  description: string
  weather: string
  temperature: number
  workers_present: string[]
  materials_used: Array<{
    material_id: string
    material_name?: string
    actual_quantity: number
    visible_quantity: number
    unit?: string
  }>
  equipment_used: string[]
  hours_worked: number
  work_completed: string
  issues_encountered: string
  safety_incidents: string
  status: string
  working_place: string
  created_by: string
  created_by_user_id?: string
  created_by_user_name?: string
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  name: string
  description: string
  type: string
  status: string
  start_date: string
  end_date: string
  progress: number
  location: string
  latitude?: number
  longitude?: number
  created_at: string
  updated_at: string
}

export interface Worker {
  id: string
  name: string
  email: string
  phone: string
  role: string
  skills: string[]
  status: string
  hire_date: string
  hourly_rate: number
  created_at: string
  updated_at: string
}

export interface Role {
  id: string
  name: string
  description: string
  created_at: string
}

export interface Skill {
  id: string
  name: string
  description: string
  category: string
  created_at: string
}

export interface MaterialCategory {
  id: string
  name: string
  description: string
  created_at: string
}

export interface MaterialLocation {
  id: string
  name: string
  description: string
  address?: string
  created_at: string
}

export interface Profile {
  id: string
  email: string
  full_name: string
  role: string
  is_admin: boolean
  password: string
  created_at: string
  updated_at: string
}

export interface Activity {
  id: string
  type: "project" | "worker" | "material" | "daily_log" | "user" | "system"
  title: string
  description: string
  icon: string
  variant: "default" | "secondary" | "destructive" | "outline"
  reference_type?: string
  reference_id?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  project_id: string
  name: string
  url: string
  type: string
  size: number
  uploaded_by: string
  created_at: string
}

/**
 * Utility function to verify and fix creator information for daily logs
 */
export async function verifyAndFixCreatorInfo(): Promise<void> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
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
  } catch (error) {
    // Silent error handling
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
    return null
  }
}

// Activities functions
export async function getActivities(): Promise<Activity[]> {
  const supabase = createClientClient()
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20)

    if (error) {
      return []
    }

    return data || []
  } catch (error) {
    return []
  }
}

export async function addActivity(activity: {
  type: "project" | "worker" | "material" | "daily_log" | "user" | "system"
  title: string
  description: string
  icon: string
  variant?: "default" | "secondary" | "destructive" | "outline"
  reference_type?: string
  reference_id?: string
  created_by?: string
}): Promise<Activity | null> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      return null
    }

    const activityData = {
      ...activity,
      variant: activity.variant || "default",
      created_by: activity.created_by || null,
    }

    const { data, error } = await supabase.from("activities").insert([activityData]).select().single()

    if (error) {
      return null
    }

    return data
  } catch (error) {
    return null
  }
}

// Profiles functions
/**
 * getProfiles()
 *
 * On the **server** ➜ reads the table directly with the admin client.
 * On the **client**  ➜ fetches from `/api/admin/list-profiles`
 *                     (the route uses the service-role key).
 */
export async function getProfiles(): Promise<Profile[]> {
  try {
    // -------- Server side --------
    if (typeof window === "undefined") {
      const supabase = createAdminClient()
      if (!supabase) return []

      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, role, is_admin, created_at, updated_at")

      if (error) {
        return []
      }
      return data ?? []
    }

    // -------- Client side --------
    const res = await fetch("/api/admin/list-profiles")
    if (!res.ok) {
      return []
    }
    const json = await res.json()
    return json.profiles ?? []
  } catch (err) {
    return []
  }
}

export async function addProfile(profileData: {
  email: string
  full_name: string
  role: string
  password: string
  is_admin: boolean
}): Promise<Profile | null> {
  try {
    const response = await fetch("/api/admin/add-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profileData),
    })

    if (!response.ok) {
      const errorText = await response.text()

      // Try to parse as JSON, fallback to text
      let errorMessage = "Failed to add profile"
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.error || errorMessage
      } catch {
        errorMessage = errorText.substring(0, 200)
      }

      throw new Error(errorMessage)
    }

    const result = await response.json()
    return result.profile
  } catch (error) {
    throw error
  }
}

export async function updateProfile(
  id: string,
  profileData: {
    email: string
    full_name: string
    role: string
    password?: string
    is_admin: boolean
  },
): Promise<Profile | null> {
  try {
    const response = await fetch("/api/admin/update-profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, ...profileData }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || "Failed to update profile")
    }

    return result.profile
  } catch (error) {
    throw error
  }
}

export async function deleteProfile(id: string): Promise<boolean> {
  try {
    const response = await fetch("/api/admin/delete-profile", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || "Failed to delete profile")
    }

    return result.success
  } catch (error) {
    throw error
  }
}

// Materials functions
export async function getMaterials(): Promise<Material[]> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      return []
    }

    const { data, error } = await supabase.from("materials").select("*").order("created_at", { ascending: false })

    if (error) {
      return []
    }

    return data || []
  } catch (error) {
    return []
  }
}

export async function getMaterialsByProject(projectId: string | null): Promise<Material[]> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      return []
    }

    let query = supabase.from("materials").select("*").order("created_at", { ascending: false })

    // NULL projectId means get storage materials
    if (projectId === null) {
      query = query.is("project_id", null)
    } else {
      query = query.eq("project_id", projectId)
    }

    const { data, error } = await query

    if (error) {
      return []
    }

    return data || []
  } catch (error) {
    return []
  }
}

export async function addMaterial(
  material: Omit<Material, "id" | "created_at" | "updated_at">,
): Promise<Material | null> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      return null
    }

    // Remove last_updated from the material object since it will be set by the database
    const { last_updated, ...materialData } = material

    const { data, error } = await supabase.from("materials").insert([materialData]).select().single()

    if (error) {
      return null
    }

    // Record the initial stock transaction
    if (data && material.current_stock > 0) {
      await addMaterialTransaction({
        material_id: data.id,
        transaction_type: "added",
        quantity: material.current_stock,
        previous_stock: 0,
        new_stock: material.current_stock,
        reference_type: "initial_stock",
        notes: "Initial inventory stock",
        created_by: "admin@company.com",
      })
    }

    return data
  } catch (error) {
    return null
  }
}

export async function updateMaterial(
  id: string,
  updates: Partial<Material>,
  transactionDetails?: {
    reference_type?: string
    reference_id?: string
    notes?: string
  },
): Promise<Material | null> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      return null
    }

    // Get current material data to track stock changes
    const { data: currentMaterial } = await supabase.from("materials").select("*").eq("id", id).single()

    // Remove last_updated from updates since it will be set by the database trigger
    const { last_updated, ...updateData } = updates

    const { data, error } = await supabase.from("materials").update(updateData).eq("id", id).select().single()

    if (error) {
      return null
    }

    // Record stock adjustment transaction if stock changed
    if (
      currentMaterial &&
      updates.current_stock !== undefined &&
      updates.current_stock !== currentMaterial.current_stock
    ) {
      const quantityChange = updates.current_stock - currentMaterial.current_stock
      await addMaterialTransaction({
        material_id: id,
        transaction_type: quantityChange > 0 ? "added" : "adjusted",
        quantity: Math.abs(quantityChange),
        previous_stock: currentMaterial.current_stock,
        new_stock: updates.current_stock,
        reference_type: transactionDetails?.reference_type || "manual_adjustment",
        reference_id: transactionDetails?.reference_id, // Add reference ID
        notes:
          transactionDetails?.notes ||
          `Stock ${quantityChange > 0 ? "increased" : "decreased"} by ${Math.abs(quantityChange)}`,
        created_by: "admin@company.com",
      })
    }

    return data
  } catch (error) {
    return null
  }
}

export async function deleteMaterial(id: string): Promise<boolean> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      return false
    }

    // First try to delete related transactions (if table exists)
    try {
      const { error: transactionError } = await supabase.from("material_transactions").delete().eq("material_id", id)

      if (transactionError) {
        // Continue with material deletion even if transaction deletion fails
      }
    } catch (transactionDeleteError) {
      // Continue with material deletion
    }

    // Delete the material
    const { error } = await supabase.from("materials").delete().eq("id", id)

    if (error) {
      return false
    }

    return true
  } catch (error) {
    return false
  }
}

// Material Transactions functions
export async function getMaterialTransactions(materialId?: string): Promise<MaterialTransaction[]> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      return []
    }

    let query = supabase.from("material_transactions").select("*").order("created_at", { ascending: false })

    if (materialId) {
      query = query.eq("material_id", materialId)
    }

    const { data, error } = await query

    if (error) {
      return []
    }

    return data || []
  } catch (error) {
    return []
  }
}

// ---------------------------------------------------------------------------
// Material Transactions
// ---------------------------------------------------------------------------

export async function addMaterialTransaction(
  tx: Omit<MaterialTransaction, "id" | "created_at">,
): Promise<MaterialTransaction | null> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      return null
    }

    // Always store integers in integer columns
    const safeTx = {
      ...tx,
      quantity: toInt(tx.quantity),
      previous_stock: toInt(tx.previous_stock),
      new_stock: toInt(tx.new_stock),
    }

    const { data, error } = await supabase.from("material_transactions").insert([safeTx]).select().single()

    if (error) {
      return null
    }

    return data
  } catch (error) {
    return null
  }
}

// Daily Logs functions
export async function getDailyLogs(
  limit?: number,
  offset?: number,
  filters?: {
    dateFilter?: { fromDate: string; toDate: string; quickFilter: string }
    projectFilter?: string
  },
): Promise<DailyLog[]> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      return []
    }

    let query = supabase
      .from("daily_logs")
      .select("*")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })

    if (filters) {
      const { dateFilter, projectFilter } = filters

      // Project filter
      if (projectFilter && projectFilter !== "all") {
        query = query.eq("project_id", projectFilter)
      }

      // Date filter
      if (dateFilter) {
        const { quickFilter, fromDate, toDate } = dateFilter
        const now = new Date()
        const today = now.toISOString().split("T")[0]

        if (quickFilter === "today") {
          query = query.eq("date", today)
        } else if (quickFilter === "week") {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
          query = query.gte("date", weekAgo)
        } else if (quickFilter === "month") {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
          query = query.gte("date", monthAgo)
        } else if (quickFilter === "custom" && fromDate && toDate) {
          query = query.gte("date", fromDate).lte("date", toDate)
        }
      }
    }

    if (limit) {
      query = query.range(offset || 0, (offset || 0) + limit - 1)
    }

    const { data: logs, error: logsError } = await query

    if (logsError) {
      return []
    }

    if (!logs || logs.length === 0) {
      return []
    }

    const profilesMap = new Map()
    try {
      // Try to use admin client on server side to bypass RLS
      if (typeof window === "undefined") {
        const adminSupabase = createAdminClient()
        if (adminSupabase) {
          const { data: allProfiles } = await adminSupabase.from("profiles").select("id, full_name, email")
          if (allProfiles) {
            allProfiles.forEach((p) => profilesMap.set(p.id, p))
          }
        }
      }
    } catch (error) {
      // If admin client fails, profiles won't be available
    }

    const { data: allProjects } = await supabase.from("projects").select("id, name")

    return logs.map((log) => {
      let creatorName = "Unknown User"

      // Try to find the creator in profiles
      if (log.created_by_user_id && profilesMap.size > 0) {
        const profile = profilesMap.get(log.created_by_user_id)
        if (profile) {
          creatorName = profile.full_name || profile.email || "Unknown User"
        }
      }

      return {
        ...log,
        project_name:
          allProjects?.find((p) => p.id === log.project_id)?.name ?? (log as any).project ?? "Unknown Project",
        work_completed: (log as any).work_description ?? "",
        equipment_used: (log as any).equipment_used ?? [],
        created_by_user_name: creatorName,
      }
    })
  } catch (error) {
    return []
  }
}

export async function getDailyLogsCount(filters?: {
  dateFilter?: { fromDate: string; toDate: string; quickFilter: string }
  projectFilter?: string
}): Promise<number> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      return 0
    }

    let query = supabase.from("daily_logs").select("*", { count: "exact", head: true })

    if (filters) {
      const { dateFilter, projectFilter } = filters

      // Project filter
      if (projectFilter && projectFilter !== "all") {
        query = query.eq("project_id", projectFilter)
      }

      // Date filter
      if (dateFilter) {
        const { quickFilter, fromDate, toDate } = dateFilter
        const now = new Date()
        const today = now.toISOString().split("T")[0]

        if (quickFilter === "today") {
          query = query.eq("date", today)
        } else if (quickFilter === "week") {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
          query = query.gte("date", weekAgo)
        } else if (quickFilter === "month") {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
          query = query.gte("date", monthAgo)
        } else if (quickFilter === "custom" && fromDate && toDate) {
          query = query.gte("date", fromDate).lte("date", toDate)
        }
      }
    }

    const { count, error } = await query

    if (error) {
      return 0
    }

    return count || 0
  } catch (error) {
    return 0
  }
}

export async function addDailyLog(logData: {
  title: string
  date: string
  project_id: string
  description: string
  weather: string
  temperature: number
  workers_present: string[]
  materials_used: Array<{
    material_id: string
    actual_quantity: number
    visible_quantity: number
  }>
  equipment_used: string[]
  hours_worked: number
  work_completed: string
  issues_encountered: string
  safety_incidents: string
  status: string
  working_place: string
}): Promise<DailyLog | null> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      return null
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Check if user exists in profiles table
    let userProfile = null
    if (user?.id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("id", user.id)
        .single()

      userProfile = profile
    }

    const { project_id } = logData

    // Look up project name for NOT-NULL "project" column
    const { data: projRow } = await supabase.from("projects").select("name").eq("id", project_id).single()
    const project_name_for_column = projRow?.name ?? project_id

    // Build log object with explicit created_by_user_id
    const logToInsert = {
      project: project_name_for_column,
      title: logData.title,
      date: logData.date,
      project_id,
      weather: logData.weather,
      temperature: logData.temperature,
      workers_present: logData.workers_present,
      materials_used: logData.materials_used,
      equipment_used: logData.equipment_used,
      hours_worked: logData.hours_worked,
      work_description: logData.work_completed,
      status: logData.status,
      working_place: logData.working_place,
      created_by: "admin@company.com",
      created_by_user_id: user?.id || null,
    }

    const { data, error } = await supabase.from("daily_logs").insert([logToInsert]).select().single()

    if (error) {
      return null
    }

    // Process material usage transactions
    if (data && logData.materials_used && logData.materials_used.length > 0) {
      for (const material of logData.materials_used) {
        try {
          const { data: currentMaterial, error: fetchError } = await supabase
            .from("materials")
            .select("current_stock, name, unit")
            .eq("id", material.material_id)
            .single()

          if (fetchError) {
            continue
          }

          if (currentMaterial) {
            const newStock = toInt(currentMaterial.current_stock - material.actual_quantity)

            const { error: updateError } = await supabase
              .from("materials")
              .update({ current_stock: newStock })
              .eq("id", material.material_id)

            if (updateError) {
              continue
            }

            const workDescription =
              logData.work_completed.length > 100
                ? `${logData.work_completed.substring(0, 100)}...`
                : logData.work_completed

            await addMaterialTransaction({
              material_id: material.material_id,
              transaction_type: "used",
              quantity: material.actual_quantity,
              previous_stock: currentMaterial.current_stock,
              new_stock: newStock,
              reference_type: "daily_log",
              reference_id: data.id,
              project: `Project: ${project_name_for_column}`,
              notes: `Used for work: ${workDescription} (Actual: ${material.actual_quantity}, Visible: ${material.visible_quantity})`,
              created_by: "admin@company.com",
            })
          }
        } catch (error) {
          continue
        }
      }
    }

    const { data: project } = await supabase.from("projects").select("name").eq("id", logData.project_id).single()

    // Determine creator name from multiple sources
    let creatorName = "Unknown User"
    if (userProfile?.full_name) {
      creatorName = userProfile.full_name
    } else if (userProfile?.email) {
      creatorName = userProfile.email
    } else if (user?.email) {
      creatorName = user.email
    }

    return {
      ...data,
      project_name: project?.name || "Unknown Project",
      work_completed: data.work_description,
      created_by_user_name: creatorName,
    }
  } catch (error) {
    return null
  }
}

export async function updateDailyLog(id: string, updates: Partial<DailyLog>): Promise<DailyLog | null> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      return null
    }

    // Get the original log to see what materials were previously used
    const { data: originalLog } = await supabase
      .from("daily_logs")
      .select("materials_used, project_id, work_description, created_by_user_id")
      .eq("id", id)
      .single()

    if (!originalLog) {
      return null
    }

    // Handle the work_completed -> work_description mapping
    const updateData = { ...updates }
    if (updates.work_completed !== undefined) {
      ;(updateData as any).work_description = updates.work_completed
      delete (updateData as any).work_completed
    }

    // Keep legacy "project" column in sync if project_id is being changed
    if (updates.project_id !== undefined) {
      const { data: projRow } = await supabase.from("projects").select("name").eq("id", updates.project_id).single()
      ;(updateData as any).project = projRow?.name ?? updates.project_id
    }

    // CRITICAL: Never allow created_by_user_id to be changed in updates
    delete updateData.created_by_user_id
    delete (updateData as any).created_by

    // Update the log record without touching creator fields
    const { data, error } = await supabase.from("daily_logs").update(updateData).eq("id", id).select().single()

    if (error) {
      return null
    }

    // Handle material stock updates for edited logs using ACTUAL quantities
    if (updates.materials_used) {
      // Create maps for easier comparison using ACTUAL quantities
      const originalMaterialsMap = new Map()
      ;(originalLog.materials_used || []).forEach((mat) => {
        const actualQty = mat.actual_quantity !== undefined ? mat.actual_quantity : mat.quantity || 0
        originalMaterialsMap.set(mat.material_id, actualQty)
      })

      const newMaterialsMap = new Map()
      updates.materials_used.forEach((mat) => {
        newMaterialsMap.set(mat.material_id, mat.actual_quantity)
      })

      // Get project name for reference
      const projectId = updates.project_id || originalLog.project_id
      const { data: projRow } = await supabase.from("projects").select("name").eq("id", projectId).single()
      const projectName = projRow?.name || "Unknown Project"

      // Get the work description for detailed transaction notes
      const workDescription = updates.work_completed || originalLog.work_description || "Work description not available"
      const truncatedWorkDescription =
        workDescription.length > 100 ? `${workDescription.substring(0, 100)}...` : workDescription

      // Process all material IDs (both original and new)
      const allMaterialIds = new Set([...originalMaterialsMap.keys(), ...newMaterialsMap.keys()])

      for (const materialId of allMaterialIds) {
        const originalActualQty = originalMaterialsMap.get(materialId) || 0
        const newActualQty = newMaterialsMap.get(materialId) || 0

        // Skip if no change in actual quantity
        if (originalActualQty === newActualQty) continue

        // Calculate the net change in actual quantity
        const netChange = newActualQty - originalActualQty

        // Get current stock
        const { data: currentMaterial } = await supabase
          .from("materials")
          .select("current_stock, name, unit")
          .eq("id", materialId)
          .single()

        if (!currentMaterial) {
          continue
        }

        // Update stock based on net change in actual quantity
        const newStock = toInt(currentMaterial.current_stock - netChange)

        // Update material stock
        const { error: updateError } = await supabase
          .from("materials")
          .update({ current_stock: newStock })
          .eq("id", materialId)

        if (updateError) {
          continue
        }

        // Find the visible quantity for this material in the updated materials_used
        const materialEntry = updates.materials_used.find((m) => m.material_id === materialId)
        const visibleQty = materialEntry?.visible_quantity || 0

        const { data: existingTx } = await supabase
          .from("material_transactions")
          .select("*")
          .eq("reference_type", "daily_log")
          .eq("reference_id", id)
          .eq("material_id", materialId)
          .single()

        if (existingTx) {
          // Update the existing transaction
          // Recalculate the new_stock for the transaction based on its previous_stock
          // NOTE: This preserves the integrity of that specific transaction record relative to when it started,
          // but does NOT update subsequent transactions. This is the requested behavior to "fix original usage".
          const txNewStock = toInt(existingTx.previous_stock - newActualQty)

          await supabase
            .from("material_transactions")
            .update({
              quantity: newActualQty,
              new_stock: txNewStock,
              notes: `Used for work: ${truncatedWorkDescription} (Actual: ${newActualQty}, Visible: ${visibleQty}) - Updated`,
            })
            .eq("id", existingTx.id)
        } else {
          // No existing transaction (e.g. new material added during edit), create a new one
          const transactionType = netChange > 0 ? "used" : "returned"
          const quantity = Math.abs(netChange)

          // Create detailed transaction notes
          let transactionNotes = ""
          if (transactionType === "used") {
            transactionNotes = `Additional material used for work: ${truncatedWorkDescription} (Actual: ${Math.abs(netChange)}, Visible: ${visibleQty})`
          } else {
            transactionNotes = `Material returned from edited work: ${truncatedWorkDescription} (Actual: ${Math.abs(netChange)}, Visible: ${visibleQty})`
          }

          await addMaterialTransaction({
            material_id: materialId,
            transaction_type: transactionType,
            quantity: quantity,
            previous_stock: currentMaterial.current_stock,
            new_stock: newStock,
            reference_type: "daily_log", // Use 'daily_log' so it can be found and updated later if edited again
            reference_id: id,
            project: `Project: ${projectName}`,
            notes: transactionNotes,
            created_by: "admin@company.com",
          })
        }
      }
    }

    // Get project name and creator name for return data
    const { data: project } = await supabase.from("projects").select("name").eq("id", data.project_id).single()

    // Get creator information for the updated log
    const { data: allProfiles } = await supabase.from("profiles").select("id, full_name, email")
    const profile = allProfiles?.find((p) => p.id === data.created_by_user_id)
    const creatorName = profile?.full_name || profile?.email || "Unknown User"

    return {
      ...data,
      project_name: project?.name || "Unknown Project",
      work_completed: data.work_description,
      equipment_used: data.equipment_used,
      created_by_user_name: creatorName,
    }
  } catch (error) {
    return null
  }
}

export async function deleteDailyLog(id: string): Promise<boolean> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      return false
    }

    // Get the log data before deleting to restore material stock using ACTUAL quantities
    const { data: logToDelete } = await supabase
      .from("daily_logs")
      .select("materials_used, work_description")
      .eq("id", id)
      .single()

    if (logToDelete && logToDelete.materials_used && logToDelete.materials_used.length > 0) {
      // Get work description for transaction notes
      const workDescription = logToDelete.work_description || "Work description not available"
      const truncatedWorkDescription =
        workDescription.length > 100 ? `${workDescription.substring(0, 100)}...` : workDescription

      // Restore stock for all materials that were used in this log using ACTUAL quantities
      for (const material of logToDelete.materials_used) {
        try {
          // Handle both old format (quantity) and new format (actual_quantity)
          const actualQty = material.actual_quantity !== undefined ? material.actual_quantity : material.quantity || 0

          const { data: currentMaterial } = await supabase
            .from("materials")
            .select("current_stock")
            .eq("id", material.material_id)
            .single()

          if (currentMaterial) {
            const restoredStock = toInt(currentMaterial.current_stock + actualQty)

            await supabase.from("materials").update({ current_stock: restoredStock }).eq("id", material.material_id)

            // Record restoration transaction with work description
            await addMaterialTransaction({
              material_id: material.material_id,
              transaction_type: "returned",
              quantity: actualQty,
              previous_stock: currentMaterial.current_stock,
              new_stock: restoredStock,
              reference_type: "daily_log_delete",
              reference_id: id,
              notes: `Stock restored from deleted work: ${truncatedWorkDescription} (Actual quantity: ${actualQty})`,
              created_by: "admin@company.com",
            })
          }
        } catch (error) {
          // Continue with other materials
        }
      }
    }

    // Now delete the log
    const { error } = await supabase.from("daily_logs").delete().eq("id", id)

    if (error) {
      return false
    }

    return true
  } catch (error) {
    return false
  }
}

// Projects functions
export async function getProjects(): Promise<Project[]> {
  const supabase = createClientClient()
  if (!supabase) return []

  try {
    const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false })

    if (error) {
      return []
    }

    return data || []
  } catch (error) {
    return []
  }
}

export async function addProject(project: Omit<Project, "id" | "created_at" | "updated_at">): Promise<Project | null> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      return null
    }

    const { data, error } = await supabase.from("projects").insert([project]).select().single()

    if (error) {
      return null
    }

    return data
  } catch (error) {
    return null
  }
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      return null
    }

    const { data, error } = await supabase.from("projects").update(updates).eq("id", id).select().single()

    if (error) {
      return null
    }

    return data
  } catch (error) {
    return null
  }
}

export async function deleteProject(id: string): Promise<boolean> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      return false
    }

    const { error } = await supabase.from("projects").delete().eq("id", id)

    if (error) {
      return false
    }

    return true
  } catch (error) {
    return false
  }
}

// Workers functions
export async function getWorkers(): Promise<Worker[]> {
  const supabase = createClientClient()
  if (!supabase) return []

  try {
    const { data, error } = await supabase.from("workers").select("*").order("created_at", { ascending: false })

    if (error) {
      return []
    }

    return data || []
  } catch (error) {
    return []
  }
}

export async function addWorker(workerData: Omit<Worker, "id" | "created_at" | "updated_at">): Promise<Worker | null> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      return null
    }

    const { role, ...rest } = workerData
    const uniqueEmail = `worker_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}@placeholder.local`
    const insertObj = {
      ...rest,
      role,
      email: uniqueEmail,
    }

    const { data, error } = await supabase.from("workers").insert([insertObj]).select().single()

    if (error) {
      return null
    }

    return data
  } catch (error) {
    return null
  }
}

export async function updateWorker(id: string, updates: Partial<Worker>): Promise<Worker | null> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      return null
    }

    const { role, ...rest } = updates
    const updateObj = role ? { ...rest, role } : rest

    const { data, error } = await supabase.from("workers").update(updateObj).eq("id", id).select().single()

    if (error) {
      return null
    }

    return data
  } catch (error) {
    return null
  }
}

export async function deleteWorker(id: string): Promise<boolean> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      return false
    }

    const { error } = await supabase.from("workers").delete().eq("id", id)

    if (error) {
      return false
    }

    return true
  } catch (error) {
    return false
  }
}

// Roles functions
export async function getRoles(): Promise<Role[]> {
  const supabase = createClientClient()
  if (!supabase) return []

  try {
    const { data, error } = await supabase.from("roles").select("*").order("name", { ascending: true })

    if (error) {
      return []
    }

    return data || []
  } catch (error) {
    return []
  }
}

export async function addRole(name: string, description?: string): Promise<Role | null> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      return null
    }

    const { data, error } = await supabase.from("roles").insert([{ name, description }]).select().single()

    if (error) {
      return null
    }

    return data
  } catch (error) {
    return null
  }
}

export async function deleteRole(id: string): Promise<boolean> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      return false
    }

    const { error } = await supabase.from("roles").delete().eq("id", id)

    if (error) {
      return false
    }

    return true
  } catch (error) {
    return false
  }
}

// Skills functions
export async function getSkills(): Promise<Skill[]> {
  const supabase = createClientClient()
  if (!supabase) return []

  try {
    const { data, error } = await supabase.from("skills").select("*").order("name", { ascending: true })

    if (error) {
      return []
    }

    return data || []
  } catch (error) {
    return []
  }
}

export async function addSkill(name: string, description?: string, category?: string): Promise<Skill | null> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      return null
    }

    const { data, error } = await supabase.from("skills").insert([{ name, description, category }]).select().single()

    if (error) {
      return null
    }

    return data
  } catch (error) {
    return null
  }
}

export async function deleteSkill(id: string): Promise<boolean> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      return false
    }

    const { error } = await supabase.from("skills").delete().eq("id", id)

    if (error) {
      return false
    }

    return true
  } catch (error) {
    return false
  }
}

// Material Categories functions
export async function getMaterialCategories(): Promise<MaterialCategory[]> {
  const supabase = createClientClient()
  if (!supabase) return []

  try {
    const { data, error } = await supabase.from("material_categories").select("*").order("name", { ascending: true })

    if (error) {
      return []
    }

    return data || []
  } catch (error) {
    return []
  }
}

export async function addMaterialCategory(name: string, description?: string): Promise<MaterialCategory | null> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      return null
    }

    const { data, error } = await supabase.from("material_categories").insert([{ name, description }]).select().single()

    if (error) {
      return null
    }

    return data
  } catch (error) {
    return null
  }
}

export async function deleteMaterialCategory(id: string): Promise<boolean> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      return false
    }

    const { error } = await supabase.from("material_categories").delete().eq("id", id)

    if (error) {
      return false
    }

    return true
  } catch (error) {
    return false
  }
}

// Material Locations functions
export async function getMaterialLocations(): Promise<MaterialLocation[]> {
  const supabase = createClientClient()
  if (!supabase) return []

  try {
    const { data, error } = await supabase.from("material_locations").select("*").order("name", { ascending: true })

    if (error) {
      return []
    }

    return data || []
  } catch (error) {
    return []
  }
}

export async function addMaterialLocation(name: string, description?: string): Promise<MaterialLocation | null> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      return null
    }

    // Build insert object with only valid columns
    const insertObj: { name: string; description?: string } = { name }
    if (description) insertObj.description = description

    const { data, error } = await supabase.from("material_locations").insert([insertObj]).select().single()

    if (error) {
      return null
    }

    return data
  } catch (error) {
    return null
  }
}

export async function deleteMaterialLocation(id: string): Promise<boolean> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      return false
    }

    const { error } = await supabase.from("material_locations").delete().eq("id", id)

    if (error) {
      return false
    }

    return true
  } catch (error) {
    return false
  }
}

export interface MaterialTransfer {
  id: string
  material_id: string
  from_project_id?: string | null
  to_project_id?: string | null
  quantity: number
  transfer_type: "assign" | "transfer" | "to_storage" | "from_storage"
  notes?: string
  transferred_by?: string
  transferred_at: string
  created_at: string
}

export async function transferMaterial(transfer: {
  material_id: string
  from_project_id?: string | null
  to_project_id?: string | null
  quantity: number
  notes?: string
  transferred_by?: string
}): Promise<boolean> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      return false
    }

    if (transfer.quantity <= 0) {
      return false
    }

    // Determine transfer type
    let transferType: "assign" | "transfer" | "to_storage" | "from_storage"
    if (!transfer.from_project_id && transfer.to_project_id) {
      transferType = "from_storage"
    } else if (transfer.from_project_id && !transfer.to_project_id) {
      transferType = "to_storage"
    } else if (!transfer.from_project_id && !transfer.to_project_id) {
      return false
    } else {
      transferType = "transfer"
    }

    // Fetch current material details
    const { data: currentMaterial, error: fetchError } = await supabase
      .from("materials")
      .select("current_stock, project_id, name, unit, category, description, min_stock, location")
      .eq("id", transfer.material_id)
      .single()

    if (fetchError) {
      return false
    }

    if (!currentMaterial) {
      return false
    }

    if (transfer.quantity > currentMaterial.current_stock) {
      return false
    }

    // Check if same material exists at destination
    let existingAtDestination = null
    const destinationProjectId = transfer.to_project_id === undefined ? null : transfer.to_project_id

    const { data: existingMaterials, error: checkError } = await supabase
      .from("materials")
      .select("id, current_stock, project_id")
      .eq("name", currentMaterial.name)
      .eq("unit", currentMaterial.unit)
      .neq("id", transfer.material_id)

    if (!checkError && existingMaterials) {
      if (destinationProjectId === null) {
        existingAtDestination = existingMaterials?.find((m) => m.project_id === null)
      } else {
        existingAtDestination = existingMaterials?.find((m) => m.project_id === destinationProjectId)
      }
    }

    // Reduce stock at source
    const newSourceStock = toInt(currentMaterial.current_stock - transfer.quantity)

    const { error: updateError } = await supabase
      .from("materials")
      .update({ current_stock: newSourceStock })
      .eq("id", transfer.material_id)

    if (updateError) {
      return false
    }

    if (existingAtDestination) {
      const newDestStock = toInt(existingAtDestination.current_stock + transfer.quantity)

      const { error: destUpdateError } = await supabase
        .from("materials")
        .update({ current_stock: newDestStock })
        .eq("id", existingAtDestination.id)

      if (destUpdateError) {
        return false
      }
    } else {
      const newMaterialData = {
        name: currentMaterial.name,
        category: currentMaterial.category,
        description: currentMaterial.description,
        unit: currentMaterial.unit,
        current_stock: transfer.quantity,
        min_stock: currentMaterial.min_stock,
        location: currentMaterial.location,
        project_id: destinationProjectId,
      }

      const { error: createError } = await supabase.from("materials").insert([newMaterialData])

      if (createError) {
        return false
      }
    }

    // Record the transfer
    const { error: transferError } = await supabase.from("material_transfers").insert([
      {
        material_id: transfer.material_id,
        from_project_id: transfer.from_project_id,
        to_project_id: destinationProjectId,
        quantity: transfer.quantity,
        transfer_type: transferType,
        notes: transfer.notes,
        transferred_by: transfer.transferred_by || "admin@company.com",
        transferred_at: new Date().toISOString(),
      },
    ])

    if (transferError) {
      return false
    }

    // Record transaction when moving to/from storage
    if (transferType === "from_storage" || transferType === "to_storage") {
      const transactionType = transferType === "from_storage" ? "used" : "returned"

      await addMaterialTransaction({
        material_id: transfer.material_id,
        transaction_type: transactionType,
        quantity: transfer.quantity,
        previous_stock: currentMaterial.current_stock,
        new_stock: newSourceStock,
        reference_type: "material_transfer",
        reference_id: transfer.material_id,
        project: destinationProjectId ? `Project: ${destinationProjectId}` : "Storage",
        notes: `Material transfer: ${transfer.notes || ""}`,
        created_by: transfer.transferred_by || "admin@company.com",
      })
    }

    return true
  } catch (error) {
    return false
  }
}

export async function getMaterialTransfers(materialId?: string): Promise<MaterialTransfer[]> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      return []
    }

    let query = supabase.from("material_transfers").select("*").order("transferred_at", { ascending: false })

    if (materialId) {
      query = query.eq("material_id", materialId)
    }

    const { data, error } = await query

    if (error) {
      return []
    }

    return data || []
  } catch (error) {
    return []
  }
}

export async function getDailyLogsStats(filters?: {
  dateFilter?: { fromDate: string; toDate: string; quickFilter: string }
  projectFilter?: string
}): Promise<{
  totalLogs: number
  thisWeekCount: number
  thisMonthCount: number
  activeProjects: number
}> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      return { totalLogs: 0, thisWeekCount: 0, thisMonthCount: 0, activeProjects: 0 }
    }

    // Get all logs to calculate statistics
    let query = supabase.from("daily_logs").select("date, project_id").order("created_at", { ascending: false })

    if (filters) {
      const { dateFilter, projectFilter } = filters

      // Project filter
      if (projectFilter && projectFilter !== "all") {
        query = query.eq("project_id", projectFilter)
      }

      // Date filter
      if (dateFilter) {
        const { quickFilter, fromDate, toDate } = dateFilter
        const now = new Date()
        const today = now.toISOString().split("T")[0]

        if (quickFilter === "today") {
          query = query.eq("date", today)
        } else if (quickFilter === "week") {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
          query = query.gte("date", weekAgo)
        } else if (quickFilter === "month") {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
          query = query.gte("date", monthAgo)
        } else if (quickFilter === "custom" && fromDate && toDate) {
          query = query.gte("date", fromDate).lte("date", toDate)
        }
      }
    }

    const { data: allLogs, error } = await query

    if (error || !allLogs) {
      return { totalLogs: 0, thisWeekCount: 0, thisMonthCount: 0, activeProjects: 0 }
    }

    const totalLogs = allLogs.length
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const thisWeekCount = allLogs.filter((log) => {
      const logDate = new Date(log.date)
      return logDate >= weekAgo
    }).length

    const thisMonthCount = allLogs.filter((log) => {
      const logDate = new Date(log.date)
      return logDate >= monthAgo
    }).length

    // Count unique active projects
    const projectsWithLogs = new Set(
      allLogs.map((log) => log.project_id).filter((pid) => pid !== null && pid !== undefined),
    )
    const activeProjects = projectsWithLogs.size

    return { totalLogs, thisWeekCount, thisMonthCount, activeProjects }
  } catch (error) {
    return { totalLogs: 0, thisWeekCount: 0, thisMonthCount: 0, activeProjects: 0 }
  }
}

// Documents functions
export async function getDocuments(projectId: string): Promise<Document[]> {
  try {
    const supabase = createClientClient()
    if (!supabase) return []

    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })

    if (error) return []
    return data || []
  } catch (error) {
    return []
  }
}

export async function addDocument(doc: Omit<Document, "id" | "created_at">): Promise<Document | null> {
  try {
    const supabase = createClientClient()
    if (!supabase) return null

    const { data, error } = await supabase.from("documents").insert([doc]).select().single()

    if (error) return null
    return data
  } catch (error) {
    return null
  }
}

export async function deleteDocument(id: string): Promise<boolean> {
  try {
    const supabase = createClientClient()
    if (!supabase) return false

    const { error } = await supabase.from("documents").delete().eq("id", id)

    if (error) return false
    return true
  } catch (error) {
    return false
  }
}
