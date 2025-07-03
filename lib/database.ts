import { createClientClient } from "./supabase-client"

export interface Material {
  id: number
  name: string
  description?: string
  category: string
  current_stock: number
  min_stock: number
  unit: string
  location: string
  status: string
  last_updated: string
  created_at?: string
  updated_at?: string
}

export interface MaterialTransaction {
  id: number
  material_id: number
  transaction_type: "added" | "used" | "adjusted" | "returned"
  quantity: number
  previous_stock: number
  new_stock: number
  reference_type?: string
  reference_id?: number
  project?: string
  notes?: string
  created_by?: string
  created_at: string
}

export interface DailyLog {
  id: number
  title: string
  date: string
  project_id: number
  project_name?: string
  work_completed?: string // UI alias
  work_description?: string // DB column
  working_place?: string // NEW field for location/place of work
  hours_worked?: number // NEW (optional in UI, required in DB)
  workers_present: string[]
  materials_used: Array<{
    material_id: number
    material_name: string
    quantity: number
    unit: string
  }>
  notes: string
  weather: string
  status: string
  created_by: string
  created_at: string
  updated_at?: string
}

export interface Project {
  id: number
  name: string
  description: string
  type: string
  location: string
  status: string
  start_date: string
  end_date: string
  progress: number
  created_at?: string
  updated_at?: string
}

export interface Worker {
  id: number
  name: string
  phone: string
  role: string
  specialty: string
  skills: string[]
  status: string
  hire_date: string
  email?: string
  created_at?: string
  updated_at?: string
}

export interface Role {
  id: number
  name: string
  description?: string
  is_default: boolean
  created_at?: string
  updated_at?: string
}

export interface Skill {
  id: number
  name: string
  description?: string
  category?: string
  is_default: boolean
  created_at?: string
  updated_at?: string
}

export interface MaterialCategory {
  id: number
  name: string
  description?: string
  is_default: boolean
  created_at?: string
  updated_at?: string
}

export interface MaterialLocation {
  id: number
  name: string
  description?: string
  is_default: boolean
  created_at?: string
  updated_at?: string
}

export interface Profile {
  id: string
  email: string
  full_name: string
  role: string
  status: string
  is_admin?: boolean
  created_at?: string
  updated_at?: string
}

// Profiles functions
// ─────────────────────────────────────────────────────────────────────────────
// Profiles
// ─────────────────────────────────────────────────────────────────────────────
export async function getProfiles(): Promise<Profile[]> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      console.warn("Supabase client not available – returning empty profile list")
      return []
    }

    // Ask ONLY for the columns we render in the dashboard.
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, status, is_admin, created_at, updated_at")
      .order("created_at", { ascending: false })

    if (error) {
      // Most common cause in previews: recursive RLS policy on the table.
      console.error("Error fetching profiles:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
      return []
    }

    return data ?? []
  } catch (err) {
    console.error("Error in getProfiles:", err)
    return []
  }
}

export async function addProfile(profileData: {
  email: string
  full_name: string
  role: string
  status?: string
  is_admin?: boolean
}): Promise<Profile | null> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      console.error("Supabase client not available")
      return null
    }

    const { data, error } = await supabase
      .from("profiles")
      .insert([
        {
          ...profileData,
          status: profileData.status ?? "active",
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error adding profile:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in addProfile:", error)
    return null
  }
}

// Materials functions
export async function getMaterials(): Promise<Material[]> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      console.warn("Supabase client not available")
      return []
    }

    const { data, error } = await supabase.from("materials").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching materials:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getMaterials:", error)
    return []
  }
}

export async function addMaterial(
  material: Omit<Material, "id" | "created_at" | "updated_at">,
): Promise<Material | null> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      console.error("Supabase client not available")
      return null
    }

    // Remove last_updated from the material object since it will be set by the database
    const { last_updated, ...materialData } = material

    const { data, error } = await supabase.from("materials").insert([materialData]).select().single()

    if (error) {
      console.error("Error adding material:", error)
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
    console.error("Error in addMaterial:", error)
    return null
  }
}

export async function updateMaterial(id: number, updates: Partial<Material>): Promise<Material | null> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      console.error("Supabase client not available")
      return null
    }

    // Get current material data to track stock changes
    const { data: currentMaterial } = await supabase.from("materials").select("*").eq("id", id).single()

    // Remove last_updated from updates since it will be set by the database trigger
    const { last_updated, ...updateData } = updates

    const { data, error } = await supabase.from("materials").update(updateData).eq("id", id).select().single()

    if (error) {
      console.error("Error updating material:", error)
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
        reference_type: "manual_adjustment",
        notes: `Stock ${quantityChange > 0 ? "increased" : "decreased"} by ${Math.abs(quantityChange)}`,
        created_by: "admin@company.com",
      })
    }

    return data
  } catch (error) {
    console.error("Error in updateMaterial:", error)
    return null
  }
}

export async function deleteMaterial(id: number): Promise<boolean> {
  try {
    console.log("Starting delete process for material ID:", id)

    const supabase = createClientClient()
    if (!supabase) {
      console.error("Supabase client not available")
      return false
    }

    // First try to delete related transactions (if table exists)
    try {
      console.log("Attempting to delete related material transactions...")
      const { error: transactionError } = await supabase.from("material_transactions").delete().eq("material_id", id)

      if (transactionError) {
        console.warn("Warning: Could not delete material transactions:", transactionError)
        // Continue with material deletion even if transaction deletion fails
      } else {
        console.log("Material transactions deleted successfully")
      }
    } catch (transactionDeleteError) {
      console.warn("Warning: Error deleting material transactions:", transactionDeleteError)
      // Continue with material deletion
    }

    // Delete the material
    console.log("Attempting to delete material...")
    const { error } = await supabase.from("materials").delete().eq("id", id)

    if (error) {
      console.error("Error deleting material:", error)
      return false
    }

    console.log("Material deleted successfully")
    return true
  } catch (error) {
    console.error("Error in deleteMaterial:", error)
    return false
  }
}

// Material Transactions functions
export async function getMaterialTransactions(materialId?: number): Promise<MaterialTransaction[]> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      console.warn("Supabase client not available")
      return []
    }

    let query = supabase.from("material_transactions").select("*").order("created_at", { ascending: false })

    if (materialId) {
      query = query.eq("material_id", materialId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching material transactions:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getMaterialTransactions:", error)
    return []
  }
}

export async function addMaterialTransaction(
  transaction: Omit<MaterialTransaction, "id" | "created_at">,
): Promise<MaterialTransaction | null> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      console.error("Supabase client not available")
      return null
    }

    const { data, error } = await supabase.from("material_transactions").insert([transaction]).select().single()

    if (error) {
      console.error("Error adding material transaction:", {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
      })
      return null
    }

    return data
  } catch (error) {
    console.error("Error in addMaterialTransaction:", error)
    return null
  }
}

// Daily Logs functions
export async function getDailyLogs(): Promise<DailyLog[]> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      console.warn("Supabase client not available")
      return []
    }

    // Try the FK join first, fall back to manual merge if FK doesn't exist
    const { data, error } = await supabase
      .from("daily_logs")
      .select("*, projects(name)")
      .order("created_at", { ascending: false })

    if (error) {
      console.warn("FK join failed, falling back to manual merge:", error?.message ?? error)
      // Fallback: fetch logs & projects separately, then merge.
      const { data: logs } = await supabase.from("daily_logs").select("*").order("created_at", { ascending: false })
      const { data: allProjects } = await supabase.from("projects").select("id, name")

      return (
        logs?.map((log) => ({
          ...log,
          project_name:
            allProjects?.find((p) => p.id === log.project_id)?.name ?? (log as any).project ?? "Unknown Project",
          work_completed: (log as any).work_description ?? "",
        })) ?? []
      )
    }

    // Happy-path transform (data already contains projects.name)
    return (
      data?.map((log) => ({
        ...log,
        project_name:
          (log as any).projects?.name ??
          (log as any).project ?? // fallback to legacy column
          "Unknown Project",
        work_completed: (log as any).work_description ?? "",
      })) ?? []
    )
  } catch (error) {
    console.error("Error in getDailyLogs:", error)
    return []
  }
}

export async function addDailyLog(logData: {
  title: string
  date: string
  project_id: number
  work_completed: string
  working_place?: string
  workers_present: string[]
  materials_used: Array<{
    material_id: number
    material_name: string
    quantity: number
    unit: string
  }>
  notes: string
  weather: string
  status: string
  hours_worked?: number
}): Promise<DailyLog | null> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      console.error("Supabase client not available")
      return null
    }

    // ── ensure legacy NOT-NULL columns ─────────────────────────────────────────
    const { data: projRow } = await supabase.from("projects").select("name").eq("id", logData.project_id).single()

    const logToInsert = {
      ...logData,
      hours_worked: logData.hours_worked ?? 0, // <-- DEFAULT VALUE
      project: projRow?.name ?? "Unknown Project", // legacy text column
      work_description: logData.work_completed, // real column
      created_by: "admin@company.com",
    }
    delete (logToInsert as any).work_completed // remove unknown col

    const { data, error } = await supabase.from("daily_logs").insert([logToInsert]).select().single()

    if (error) {
      console.error("Error adding daily log:", error)
      return null
    }

    // Record material usage transactions and update stock
    if (data && logData.materials_used && logData.materials_used.length > 0) {
      console.log("Processing material usage for log:", data.id)

      for (const material of logData.materials_used) {
        try {
          console.log(
            `Processing material: ${material.material_name} (ID: ${material.material_id}), Quantity: ${material.quantity}`,
          )

          // Get current stock
          const { data: currentMaterial, error: fetchError } = await supabase
            .from("materials")
            .select("current_stock, name")
            .eq("id", material.material_id)
            .single()

          if (fetchError) {
            console.error("Error fetching current material stock:", fetchError)
            continue
          }

          if (currentMaterial) {
            const newStock = Math.max(0, currentMaterial.current_stock - material.quantity)
            console.log(`Updating stock for ${currentMaterial.name}: ${currentMaterial.current_stock} -> ${newStock}`)

            // Update material stock
            const { error: updateError } = await supabase
              .from("materials")
              .update({ current_stock: newStock })
              .eq("id", material.material_id)

            if (updateError) {
              console.error("Error updating material stock:", updateError)
              continue
            }

            console.log(`Successfully updated stock for ${currentMaterial.name}`)

            // Record transaction
            const transactionResult = await addMaterialTransaction({
              material_id: material.material_id,
              transaction_type: "used",
              quantity: material.quantity,
              previous_stock: currentMaterial.current_stock,
              new_stock: newStock,
              reference_type: "daily_log",
              reference_id: data.id,
              project: `Project ID: ${logData.project_id}`,
              notes: `Used in daily work: ${logData.work_completed.substring(0, 100)}`,
              created_by: "admin@company.com",
            })

            if (!transactionResult) {
              console.error("Failed to record material transaction")
            } else {
              console.log("Successfully recorded material transaction")
            }
          } else {
            console.error("Material not found:", material.material_id)
          }
        } catch (error) {
          console.error("Error processing material usage:", error)
        }
      }
    }

    // Get project name for return data
    const { data: project } = await supabase.from("projects").select("name").eq("id", logData.project_id).single()

    return {
      ...data,
      project_name: project?.name || "Unknown Project",
      work_completed: data.work_description,
    }
  } catch (error) {
    console.error("Error in addDailyLog:", error)
    return null
  }
}

export async function updateDailyLog(id: number, updates: Partial<DailyLog>): Promise<DailyLog | null> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      console.error("Supabase client not available")
      return null
    }

    // Handle the work_completed -> work_description mapping
    const updateData = { ...updates }
    if (updates.work_completed !== undefined) {
      ;(updateData as any).work_description = updates.work_completed
      delete (updateData as any).work_completed
    }

    // Ensure hours_worked has a default value
    if (updateData.hours_worked === undefined) {
      updateData.hours_worked = 0
    }

    const { data, error } = await supabase.from("daily_logs").update(updateData).eq("id", id).select().single()

    if (error) {
      console.error("Error updating daily log:", error)
      return null
    }

    // Handle material stock updates for edited logs
    if (updates.materials_used) {
      console.log("Processing material stock updates for edited log:", id)

      // Get the original log to see what materials were previously used
      const { data: originalLog } = await supabase.from("daily_logs").select("materials_used").eq("id", id).single()

      if (originalLog && originalLog.materials_used) {
        // First, restore stock for previously used materials
        for (const originalMaterial of originalLog.materials_used) {
          try {
            const { data: currentMaterial } = await supabase
              .from("materials")
              .select("current_stock, name")
              .eq("id", originalMaterial.material_id)
              .single()

            if (currentMaterial) {
              const restoredStock = currentMaterial.current_stock + originalMaterial.quantity
              console.log(
                `Restoring stock for ${currentMaterial.name}: ${currentMaterial.current_stock} + ${originalMaterial.quantity} = ${restoredStock}`,
              )

              await supabase
                .from("materials")
                .update({ current_stock: restoredStock })
                .eq("id", originalMaterial.material_id)

              // Record restoration transaction
              await addMaterialTransaction({
                material_id: originalMaterial.material_id,
                transaction_type: "returned",
                quantity: originalMaterial.quantity,
                previous_stock: currentMaterial.current_stock,
                new_stock: restoredStock,
                reference_type: "daily_log_edit",
                reference_id: id,
                notes: `Stock restored from edited daily log`,
                created_by: "admin@company.com",
              })
            }
          } catch (error) {
            console.error("Error restoring material stock:", error)
          }
        }
      }

      // Then, deduct stock for newly used materials
      for (const newMaterial of updates.materials_used) {
        try {
          const { data: currentMaterial } = await supabase
            .from("materials")
            .select("current_stock, name")
            .eq("id", newMaterial.material_id)
            .single()

          if (currentMaterial) {
            const newStock = Math.max(0, currentMaterial.current_stock - newMaterial.quantity)
            console.log(
              `Deducting stock for ${currentMaterial.name}: ${currentMaterial.current_stock} - ${newMaterial.quantity} = ${newStock}`,
            )

            await supabase.from("materials").update({ current_stock: newStock }).eq("id", newMaterial.material_id)

            // Record usage transaction
            await addMaterialTransaction({
              material_id: newMaterial.material_id,
              transaction_type: "used",
              quantity: newMaterial.quantity,
              previous_stock: currentMaterial.current_stock,
              new_stock: newStock,
              reference_type: "daily_log_edit",
              reference_id: id,
              notes: `Used in edited daily log`,
              created_by: "admin@company.com",
            })
          }
        } catch (error) {
          console.error("Error deducting material stock:", error)
        }
      }
    }

    // Get project name for return data
    const { data: project } = await supabase.from("projects").select("name").eq("id", data.project_id).single()

    return {
      ...data,
      project_name: project?.name || "Unknown Project",
      work_completed: data.work_description,
    }
  } catch (error) {
    console.error("Error in updateDailyLog:", error)
    return null
  }
}

export async function deleteDailyLog(id: number): Promise<boolean> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      console.error("Supabase client not available")
      return false
    }

    // Get the log data before deleting to restore material stock
    const { data: logToDelete } = await supabase.from("daily_logs").select("materials_used").eq("id", id).single()

    if (logToDelete && logToDelete.materials_used && logToDelete.materials_used.length > 0) {
      console.log("Restoring material stock for deleted log:", id)

      // Restore stock for all materials that were used in this log
      for (const material of logToDelete.materials_used) {
        try {
          const { data: currentMaterial } = await supabase
            .from("materials")
            .select("current_stock, name")
            .eq("id", material.material_id)
            .single()

          if (currentMaterial) {
            const restoredStock = currentMaterial.current_stock + material.quantity
            console.log(
              `Restoring stock for ${currentMaterial.name}: ${currentMaterial.current_stock} + ${material.quantity} = ${restoredStock}`,
            )

            await supabase.from("materials").update({ current_stock: restoredStock }).eq("id", material.material_id)

            // Record restoration transaction
            await addMaterialTransaction({
              material_id: material.material_id,
              transaction_type: "returned",
              quantity: material.quantity,
              previous_stock: currentMaterial.current_stock,
              new_stock: restoredStock,
              reference_type: "daily_log_delete",
              reference_id: id,
              notes: `Stock restored from deleted daily log`,
              created_by: "admin@company.com",
            })

            console.log(`Successfully restored stock for ${currentMaterial.name}`)
          }
        } catch (error) {
          console.error("Error restoring material stock:", error)
        }
      }
    }

    // Now delete the log
    const { error } = await supabase.from("daily_logs").delete().eq("id", id)

    if (error) {
      console.error("Error deleting daily log:", error)
      return false
    }

    console.log("Daily log deleted successfully")
    return true
  } catch (error) {
    console.error("Error in deleteDailyLog:", error)
    return false
  }
}

// Projects functions
export async function getProjects(): Promise<Project[]> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      console.warn("Supabase client not available")
      return []
    }

    const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching projects:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getProjects:", error)
    return []
  }
}

export async function addProject(project: Omit<Project, "id" | "created_at" | "updated_at">): Promise<Project | null> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      console.error("Supabase client not available")
      return null
    }

    const { data, error } = await supabase.from("projects").insert([project]).select().single()

    if (error) {
      console.error("Error adding project:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in addProject:", error)
    return null
  }
}

export async function updateProject(id: number, updates: Partial<Project>): Promise<Project | null> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      console.error("Supabase client not available")
      return null
    }

    const { data, error } = await supabase.from("projects").update(updates).eq("id", id).select().single()

    if (error) {
      console.error("Error updating project:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in updateProject:", error)
    return null
  }
}

export async function deleteProject(id: number): Promise<boolean> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      console.error("Supabase client not available")
      return false
    }

    const { error } = await supabase.from("projects").delete().eq("id", id)

    if (error) {
      console.error("Error deleting project:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in deleteProject:", error)
    return false
  }
}

// Workers functions
export async function getWorkers(): Promise<Worker[]> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      console.warn("Supabase client not available")
      return []
    }

    const { data, error } = await supabase.from("workers").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching workers:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getWorkers:", error)
    return []
  }
}

export async function addWorker(workerData: Omit<Worker, "id" | "created_at" | "updated_at">): Promise<Worker | null> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      console.error("Supabase client not available")
      return null
    }

    const { role, ...rest } = workerData
    const uniqueEmail = `worker_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}@placeholder.local`
    const insertObj = {
      ...rest,
      role,
      specialty: role,
      email: uniqueEmail,
    }

    const { data, error } = await supabase.from("workers").insert([insertObj]).select().single()

    if (error) {
      console.error("Error adding worker:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in addWorker:", error)
    return null
  }
}

export async function updateWorker(id: number, updates: Partial<Worker>): Promise<Worker | null> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      console.error("Supabase client not available")
      return null
    }

    const { role, ...rest } = updates
    const updateObj = role ? { ...rest, role, specialty: role } : rest

    const { data, error } = await supabase.from("workers").update(updateObj).eq("id", id).select().single()

    if (error) {
      console.error("Error updating worker:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in updateWorker:", error)
    return null
  }
}

export async function deleteWorker(id: number): Promise<boolean> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      console.error("Supabase client not available")
      return false
    }

    const { error } = await supabase.from("workers").delete().eq("id", id)

    if (error) {
      console.error("Error deleting worker:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in deleteWorker:", error)
    return false
  }
}

// Roles functions
export async function getRoles(): Promise<Role[]> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      console.warn("Supabase client not available")
      return []
    }

    const { data, error } = await supabase.from("roles").select("*").order("name", { ascending: true })

    if (error) {
      console.error("Error fetching roles:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getRoles:", error)
    return []
  }
}

export async function addRole(name: string, description?: string): Promise<Role | null> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      console.error("Supabase client not available")
      return null
    }

    const { data, error } = await supabase
      .from("roles")
      .insert([{ name, description, is_default: false }])
      .select()
      .single()

    if (error) {
      console.error("Error adding role:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in addRole:", error)
    return null
  }
}

export async function deleteRole(id: number): Promise<boolean> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      console.error("Supabase client not available")
      return false
    }

    const { error } = await supabase.from("roles").delete().eq("id", id)

    if (error) {
      console.error("Error deleting role:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in deleteRole:", error)
    return false
  }
}

// Skills functions
export async function getSkills(): Promise<Skill[]> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      console.warn("Supabase client not available")
      return []
    }

    const { data, error } = await supabase.from("skills").select("*").order("name", { ascending: true })

    if (error) {
      console.error("Error fetching skills:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getSkills:", error)
    return []
  }
}

export async function addSkill(name: string, description?: string, category?: string): Promise<Skill | null> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      console.error("Supabase client not available")
      return null
    }

    const { data, error } = await supabase
      .from("skills")
      .insert([{ name, description, category, is_default: false }])
      .select()
      .single()

    if (error) {
      console.error("Error adding skill:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in addSkill:", error)
    return null
  }
}

export async function deleteSkill(id: number): Promise<boolean> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      console.error("Supabase client not available")
      return false
    }

    const { error } = await supabase.from("skills").delete().eq("id", id)

    if (error) {
      console.error("Error deleting skill:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in deleteSkill:", error)
    return false
  }
}

// Material Categories functions
export async function getMaterialCategories(): Promise<MaterialCategory[]> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      console.warn("Supabase client not available")
      return []
    }

    const { data, error } = await supabase.from("material_categories").select("*").order("name", { ascending: true })

    if (error) {
      console.error("Error fetching material categories:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getMaterialCategories:", error)
    return []
  }
}

export async function addMaterialCategory(name: string, description?: string): Promise<MaterialCategory | null> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      console.error("Supabase client not available")
      return null
    }

    const { data, error } = await supabase
      .from("material_categories")
      .insert([{ name, description, is_default: false }])
      .select()
      .single()

    if (error) {
      console.error("Error adding material category:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in addMaterialCategory:", error)
    return null
  }
}

export async function deleteMaterialCategory(id: number): Promise<boolean> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      console.error("Supabase client not available")
      return false
    }

    const { error } = await supabase.from("material_categories").delete().eq("id", id)

    if (error) {
      console.error("Error deleting material category:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in deleteMaterialCategory:", error)
    return false
  }
}

// Material Locations functions
export async function getMaterialLocations(): Promise<MaterialLocation[]> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      console.warn("Supabase client not available")
      return []
    }

    const { data, error } = await supabase.from("material_locations").select("*").order("name", { ascending: true })

    if (error) {
      console.error("Error fetching material locations:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getMaterialLocations:", error)
    return []
  }
}

export async function addMaterialLocation(name: string, description?: string): Promise<MaterialLocation | null> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      console.error("Supabase client not available")
      return null
    }

    const { data, error } = await supabase
      .from("material_locations")
      .insert([{ name, description, is_default: false }])
      .select()
      .single()

    if (error) {
      console.error("Error adding material location:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in addMaterialLocation:", error)
    return null
  }
}

export async function deleteMaterialLocation(id: number): Promise<boolean> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      console.error("Supabase client not available")
      return false
    }

    const { error } = await supabase.from("material_locations").delete().eq("id", id)

    if (error) {
      console.error("Error deleting material location:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in deleteMaterialLocation:", error)
    return false
  }
}
