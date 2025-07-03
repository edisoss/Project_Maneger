import { createClientClient } from "./supabase-client"

/*────────────────────────────
  Shared Types
────────────────────────────*/
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

export interface Project {
  id: number
  name: string
  description?: string
  type?: string
  location?: string
  status?: string
  start_date?: string
  end_date?: string
  progress?: number
  created_at?: string
  updated_at?: string
}

export interface Worker {
  id: number
  name: string
  phone?: string
  role?: string
  specialty?: string
  skills: string[]
  status?: string
  hire_date?: string
  email?: string
  created_at?: string
  updated_at?: string
}

export interface Material {
  id: number
  name: string
  description?: string
  category?: string
  current_stock: number
  min_stock: number
  unit?: string
  location?: string
  status?: string
  last_updated?: string
  created_at?: string
  updated_at?: string
}

export interface DailyLog {
  id: number
  title: string
  date: string
  project_id: number
  project_name?: string
  work_description?: string // db column
  work_completed?: string // ui alias
  working_place?: string
  hours_worked?: number
  workers_present: string[]
  materials_used: Array<{
    material_id: number
    material_name: string
    quantity: number
    unit: string
  }>
  notes?: string
  weather?: string
  status?: string
  created_by?: string
  created_at?: string
  updated_at?: string
}

export interface Role {
  id: number
  name: string
  description?: string
  is_default: boolean
}

export interface Skill {
  id: number
  name: string
  description?: string
  category?: string
  is_default: boolean
}

export interface MaterialCategory {
  id: number
  name: string
  description?: string
  is_default: boolean
}

export interface MaterialLocation {
  id: number
  name: string
  description?: string
  is_default: boolean
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

/*────────────────────────────
  Internal helper
────────────────────────────*/
function supa() {
  const c = createClientClient()
  if (!c) console.warn("⚠️ Supabase client not initialised; returning fallback data.")
  return c
}

async function simpleSelect<T>(table: string): Promise<T[]> {
  const client = supa()
  if (!client) return []
  const { data, error } = await client.from(table).select("*").order("created_at", { ascending: false })
  if (error) {
    console.error(`Error fetching ${table}:`, error.message)
    return []
  }
  return data ?? []
}

/*────────────────────────────
  Profiles
────────────────────────────*/
export async function getProfiles(): Promise<Profile[]> {
  const client = supa()
  if (!client) return []

  const { data, error } = await client
    .from("profiles")
    .select("id, email, full_name, role, status, is_admin, created_at")
    .order("created_at", { ascending: false })

  if (error) {
    if (error.message?.includes("infinite recursion detected")) {
      console.warn("🛡️  RLS recursion on 'profiles'; returning empty list.")
      return []
    }
    console.error("Error fetching profiles:", error.message)
    return []
  }

  return data ?? []
}

export async function addProfile(
  payload: Pick<Profile, "email" | "full_name" | "role"> & { is_admin?: boolean; status?: string },
): Promise<Profile | null> {
  const client = supa()
  if (!client) return null

  const { data, error } = await client
    .from("profiles")
    .insert([{ ...payload, status: payload.status ?? "active" }])
    .select()
    .single()

  if (error) {
    console.error("Error adding profile:", error.message)
    return null
  }
  return data
}

/*────────────────────────────
  Fetchers used by dashboard
────────────────────────────*/
export const getProjects = () => simpleSelect<Project>("projects")
export const getWorkers = () => simpleSelect<Worker>("workers")
export const getMaterials = () => simpleSelect<Material>("materials")
export const getDailyLogs = () => simpleSelect<DailyLog>("daily_logs")
export const getRoles = () => simpleSelect<Role>("roles")
export const getSkills = () => simpleSelect<Skill>("skills")
export const getMaterialCategories = () => simpleSelect<MaterialCategory>("material_categories")
export const getMaterialLocations = () => simpleSelect<MaterialLocation>("material_locations")

// Material Transactions functions
export async function getMaterialTransactions(materialId?: number): Promise<MaterialTransaction[]> {
  const client = supa()
  if (!client) return []

  let query = client.from("material_transactions").select("*").order("created_at", { ascending: false })
  if (materialId) {
    query = query.eq("material_id", materialId)
  }

  const { data, error } = await query
  if (error) {
    console.error("Error fetching material transactions:", error)
    return []
  }
  return data || []
}

export async function addMaterialTransaction(
  transaction: Omit<MaterialTransaction, "id" | "created_at">,
): Promise<MaterialTransaction | null> {
  const client = supa()
  if (!client) return null

  const { data, error } = await client.from("material_transactions").insert([transaction]).select().single()
  if (error) {
    console.error("Error adding material transaction:", error)
    return null
  }
  return data
}

export async function addMaterial(
  material: Omit<Material, "id" | "created_at" | "updated_at" | "last_updated">,
): Promise<Material | null> {
  const client = supa()
  if (!client) return null

  const { data, error } = await client.from("materials").insert([material]).select().single()
  if (error) {
    console.error("Error adding material:", error)
    return null
  }

  if (data && material.current_stock > 0) {
    await addMaterialTransaction({
      material_id: data.id,
      transaction_type: "added",
      quantity: material.current_stock,
      previous_stock: 0,
      new_stock: material.current_stock,
      notes: "Initial inventory stock",
    })
  }
  return data
}

export async function updateMaterial(id: number, updates: Partial<Material>): Promise<Material | null> {
  const client = supa()
  if (!client) return null

  const { data: currentMaterial } = await client.from("materials").select("current_stock").eq("id", id).single()

  const { data, error } = await client.from("materials").update(updates).eq("id", id).select().single()
  if (error) {
    console.error("Error updating material:", error)
    return null
  }

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
      notes: "Manual stock adjustment",
    })
  }
  return data
}

export async function deleteMaterial(id: number): Promise<boolean> {
  const client = supa()
  if (!client) return false

  await client.from("material_transactions").delete().eq("material_id", id)
  const { error } = await client.from("materials").delete().eq("id", id)
  if (error) {
    console.error("Error deleting material:", error)
    return false
  }
  return true
}

export async function addDailyLog(
  logData: Omit<DailyLog, "id" | "created_at" | "updated_at" | "project_name">,
): Promise<DailyLog | null> {
  const client = supa()
  if (!client) return null

  const { work_completed, ...rest } = logData
  const insertData = {
    ...rest,
    work_description: work_completed,
  }

  const { data, error } = await client.from("daily_logs").insert([insertData]).select().single()
  if (error) {
    console.error("Error adding daily log:", error)
    return null
  }
  return data
}

export async function updateDailyLog(id: number, updates: Partial<DailyLog>): Promise<DailyLog | null> {
  const client = supa()
  if (!client) return null

  const { work_completed, ...rest } = updates
  const updateData = { ...rest }
  if (work_completed) {
    ;(updateData as any).work_description = work_completed
  }

  const { data, error } = await client.from("daily_logs").update(updateData).eq("id", id).select().single()
  if (error) {
    console.error("Error updating daily log:", error)
    return null
  }
  return data
}

export async function deleteDailyLog(id: number): Promise<boolean> {
  const client = supa()
  if (!client) return false
  const { error } = await client.from("daily_logs").delete().eq("id", id)
  if (error) {
    console.error("Error deleting daily log:", error)
    return false
  }
  return true
}

export async function addProject(project: Omit<Project, "id" | "created_at" | "updated_at">): Promise<Project | null> {
  const client = supa()
  if (!client) return null
  const { data, error } = await client.from("projects").insert([project]).select().single()
  if (error) {
    console.error("Error adding project:", error)
    return null
  }
  return data
}

export async function updateProject(id: number, updates: Partial<Project>): Promise<Project | null> {
  const client = supa()
  if (!client) return null
  const { data, error } = await client.from("projects").update(updates).eq("id", id).select().single()
  if (error) {
    console.error("Error updating project:", error)
    return null
  }
  return data
}

export async function deleteProject(id: number): Promise<boolean> {
  const client = supa()
  if (!client) return false
  const { error } = await client.from("projects").delete().eq("id", id)
  if (error) {
    console.error("Error deleting project:", error)
    return false
  }
  return true
}

export async function addWorker(workerData: Omit<Worker, "id" | "created_at" | "updated_at">): Promise<Worker | null> {
  const client = supa()
  if (!client) return null
  const { data, error } = await client.from("workers").insert([workerData]).select().single()
  if (error) {
    console.error("Error adding worker:", error)
    return null
  }
  return data
}

export async function updateWorker(id: number, updates: Partial<Worker>): Promise<Worker | null> {
  const client = supa()
  if (!client) return null
  const { data, error } = await client.from("workers").update(updates).eq("id", id).select().single()
  if (error) {
    console.error("Error updating worker:", error)
    return null
  }
  return data
}

export async function deleteWorker(id: number): Promise<boolean> {
  const client = supa()
  if (!client) return false
  const { error } = await client.from("workers").delete().eq("id", id)
  if (error) {
    console.error("Error deleting worker:", error)
    return false
  }
  return true
}

export async function addRole(name: string, description?: string): Promise<Role | null> {
  const client = supa()
  if (!client) return null
  const { data, error } = await client
    .from("roles")
    .insert([{ name, description, is_default: false }])
    .select()
    .single()
  if (error) {
    console.error("Error adding role:", error)
    return null
  }
  return data
}

export async function deleteRole(id: number): Promise<boolean> {
  const client = supa()
  if (!client) return false
  const { error } = await client.from("roles").delete().eq("id", id)
  if (error) {
    console.error("Error deleting role:", error)
    return false
  }
  return true
}

export async function addSkill(name: string, description?: string, category?: string): Promise<Skill | null> {
  const client = supa()
  if (!client) return null
  const { data, error } = await client
    .from("skills")
    .insert([{ name, description, category, is_default: false }])
    .select()
    .single()
  if (error) {
    console.error("Error adding skill:", error)
    return null
  }
  return data
}

export async function deleteSkill(id: number): Promise<boolean> {
  const client = supa()
  if (!client) return false
  const { error } = await client.from("skills").delete().eq("id", id)
  if (error) {
    console.error("Error deleting skill:", error)
    return false
  }
  return true
}

export async function addMaterialCategory(name: string, description?: string): Promise<MaterialCategory | null> {
  const client = supa()
  if (!client) return null
  const { data, error } = await client
    .from("material_categories")
    .insert([{ name, description, is_default: false }])
    .select()
    .single()
  if (error) {
    console.error("Error adding material category:", error)
    return null
  }
  return data
}

export async function deleteMaterialCategory(id: number): Promise<boolean> {
  const client = supa()
  if (!client) return false
  const { error } = await client.from("material_categories").delete().eq("id", id)
  if (error) {
    console.error("Error deleting material category:", error)
    return false
  }
  return true
}

export async function addMaterialLocation(name: string, description?: string): Promise<MaterialLocation | null> {
  const client = supa()
  if (!client) return null
  const { data, error } = await client
    .from("material_locations")
    .insert([{ name, description, is_default: false }])
    .select()
    .single()
  if (error) {
    console.error("Error adding material location:", error)
    return null
  }
  return data
}

export async function deleteMaterialLocation(id: number): Promise<boolean> {
  const client = supa()
  if (!client) return false
  const { error } = await client.from("material_locations").delete().eq("id", id)
  if (error) {
    console.error("Error deleting material location:", error)
    return false
  }
  return true
}
