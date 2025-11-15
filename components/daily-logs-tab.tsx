"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Edit, Trash2, FileText, Calendar, Users, Package, MapPin, Clock, Loader2, Eye, Filter, X, CheckCircle, AlertCircle, Pause, XCircle, Building, Info, Lock, Unlock, User, Building2, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  addDailyLog,
  updateDailyLog,
  deleteDailyLog,
  updateMaterial,
  getDailyLogs,
  getDailyLogsCount,
  getDailyLogsStats,
} from "@/lib/database"
import type { DailyLog, Project, Worker, Material } from "@/lib/database"
import { useToast } from "@/hooks/use-toast"
import type { Activity } from "./recent-activities"

interface DailyLogsTabProps {
  dailyLogs: DailyLog[]
  setDailyLogs: (logs: DailyLog[]) => void
  projects: Project[]
  workers: Worker[]
  materials: Material[]
  reloadMaterials: () => void
  logActivity: (activity: Omit<Activity, "id" | "timestamp">) => void
  isAdmin: boolean
  userRole?: string
}

export default function DailyLogsTab({
  dailyLogs = [],
  setDailyLogs = () => {},
  projects = [],
  workers = [],
  materials = [],
  reloadMaterials,
  logActivity,
  isAdmin,
  userRole = "user",
}: DailyLogsTabProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [selectedLog, setSelectedLog] = useState<DailyLog | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()

  const [currentPage, setCurrentPage] = useState(1)
  const [totalLogs, setTotalLogs] = useState(0)
  const logsPerPage = 20

  // State for statistics, initialized to 0
  const [stats, setStats] = useState({
    totalLogs: 0,
    thisWeekCount: 0,
    thisMonthCount: 0,
    activeProjects: 0,
  })

  // Date filtering state
  const [dateFilter, setDateFilter] = useState({
    fromDate: "",
    toDate: "",
    quickFilter: "all" as "all" | "today" | "week" | "month" | "custom",
  })

  // Project filtering state
  const [projectFilter, setProjectFilter] = useState("all")

  const [selectedLocationsForMaterial, setSelectedLocationsForMaterial] = useState<string[]>(["storage"])

  // Load stats once on mount
  useEffect(() => {
    const loadStats = async () => {
      try {
        const statsData = await getDailyLogsStats()
        if (statsData) {
          setStats(statsData)
        }
      } catch (error) {
        console.log("[v0] Error loading stats:", error)
      }
    }
    loadStats()
  }, []) // Load once on mount

  // Load paginated logs and total count
  useEffect(() => {
    const loadPaginatedLogs = async () => {
      const offset = (currentPage - 1) * logsPerPage
      const logs = await getDailyLogs(logsPerPage, offset, { dateFilter, projectFilter }) // Pass filters
      const count = await getDailyLogsCount({ dateFilter, projectFilter }) // Pass filters
      setDailyLogs(logs)
      setTotalLogs(count)
    }
    loadPaginatedLogs()
  }, [currentPage, setDailyLogs, dateFilter, projectFilter]) // Add filters to dependency array

  // Effect to reload stats when filters change
  useEffect(() => {
    const loadStats = async () => {
      try {
        const statsData = await getDailyLogsStats({
          dateFilter,
          projectFilter,
        })
        if (statsData) {
          setStats(statsData)
        }
      } catch (error) {
        // Silently handle error
      }
    }
    loadStats()
  }, [dateFilter, projectFilter])

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    project_id: projects[0]?.id || "",
    workers_present: [] as string[],
    work_description: "",
    materials_used: [] as {
      material_id: string
      actual_quantity: number
      visible_quantity: number
      source_location: string // Add source location tracking: "storage" or project_id
    }[], // </CHANGE>
    equipment_used: "",
    weather_conditions: "Sunny",
    working_place: "",
    hours_worked: 8,
    status: "completed",
    notes: "",
  })

  const weatherOptions = ["Sunny", "Cloudy", "Rainy", "Windy", "Stormy", "Foggy", "Hot", "Cold"]
  const statusOptions = [
    { value: "in_progress", label: "In Progress", icon: AlertCircle, color: "bg-blue-500" },
    { value: "completed", label: "Completed", icon: CheckCircle, color: "bg-green-500" },
    { value: "on_hold", label: "On Hold", icon: Pause, color: "bg-yellow-500" },
    { value: "cancelled", label: "Cancelled", icon: XCircle, color: "bg-red-500" },
  ]

  // Permission helpers - Updated to allow managers to edit daily logs
  const canAddDailyLogs = isAdmin || userRole === "manager"
  const canEditDailyLogs = isAdmin || userRole === "manager" // Allow managers to edit
  const canDeleteDailyLogs = isAdmin // Only admins can delete

  // Converts a comma- or newline-separated list to a trimmed string array.
  function toStringArray(value: string): string[] {
    return value
      .split(/[,\\n]/)
      .map((s) => s.trim())
      .filter(Boolean)
  }

  // Get status configuration
  const getStatusConfig = (status: string) => {
    return statusOptions.find((s) => s.value === status) || statusOptions[1] // Default to completed
  }

  // Date filtering functions
  const getDateRangeForQuickFilter = (filter: string) => {
    const today = new Date()
    const todayStr = today.toISOString().split("T")[0]

    switch (filter) {
      case "today":
        return { fromDate: todayStr, toDate: todayStr }
      case "week":
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay()) // Start of week (Sunday)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6) // End of week (Saturday)
        return {
          fromDate: weekStart.toISOString().split("T")[0],
          toDate: weekEnd.toISOString().split("T")[0],
        }
      case "month":
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        return {
          fromDate: monthStart.toISOString().split("T")[0],
          toDate: monthEnd.toISOString().split("T")[0],
        }
      default:
        return { fromDate: "", toDate: "" }
    }
  }

  const handleQuickFilter = (filter: "all" | "today" | "week" | "month" | "custom") => {
    if (filter === "custom") {
      setDateFilter({ ...dateFilter, quickFilter: filter })
    } else {
      const range = getDateRangeForQuickFilter(filter)
      setDateFilter({
        quickFilter: filter,
        fromDate: range.fromDate,
        toDate: range.toDate,
      })
    }
    setCurrentPage(1) // Reset to first page when filters change
  }

  const clearDateFilter = () => {
    setDateFilter({
      fromDate: "",
      toDate: "",
      quickFilter: "all",
    })
  }

  const clearAllFilters = () => {
    setDateFilter({
      fromDate: "",
      toDate: "",
      quickFilter: "all",
    })
    setProjectFilter("all")
    setCurrentPage(1) // Reset to first page when filters are cleared
  }

  // Filter logs based on date range and project
  const filteredLogs = useMemo(() => {
    let filtered = dailyLogs

    // Apply date filter
    if (dateFilter.quickFilter !== "all" || dateFilter.fromDate || dateFilter.toDate) {
      filtered = filtered.filter((log) => {
        const logDate = new Date(log.date)
        const logDateStr = logDate.toISOString().split("T")[0]

        if (dateFilter.fromDate && logDateStr < dateFilter.fromDate) {
          return false
        }
        if (dateFilter.toDate && logDateStr > dateFilter.toDate) {
          return false
        }
        return true
      })
    }

    // Apply project filter
    if (projectFilter !== "all") {
      filtered = filtered.filter((log) => log.project_id === projectFilter)
    }

    return filtered
  }, [dailyLogs, dateFilter, projectFilter])

  const availableMaterialsFromLocation = useMemo(() => {
    const materialsFromSelectedLocations = materials.filter((m) => {
      const materialLocation = m.project_id || "storage"
      return (
        selectedLocationsForMaterial.includes(materialLocation) &&
        !formData.materials_used.some((used) => used.material_id === m.id)
      )
    })
    return materialsFromSelectedLocations
    // </CHANGE>
  }, [materials, selectedLocationsForMaterial, formData.materials_used])
  // </CHANGE>

  const materialsByLocation = useMemo(() => {
    const grouped = new Map<string, Material[]>()

    // Add storage materials
    const storageMaterials = materials.filter((m) => !m.project_id || m.project_id === null)
    if (storageMaterials.length > 0) {
      grouped.set("storage", storageMaterials)
    }

    // Add materials for each project
    projects.forEach((project) => {
      const projectMaterials = materials.filter((m) => m.project_id === project.id)
      if (projectMaterials.length > 0) {
        grouped.set(project.id, projectMaterials)
      }
    })

    return grouped
  }, [materials, projects])
  // </CHANGE>

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      project_id: projects[0]?.id || "",
      workers_present: [],
      work_description: "",
      materials_used: [],
      equipment_used: "",
      weather_conditions: "Sunny",
      working_place: "",
      hours_worked: 8,
      status: "completed",
      notes: "",
    })
    setSelectedLocationsForMaterial(["storage"])
    // </CHANGE>
  }

  const handleAddDailyLog = async () => {
    if (!canAddDailyLogs) {
      toast({
        title: "Access Denied",
        description: "Only administrators and managers can add daily logs",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)
      if (!formData.date || !formData.project_id || !formData.work_description) {
        toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" })
        return
      }

      const equipmentArray = toStringArray(formData.equipment_used)

      const logData = {
        title: `Daily Log - ${new Date(formData.date).toLocaleDateString()}`,
        date: formData.date,
        project_id: formData.project_id,
        weather: formData.weather_conditions,
        temperature: 20, // default
        workers_present: formData.workers_present,
        materials_used: formData.materials_used,
        equipment_used: equipmentArray,
        hours_worked: formData.hours_worked,
        work_completed: formData.work_description,
        status: formData.status,
        working_place: formData.working_place,
      }

      const newLog = await addDailyLog(logData)
      if (!newLog) {
        toast({ title: "Error", description: "Failed to add daily log.", variant: "destructive" })
        return
      }

      // Update material stock for used materials using actual quantities
      for (const materialUsed of formData.materials_used) {
        const material = materials.find((m) => m.id === materialUsed.material_id)
        if (material && materialUsed.actual_quantity > 0) {
          const newStock = Math.max(0, material.current_stock - materialUsed.actual_quantity)
          await updateMaterial(material.id, { current_stock: newStock })

          // Log material usage activity with both quantities
          logActivity({
            type: "material",
            title: "Material Used",
            description: `${materialUsed.actual_quantity} ${material.unit} of ${material.name} used in daily log (Visible: ${materialUsed.visible_quantity} ${material.unit}). Remaining: ${newStock} ${material.unit}`,
            icon: Package,
            variant: newStock <= material.min_stock ? "destructive" : "secondary",
          })
        }
      }

      // Reload materials to reflect updated stock
      reloadMaterials()

      const statusConfig = getStatusConfig(formData.status)
      logActivity({
        type: "daily_log",
        title: "Daily Log Created",
        description: `New daily log created for ${new Date(formData.date).toLocaleDateString()} with status: ${statusConfig.label}.`,
        icon: Plus,
        variant: "default",
      })

      // setDailyLogs([...dailyLogs, newLog]) // Remove this line
      setCurrentPage(1)
      const logs = await getDailyLogs(logsPerPage, 0, { dateFilter, projectFilter }) // Pass filters
      const count = await getDailyLogsCount({ dateFilter, projectFilter }) // Pass filters
      setDailyLogs(logs)
      setTotalLogs(count)

      setShowAddDialog(false)
      resetForm()
      toast({ title: "Success", description: "Daily log added successfully!" })
    } catch (error) {
      console.error("Error adding daily log:", error)
      toast({ title: "Error", description: "Error adding daily log.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (log: DailyLog) => {
    setSelectedLog(log)

    // Parse workers_present - handle both array and JSON string formats
    let workersPresent: string[] = []
    try {
      if (Array.isArray(log.workers_present)) {
        // Convert all to strings for consistent comparison
        workersPresent = log.workers_present.map((id) => String(id))
      } else if (typeof log.workers_present === "string") {
        const parsed = JSON.parse(log.workers_present || "[]")
        workersPresent = Array.isArray(parsed) ? parsed.map((id) => String(id)) : []
      }
    } catch (e) {
      console.error("Error parsing workers_present:", e)
      workersPresent = []
    }

    // Parse materials_used - handle both old and new formats
    let materialsUsed: { material_id: string; actual_quantity: number; visible_quantity: number; source_location: string }[] = []
    try {
      if (Array.isArray(log.materials_used)) {
        materialsUsed = log.materials_used.map((material) => ({
          material_id: material.material_id,
          // Handle backward compatibility - if old format, use quantity for both
          actual_quantity: material.actual_quantity !== undefined ? material.actual_quantity : material.quantity || 0,
          visible_quantity:
            material.visible_quantity !== undefined ? material.visible_quantity : material.quantity || 0,
          source_location: material.source_location || "", // Handle potential missing source_location
        }))
      } else if (typeof log.materials_used === "string") {
        const parsed = JSON.parse(log.materials_used || "[]")
        materialsUsed = Array.isArray(parsed)
          ? parsed.map((material) => ({
              material_id: material.material_id,
              actual_quantity:
                material.actual_quantity !== undefined ? material.actual_quantity : material.quantity || 0,
              visible_quantity:
                material.visible_quantity !== undefined ? material.visible_quantity : material.quantity || 0,
              source_location: material.source_location || "", // Handle potential missing source_location
            }))
          : []
      }
    } catch (e) {
      console.error("Error parsing materials_used:", e)
      materialsUsed = []
    }

    // Parse equipment_used - handle both array and string formats
    let equipmentUsed = ""
    try {
      if (Array.isArray(log.equipment_used)) {
        equipmentUsed = log.equipment_used.join(", ")
      } else if (typeof log.equipment_used === "string") {
        equipmentUsed = log.equipment_used
      }
    } catch (e) {
      console.error("Error parsing equipment_used:", e)
      equipmentUsed = ""
    }

    setFormData({
      date: log.date,
      project_id: log.project_id,
      workers_present: workersPresent,
      work_description: log.work_description || log.work_completed || "",
      materials_used: materialsUsed,
      equipment_used: equipmentUsed,
      weather_conditions: log.weather_conditions || log.weather || "Sunny", // Check both fields
      working_place: log.working_place || "",
      hours_worked: log.hours_worked || 8,
      status: log.status || "completed",
      notes: log.notes || "",
    })
    // Set initial selected locations based on the materials used in the log
    const initialLocations = new Set<string>(["storage"]) // Default to storage
    materialsUsed.forEach(mat => {
      if (mat.source_location) {
        initialLocations.add(mat.source_location)
      }
    })
    setSelectedLocationsForMaterial(Array.from(initialLocations))
    setShowEditDialog(true)
  }

  const handleView = (log: DailyLog) => {
    setSelectedLog(log)
    setShowViewDialog(true)
  }

  const handleUpdateDailyLog = async () => {
    if (!canEditDailyLogs) {
      toast({
        title: "Access Denied",
        description: "Only administrators and managers can edit daily logs",
        variant: "destructive",
      })
      return
    }

    if (!selectedLog) return
    try {
      setSaving(true)
      if (!formData.date || !formData.project_id || !formData.work_description) {
        toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" })
        return
      }

      const equipmentArray = toStringArray(formData.equipment_used)

      const logData = {
        title: `Daily Log - ${new Date(formData.date).toLocaleDateString()}`,
        date: formData.date,
        project_id: formData.project_id,
        weather: formData.weather_conditions,
        temperature: 20,
        workers_present: formData.workers_present,
        materials_used: formData.materials_used,
        equipment_used: equipmentArray,
        hours_worked: formData.hours_worked,
        work_completed: formData.work_description,
        status: formData.status,
        working_place: formData.working_place,
      }

      const updatedLog = await updateDailyLog(selectedLog.id, logData)
      if (!updatedLog) {
        toast({ title: "Error", description: "Failed to update daily log.", variant: "destructive" })
        return
      }

      const statusConfig = getStatusConfig(formData.status)
      logActivity({
        type: "daily_log",
        title: "Daily Log Updated",
        description: `Daily log for ${new Date(formData.date).toLocaleDateString()} was updated. Status: ${statusConfig.label}.`,
        icon: Edit,
        variant: "secondary",
      })

      setDailyLogs(dailyLogs.map((log) => (log.id === selectedLog.id ? updatedLog : log)))
      setShowEditDialog(false)
      setSelectedLog(null)
      resetForm()
      toast({ title: "Success", description: "Daily log updated successfully!" })
    } catch (error) {
      console.error("Error updating daily log:", error)
      toast({ title: "Error", description: "Error updating daily log.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (log: DailyLog) => {
    if (!canDeleteDailyLogs) {
      toast({
        title: "Access Denied",
        description: "Only administrators can delete daily logs",
        variant: "destructive",
      })
      return
    }
    setSelectedLog(log)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!selectedLog) return
    try {
      setDeleting(true)
      // Restore materials used in the deleted log
      let materialsToRestore: { id: string; quantity: number }[] = []
      let materialsUsedParsed = selectedLog.materials_used
      if (typeof materialsUsedParsed === "string") {
        try {
          materialsUsedParsed = JSON.parse(materialsUsedParsed)
        } catch (e) {
          materialsUsedParsed = []
        }
      }
      if (Array.isArray(materialsUsedParsed)) {
        materialsToRestore = materialsUsedParsed.map((material) => ({
          id: material.material_id,
          quantity: material.actual_quantity || material.quantity || 0, // Use actual_quantity if available, otherwise fallback
        }))
      }

      const success = await deleteDailyLog(selectedLog.id, materialsToRestore) // Pass materials to restore
      if (!success) {
        toast({ title: "Error", description: "Failed to delete daily log.", variant: "destructive" })
        return
      }

      logActivity({
        type: "daily_log",
        title: "Daily Log Deleted",
        description: `Daily log for ${new Date(selectedLog.date).toLocaleDateString()} was deleted.`,
        icon: Trash2,
        variant: "destructive",
      })

      // setDailyLogs(dailyLogs.filter((log) => log.id !== selectedLog.id)) // Remove this line
      // Reload first page after deleting
      setCurrentPage(1)
      const logs = await getDailyLogs(logsPerPage, 0, { dateFilter, projectFilter }) // Pass filters
      const count = await getDailyLogsCount({ dateFilter, projectFilter }) // Pass filters
      setDailyLogs(logs)
      setTotalLogs(count)
      reloadMaterials() // Reload materials to reflect restored stock

      setShowDeleteDialog(false)
      setSelectedLog(null)
      toast({ title: "Success", description: "Daily log deleted successfully!" })
    } catch (error) {
      console.error("Error deleting daily log:", error)
      toast({ title: "Error", description: "Error deleting daily log.", variant: "destructive" })
    } finally {
      setDeleting(false)
    }
  }

  const handleWorkerToggle = (workerId: string, checked: boolean) => {
    const workerIdStr = String(workerId)
  

    setFormData((prev) => {
      let newWorkersPresent: string[]

      if (checked) {
        // Add worker if not already present
        if (!prev.workers_present.includes(workerIdStr)) {
          newWorkersPresent = [...prev.workers_present, workerIdStr]
        } else {
          newWorkersPresent = prev.workers_present
        }
      } else {
        // Remove worker
        newWorkersPresent = prev.workers_present.filter((id) => String(id) !== workerIdStr)
      }

    
      return {
        ...prev,
        workers_present: newWorkersPresent,
      }
    })
  }

  const handleMaterialChange = (
    materialId: string,
    actualQuantity: number,
    visibleQuantity: number,
    sourceLocation: string, // Add source location parameter
  ) => {
    // </CHANGE>
    setFormData((prev) => {
      const existingIndex = prev.materials_used.findIndex((m) => m.material_id === materialId)

      if (existingIndex >= 0) {
        // Update existing material
        const updatedMaterials = [...prev.materials_used]
        updatedMaterials[existingIndex] = {
          ...updatedMaterials[existingIndex],
          actual_quantity: actualQuantity,
          visible_quantity: visibleQuantity,
          source_location: sourceLocation, // Update source location
        } // </CHANGE>
        return { ...prev, materials_used: updatedMaterials }
      } else {
        // Add new material
        return {
          ...prev,
          materials_used: [
            ...prev.materials_used,
            {
              material_id: materialId,
              actual_quantity: actualQuantity,
              visible_quantity: visibleQuantity,
              source_location: sourceLocation, // Store source location
            }, // </CHANGE>
          ],
        }
      }
    })
  }

  const removeMaterial = (materialId: string) => {
    setFormData((prev) => ({
      ...prev,
      materials_used: prev.materials_used.filter((m) => m.material_id !== materialId),
    }))
  }

  const getProjectName = (projectId: string) => {
    return projects.find((p) => p.id === projectId)?.name || "Unknown Project"
  }

  const getLocationName = (locationId: string) => {
    if (locationId === "storage") return "Central Storage"
    return getProjectName(locationId)
  }
  // </CHANGE>

  const getWorkerName = (workerId: string | number) => {
    // Convert to string for comparison and try both string and number matching
    const workerIdStr = String(workerId)
    const workerIdNum = Number(workerId)

    

    const worker = workers.find(
      (w) => w.id === workerIdStr || w.id === String(workerIdNum) || String(w.id) === workerIdStr,
    )

    
    return worker?.name || `Unknown Worker (ID: ${workerId})`
  }

  const getMaterialName = (materialId: string) => {
    return materials.find((m) => m.id === materialId)?.name || "Unknown Material"
  }

  const getMaterialUnit = (materialId: string) => {
    return materials.find((m) => m.id === materialId)?.unit || "units"
  }

  // Calculate statistics based on filtered logs
  const filteredTotalLogs = filteredLogs.length // Renamed to avoid conflict with totalLogs state
  const thisWeekLogs = filteredLogs.filter((log) => {
    const logDate = new Date(log.date)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return logDate >= weekAgo
  }).length
  const thisMonthLogs = filteredLogs.filter((log) => {
    const logDate = new Date(log.date)
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    return logDate >= monthAgo
  }).length
  const activeProjects = new Set(filteredLogs.map((log) => log.project_id)).size

  // Status statistics
  const statusStats = statusOptions.map((status) => ({
    ...status,
    count: filteredLogs.filter((log) => log.status === status.value).length,
  }))

  // Check if any filters are active
  const hasActiveFilters =
    dateFilter.quickFilter !== "all" || dateFilter.fromDate || dateFilter.toDate || projectFilter !== "all"

  const handleLocationToggle = (locationId: string, checked: boolean) => {
    setSelectedLocationsForMaterial((prev) => {
      if (checked) {
        return [...prev, locationId]
      } else {
        const newLocations = prev.filter((id) => id !== locationId)
        return newLocations.length > 0 ? newLocations : ["storage"] // Always keep at least one
      }
    })
  }
  // </CHANGE>

  const totalPages = Math.ceil(totalLogs / logsPerPage)

  // Function to handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // The useEffect hook will automatically fetch logs for the new page
  }

  const handleAddLog = async () => {
    // Renamed from handleAddDailyLog for clarity
    if (!canAddDailyLogs) {
      toast({
        title: "Access Denied",
        description: "Only administrators and managers can add daily logs",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)
      if (!formData.date || !formData.project_id || !formData.work_description) {
        toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" })
        return
      }

      const equipmentArray = toStringArray(formData.equipment_used)

      const logData = {
        title: `Daily Log - ${new Date(formData.date).toLocaleDateString()}`,
        date: formData.date,
        project_id: formData.project_id,
        weather: formData.weather_conditions,
        temperature: 20, // default
        workers_present: formData.workers_present,
        materials_used: formData.materials_used,
        equipment_used: equipmentArray,
        hours_worked: formData.hours_worked,
        work_completed: formData.work_description,
        status: formData.status,
        working_place: formData.working_place,
      }

      const newLog = await addDailyLog(logData)
      if (!newLog) {
        toast({ title: "Error", description: "Failed to add daily log.", variant: "destructive" })
        return
      }

      // Update material stock for used materials using actual quantities
      for (const materialUsed of formData.materials_used) {
        const material = materials.find((m) => m.id === materialUsed.material_id)
        if (material && materialUsed.actual_quantity > 0) {
          const newStock = Math.max(0, material.current_stock - materialUsed.actual_quantity)
          await updateMaterial(material.id, { current_stock: newStock })

          // Log material usage activity with both quantities
          logActivity({
            type: "material",
            title: "Material Used",
            description: `${materialUsed.actual_quantity} ${material.unit} of ${material.name} used in daily log (Visible: ${materialUsed.visible_quantity} ${material.unit}). Remaining: ${newStock} ${material.unit}`,
            icon: Package,
            variant: newStock <= material.min_stock ? "destructive" : "secondary",
          })
        }
      }

      // Reload materials to reflect updated stock
      reloadMaterials()

      const statusConfig = getStatusConfig(formData.status)
      logActivity({
        type: "daily_log",
        title: "Daily Log Created",
        description: `New daily log created for ${new Date(formData.date).toLocaleDateString()} with status: ${statusConfig.label}.`,
        icon: Plus,
        variant: "default",
      })

      // setDailyLogs([...dailyLogs, newLog]) // This line was removed and replaced with pagination reload
      setCurrentPage(1)
      const logs = await getDailyLogs(logsPerPage, 0, { dateFilter, projectFilter }) // Pass filters
      const count = await getDailyLogsCount({ dateFilter, projectFilter }) // Pass filters
      setDailyLogs(logs)
      setTotalLogs(count)
    } catch (error) {
      console.error("Error adding daily log:", error)
      toast({ title: "Error", description: "Error adding daily log.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLogs}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisWeekCount}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisMonthCount}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProjects}</div>
            <p className="text-xs text-muted-foreground">With logs in range</p>
          </CardContent>
        </Card>
      </div>

      {/* Log Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Log Status Overview</CardTitle>
          <CardDescription>Distribution of daily log statuses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statusStats.map((status) => {
              const StatusIcon = status.icon
              return (
                <div key={status.value} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${status.color}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <StatusIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{status.label}</span>
                    </div>
                    <p className="text-2xl font-bold">{status.count}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Daily Logs Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Daily Logs Management</CardTitle>
              <CardDescription>Track daily work progress and material usage with dual tracking</CardDescription>
            </div>
            {canAddDailyLogs && (
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    resetForm()
                    setShowAddDialog(true)
                  }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Daily Log
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Daily Log</DialogTitle>
                    <DialogDescription>Record daily work progress, materials used, and team activities</DialogDescription>
                  </DialogHeader>
                  
                  {/* Add form content here - continuing below */}
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date">Date *</Label>
                        <Input
                          id="date"
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="project">Project *</Label>
                        <Select
                          value={formData.project_id}
                          onValueChange={(value) => setFormData({ ...formData, project_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select project" />
                          </SelectTrigger>
                          <SelectContent>
                            {projects.map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="work_description">Work Description *</Label>
                      <Textarea
                        id="work_description"
                        value={formData.work_description}
                        onChange={(e) => setFormData({ ...formData, work_description: e.target.value })}
                        placeholder="Describe the work completed today..."
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="working_place">Working Place</Label>
                        <Input
                          id="working_place"
                          value={formData.working_place}
                          onChange={(e) => setFormData({ ...formData, working_place: e.target.value })}
                          placeholder="e.g., Building A, Floor 2"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="hours_worked">Hours Worked</Label>
                        <Input
                          id="hours_worked"
                          type="number"
                          value={formData.hours_worked}
                          onChange={(e) => setFormData({ ...formData, hours_worked: Number(e.target.value) })}
                          min="0"
                          step="0.5"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="weather">Weather</Label>
                        <Select
                          value={formData.weather_conditions}
                          onValueChange={(value) => setFormData({ ...formData, weather_conditions: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {weatherOptions.map((weather) => (
                              <SelectItem key={weather} value={weather}>
                                {weather}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value) => setFormData({ ...formData, status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((status) => {
                              const StatusIcon = status.icon
                              return (
                                <SelectItem key={status.value} value={status.value}>
                                  <div className="flex items-center gap-2">
                                    <StatusIcon className="h-4 w-4" />
                                    {status.label}
                                  </div>
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Workers Section */}
                    <div className="space-y-2">
                      <Label>Workers Present</Label>
                      <ScrollArea className="h-32 border rounded-md p-3">
                        <div className="space-y-2">
                          {workers.map((worker) => {
                            const workerIdStr = String(worker.id)
                            const isChecked = formData.workers_present.includes(workerIdStr)
                            
                            return (
                              <div key={worker.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`worker-${worker.id}`}
                                  checked={isChecked}
                                  onCheckedChange={(checked) => handleWorkerToggle(workerIdStr, checked as boolean)}
                                />
                                <label htmlFor={`worker-${worker.id}`} className="text-sm cursor-pointer">
                                  {worker.name} - {worker.role}
                                </label>
                              </div>
                            )
                          })}
                        </div>
                      </ScrollArea>
                    </div>

                    {/* Materials Section with Location Selection */}
                    <div className="space-y-3 border-t pt-4">
                      <Label>Materials Used</Label>
                      
                      {/* Location Selector */}
                      <Card className="bg-blue-50 dark:bg-blue-950/20">
                        <CardContent className="pt-4">
                          <div className="space-y-3">
                            <p className="text-sm font-medium flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              Step 1: Select Material Source Locations
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="location-storage"
                                  checked={selectedLocationsForMaterial.includes("storage")}
                                  onCheckedChange={(checked) => handleLocationToggle("storage", checked as boolean)}
                                />
                                <label htmlFor="location-storage" className="text-sm cursor-pointer flex items-center gap-2">
                                  <Building2 className="h-4 w-4" />
                                  Central Storage ({materialsByLocation.get("storage")?.length || 0} materials)
                                </label>
                              </div>
                              {projects.map((project) => {
                                const projectMaterials = materialsByLocation.get(project.id) || []
                                return (
                                  <div key={project.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`location-${project.id}`}
                                      checked={selectedLocationsForMaterial.includes(project.id)}
                                      onCheckedChange={(checked) => handleLocationToggle(project.id, checked as boolean)}
                                    />
                                    <label htmlFor={`location-${project.id}`} className="text-sm cursor-pointer flex items-center gap-2">
                                      <Building className="h-4 w-4" />
                                      {project.name} ({projectMaterials.length} materials)
                                    </label>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Material Selection */}
                      {selectedLocationsForMaterial.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Step 2: Add Materials</p>
                          <Select
                            onValueChange={(value) => {
                              const material = availableMaterialsFromLocation.find((m) => m.id === value)
                              if (material) {
                                const sourceLocation = material.project_id || "storage"
                                handleMaterialChange(value, 1, 1, sourceLocation)
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select material to add" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableMaterialsFromLocation.map((material) => {
                                const sourceLocation = material.project_id || "storage"
                                const locationName = getLocationName(sourceLocation)
                                return (
                                  <SelectItem key={material.id} value={material.id}>
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-3 w-3" />
                                      {material.name} - {locationName} (Stock: {material.current_stock} {material.unit})
                                    </div>
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Selected Materials List */}
                      {formData.materials_used.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Selected Materials:</Label>
                          {formData.materials_used.map((mat) => {
                            const material = materials.find((m) => m.id === mat.material_id)
                            if (!material) return null
                            
                            return (
                              <Card key={mat.material_id} className="p-3">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Package className="h-4 w-4 text-muted-foreground" />
                                      <span className="font-medium">{material.name}</span>
                                      <Badge variant="outline" className="text-xs">
                                        <MapPin className="h-3 w-3 mr-1" />
                                        {getLocationName(mat.source_location)}
                                      </Badge>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeMaterial(mat.material_id)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <Label className="text-xs">Visible Quantity ({material.unit})</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        value={mat.visible_quantity || 0}
                                        onChange={(e) =>
                                          handleMaterialChange(
                                            mat.material_id,
                                            mat.actual_quantity,
                                            Number(e.target.value),
                                            mat.source_location
                                          )
                                        }
                                        placeholder="Visible qty"
                                      />
                                    </div>
                                    {isAdmin && (
                                      <div>
                                        <Label className="text-xs flex items-center gap-1">
                                          <Lock className="h-3 w-3" />
                                          Actual Quantity ({material.unit})
                                        </Label>
                                        <Input
                                          type="number"
                                          min="0"
                                          max={material.current_stock}
                                          value={mat.actual_quantity || 0}
                                          onChange={(e) =>
                                            handleMaterialChange(
                                              mat.material_id,
                                              Number(e.target.value),
                                              mat.visible_quantity,
                                              mat.source_location
                                            )
                                          }
                                          placeholder="Actual qty"
                                        />
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    Available: {material.current_stock} {material.unit}
                                  </p>
                                </div>
                              </Card>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="equipment_used">Equipment Used</Label>
                      <Textarea
                        id="equipment_used"
                        value={formData.equipment_used}
                        onChange={(e) => setFormData({ ...formData, equipment_used: e.target.value })}
                        placeholder="Enter equipment used (comma or line separated)"
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Additional Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Any additional notes or observations..."
                        rows={2}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddDailyLog} disabled={saving}>
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Add Log
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <Card className="mb-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  <CardTitle className="text-base">Filter Daily Logs</CardTitle>
                </div>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                    <X className="mr-2 h-4 w-4" />
                    Clear All Filters
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date Filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Filter by Date
                </Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "all", label: "All Dates" },
                    { value: "today", label: "Today" },
                    { value: "week", label: "This Week" },
                    { value: "month", label: "This Month" },
                    { value: "custom", label: "Custom Range" },
                  ].map((filter) => (
                    <Button
                      key={filter.value}
                      variant={dateFilter.quickFilter === filter.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleQuickFilter(filter.value as any)}
                    >
                      {filter.label}
                    </Button>
                  ))}
                </div>
                
                {dateFilter.quickFilter === "custom" && (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="from_date">From Date</Label>
                      <Input
                        id="from_date"
                        type="date"
                        value={dateFilter.fromDate}
                        onChange={(e) =>
                          setDateFilter({ ...dateFilter, fromDate: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="to_date">To Date</Label>
                      <Input
                        id="to_date"
                        type="date"
                        value={dateFilter.toDate}
                        onChange={(e) =>
                          setDateFilter({ ...dateFilter, toDate: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Project Filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Filter by Project
                </Label>
                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {hasActiveFilters && (
                <p className="text-sm text-muted-foreground">
                  Showing all {filteredTotalLogs} logs
                </p>
              )}
            </CardContent>
          </Card>

          {/* Daily Logs Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date (Newest First)</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Work Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Workers</TableHead>
                  <TableHead>Weather</TableHead>
                  <TableHead>Materials Used</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No daily logs found. Add your first log to get started!
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => {
                    const statusConfig = getStatusConfig(log.status || "completed")
                    const StatusIcon = statusConfig.icon
                    
                    return (
                      <TableRow key={log.id}>
                        <TableCell>{new Date(log.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{getProjectName(log.project_id)}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="truncate" title={log.work_description || log.work_completed}>
                            {log.work_description || log.work_completed || "N/A"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.hours_worked || 0}h</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            <Users className="mr-1 h-3 w-3" />
                            {Array.isArray(log.workers_present) ? log.workers_present.length : 0}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.weather || log.weather_conditions || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            <Package className="mr-1 h-3 w-3" />
                            {Array.isArray(log.materials_used) ? log.materials_used.length : 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{log.created_by_user_name || "Unknown User"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleView(log)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canEditDailyLogs && (
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(log)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {canDeleteDailyLogs && (
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(log)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">
              Showing {Math.min((currentPage - 1) * logsPerPage + 1, totalLogs)} to{" "}
              {Math.min(currentPage * logsPerPage, totalLogs)} of {totalLogs} logs
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i
                if (page > totalPages) return null
                
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Button>
                )
              })}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Daily Log Details</DialogTitle>
            <DialogDescription>
              {selectedLog && `Log from ${new Date(selectedLog.date).toLocaleDateString()}`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Date</Label>
                  <p>{new Date(selectedLog.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Project</Label>
                  <p>{getProjectName(selectedLog.project_id)}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-muted-foreground">Work Description</Label>
                <p className="mt-1">{selectedLog.work_description || selectedLog.work_completed}</p>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge className="mt-1">{getStatusConfig(selectedLog.status || "completed").label}</Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Hours Worked</Label>
                  <p className="mt-1">{selectedLog.hours_worked || 0} hours</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Weather</Label>
                  <p className="mt-1">{selectedLog.weather || selectedLog.weather_conditions || "N/A"}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-muted-foreground">Workers Present</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {Array.isArray(selectedLog.workers_present) && selectedLog.workers_present.length > 0 ? (
                    selectedLog.workers_present.map((workerId) => (
                      <Badge key={workerId} variant="secondary">
                        {getWorkerName(workerId)}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No workers assigned</p>
                  )}
                </div>
              </div>
              
              <div>
                <Label className="text-muted-foreground">Materials Used</Label>
                <div className="space-y-2 mt-1">
                  {Array.isArray(selectedLog.materials_used) && selectedLog.materials_used.length > 0 ? (
                    selectedLog.materials_used.map((mat, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 border rounded">
                        <span>{getMaterialName(mat.material_id)}</span>
                        <div className="flex items-center gap-2">
                          {isAdmin && (
                            <Badge variant="outline">
                              Actual: {mat.actual_quantity || mat.quantity} {getMaterialUnit(mat.material_id)}
                            </Badge>
                          )}
                          <Badge variant="secondary">
                            Visible: {mat.visible_quantity || mat.quantity} {getMaterialUnit(mat.material_id)}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No materials used</p>
                  )}
                </div>
              </div>
              
              <div>
                <Label className="text-muted-foreground">Equipment Used</Label>
                <p className="mt-1">
                  {Array.isArray(selectedLog.equipment_used)
                    ? selectedLog.equipment_used.join(", ")
                    : selectedLog.equipment_used || "N/A"}
                </p>
              </div>
              
              <div>
                <Label className="text-muted-foreground">Created By</Label>
                <p className="mt-1">{selectedLog.created_by_user_name || "Unknown User"}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this daily log. Material stock will be restored if materials were used.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleting} className="bg-destructive">
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
