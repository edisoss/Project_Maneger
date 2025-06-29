import { createClientClient } from "./supabase-client"

export interface Material {
  id: number
  name: string
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
  date: string
  project: string
  work_description: string
  workers_present: string[]
  hours_worked: number
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
  status: string
  start_date: string
  end_date: string
  budget: number
  progress: number
  created_at?: string
  updated_at?: string
}

export interface Worker {
  id: number
  name: string
  email: string
  phone: string
  role: string
  skills: string[]
  status: string
  hire_date: string
  hourly_rate: number
  created_at?: string
  updated_at?: string
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
    const supabase = createClientClient()
    if (!supabase) {
      console.error("Supabase client not available")
      return false
    }

    const { error } = await supabase.from("materials").delete().eq("id", id)

    if (error) {
      console.error("Error deleting material:", error)
      return false
    }

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
      console.error("Error adding material transaction:", error)
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

    const { data, error } = await supabase.from("daily_logs").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching daily logs:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getDailyLogs:", error)
    return []
  }
}

export async function addDailyLog(log: Omit<DailyLog, "id" | "created_at" | "updated_at">): Promise<DailyLog | null> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      console.error("Supabase client not available")
      return null
    }

    const { data, error } = await supabase.from("daily_logs").insert([log]).select().single()

    if (error) {
      console.error("Error adding daily log:", error)
      return null
    }

    // Record material usage transactions
    if (data && log.materials_used && log.materials_used.length > 0) {
      for (const material of log.materials_used) {
        // Get current stock
        const { data: currentMaterial } = await supabase
          .from("materials")
          .select("current_stock")
          .eq("id", material.material_id)
          .single()

        if (currentMaterial) {
          await addMaterialTransaction({
            material_id: material.material_id,
            transaction_type: "used",
            quantity: material.quantity,
            previous_stock: currentMaterial.current_stock + material.quantity,
            new_stock: currentMaterial.current_stock,
            reference_type: "daily_log",
            reference_id: data.id,
            project: log.project,
            notes: `Used in daily work: ${log.work_description.substring(0, 100)}`,
            created_by: log.created_by,
          })
        }
      }
    }

    return data
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

    const { data, error } = await supabase.from("daily_logs").update(updates).eq("id", id).select().single()

    if (error) {
      console.error("Error updating daily log:", error)
      return null
    }

    return data
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

    const { error } = await supabase.from("daily_logs").delete().eq("id", id)

    if (error) {
      console.error("Error deleting daily log:", error)
      return false
    }

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

export async function addWorker(worker: Omit<Worker, "id" | "created_at" | "updated_at">): Promise<Worker | null> {
  try {
    const supabase = createClientClient()
    if (!supabase) {
      console.error("Supabase client not available")
      return null
    }

    const { data, error } = await supabase.from("workers").insert([worker]).select().single()

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

    const { data, error } = await supabase.from("workers").update(updates).eq("id", id).select().single()

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
