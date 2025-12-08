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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
import {
  Plus,
  Edit,
  Trash2,
  FileText,
  Calendar,
  Users,
  Package,
  MapPin,
  Clock,
  Loader2,
  Eye,
  Filter,
  X,
  CheckCircle,
  AlertCircle,
  Pause,
  XCircle,
  Building,
  Info,
  Lock,
  Unlock,
  User,
  Building2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import {
  addDailyLog,
  updateDailyLog,
  deleteDailyLog,
  updateMaterial,
  getDailyLogs,
  getDailyLogsCount,
  getDailyLogsStats, // Import getDailyLogsStats
  getDailyLogPhotos, // Added for photo gallery
  addDailyLogPhoto, // Added for photo gallery
  deleteDailyLogPhoto, // Added for photo gallery
} from "@/lib/database"
import type { DailyLog, Project, Worker, Material } from "@/lib/database"
import { useToast } from "@/hooks/use-toast"
import type { Activity } from "./recent-activities"
import PhotoGallery from "@/components/photo-gallery" // Added for photo gallery

interface DailyLogsTabProps {
  dailyLogs: DailyLog[]
  setDailyLogs: (logs: DailyLog[]) => void
  projects: Project[]
  workers: Worker[]
  materials: Material[]
  reloadMaterials: () => void
  logActivity: (activity: Omit<Activity, "id" | "timestamp">) => void
  isAdmin: boolean
  userRole?: string // Add user role prop
  selectedLogId?: string | null // Add optional prop
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
  userRole = "user", // Default to user role
  selectedLogId,
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

  const [workerFilter, setWorkerFilter] = useState("all")
  // </CHANGE>

  const [selectedLocationsForMaterial, setSelectedLocationsForMaterial] = useState<string[]>(["storage"])

  // State for photos - Added
  const [logPhotos, setLogPhotos] = useState<any[]>([])

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
      const logs = await getDailyLogs(logsPerPage, offset, { dateFilter, projectFilter, workerFilter })
      const count = await getDailyLogsCount({ dateFilter, projectFilter, workerFilter })
      // </CHANGE>
      setDailyLogs(logs)
      setTotalLogs(count)
    }
    loadPaginatedLogs()
  }, [currentPage, setDailyLogs, dateFilter, projectFilter, workerFilter])

  // Effect to reload stats when filters change
  useEffect(() => {
    const loadStats = async () => {
      try {
        const statsData = await getDailyLogsStats({
          dateFilter,
          projectFilter,
          workerFilter,
          // </CHANGE>
        })
        if (statsData) {
          setStats(statsData)
        }
      } catch (error) {
        // Silently handle error
      }
    }
    loadStats()
  }, [dateFilter, projectFilter, workerFilter])

  // Effect to open selected log
  useEffect(() => {
    if (selectedLogId && dailyLogs.length > 0) {
      const log = dailyLogs.find((l) => l.id === selectedLogId)
      if (log) {
        handleView(log)
      }
    }
  }, [selectedLogId, dailyLogs])

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
        weekStart.setDate(today.getDay()) // Start of week (Sunday)
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
    setWorkerFilter("all")
    // </CHANGE>
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

    // Apply worker filter
    if (workerFilter !== "all") {
      filtered = filtered.filter((log) => {
        const workersPresent = Array.isArray(log.workers_present)
          ? log.workers_present.map(String)
          : typeof log.workers_present === "string"
            ? JSON.parse(log.workers_present || "[]").map(String)
            : []
        return workersPresent.includes(workerFilter)
      })
    }
    // </CHANGE>

    return filtered
  }, [dailyLogs, dateFilter, projectFilter, workerFilter])

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

          // Update material with reference to the daily log
          await updateMaterial(
            material.id,
            { current_stock: newStock },
            {
              reference_type: "daily_log",
              reference_id: newLog.id,
              notes: `Used in Daily Log - ${newLog.date}`,
            },
          )

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

      // logActivity({ // This logActivity call is duplicated, removed from here
      //   type: "daily_log",
      //   title: "Daily Log Created",
      //   description: `New daily log created for ${new Date(formData.date).toLocaleDateString()} with status: ${statusConfig.label}.`,
      //   icon: Plus,
      //   variant: "default",
      // })

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

      // Verify which workers should be selected
      const matchingWorkers = workers.filter(
        (worker) => workersPresent.includes(String(worker.id)) || workersPresent.includes(worker.id),
      )
    } catch (e) {
      console.error("Error parsing workers_present:", e)
      workersPresent = []
    }

    // Parse materials_used - handle both old and new formats
    let materialsUsed: {
      material_id: string
      actual_quantity: number
      visible_quantity: number
      source_location: string
    }[] = []
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
    materialsUsed.forEach((mat) => {
      if (mat.source_location) {
        initialLocations.add(mat.source_location)
      }
    })
    setSelectedLocationsForMaterial(Array.from(initialLocations))
    setShowEditDialog(true)
  }

  // Load photos for the specified log
  const loadDailyLogPhotos = async (logId: string) => {
    if (!logId) return
    try {
      const photos = await getDailyLogPhotos(logId)
      setLogPhotos(photos)
    } catch (error) {
      console.error("Error loading daily log photos:", error)
      setLogPhotos([])
    }
  }

  // Modified handleView to set viewingLog and load photos
  const handleView = (log: DailyLog) => {
    setSelectedLog(log)
    setViewingLog(log) // Set the log being viewed
    loadDailyLogPhotos(log.id.toString()) // Load photos for this log
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
    dateFilter.quickFilter !== "all" ||
    dateFilter.fromDate ||
    dateFilter.toDate ||
    projectFilter !== "all" ||
    workerFilter !== "all"
  // </CHANGE>

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

  // State for the log being viewed (for PhotoGallery integration)
  const [viewingLog, setViewingLog] = useState<DailyLog | null>(null)
  // const [dailyLogPhotos, setDailyLogPhotos] = useState<any[]>([]) // This state is already declared above

  // const loadDailyLogPhotos = async (logId: string) => {
  //   if (!logId) return
  //   try {
  //     const photos = await getDailyLogPhotos(logId)
  //     setDailyLogPhotos(photos)
  //   } catch (error) {
  //     console.error("Error loading daily log photos:", error)
  //     setDailyLogPhotos([])
  //   }
  // }

  // Modified handleView to set viewingLog and load photos
  // const handleView = (log: DailyLog) => {
  //   setSelectedLog(log)
  //   setViewingLog(log) // Set the log being viewed
  //   loadDailyLogPhotos(log.id.toString()) // Load photos for this log
  //   setShowViewDialog(true)
  // }

  // Updated the PhotoGallery component
  const userProfile = { role: isAdmin ? "admin" : userRole } // Mock userProfile for the example

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Daily Logs Management</h2>
          <p className="text-gray-600">
            Track daily work progress and material usage with dual tracking
            {!canAddDailyLogs && " (View Only)"}
            {canAddDailyLogs && !isAdmin && " (Manager Access)"}
          </p>
        </div>
        {canAddDailyLogs && (
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  resetForm()
                  setShowAddDialog(true)
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Daily Log
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Daily Log</DialogTitle>
                <DialogDescription>Record daily work progress and material usage with dual tracking</DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                {/* </CHANGE> */}
                {/* Remove single location selector, materials now tracked with their source location */}
                {/* </CHANGE> */}
                {/* </CHANGE> */}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="project">Project *</Label>
                    <Select
                      value={formData.project_id}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, project_id: value }))}
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

                <div>
                  <Label htmlFor="work_description">Work Description *</Label>
                  <Textarea
                    id="work_description"
                    placeholder="Describe the work performed today"
                    value={formData.work_description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, work_description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="working_place">Working Place</Label>
                    <Input
                      id="working_place"
                      placeholder="Specific location or area"
                      value={formData.working_place}
                      onChange={(e) => setFormData((prev) => ({ ...prev, working_place: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="weather_conditions">Weather Conditions</Label>
                    <Select
                      value={formData.weather_conditions}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, weather_conditions: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select weather" />
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
                  <div>
                    <Label htmlFor="hours_worked">Hours Worked *</Label>
                    <Input
                      id="hours_worked"
                      type="number"
                      min="0"
                      max="24"
                      step="0.5"
                      value={formData.hours_worked}
                      onChange={(e) => setFormData((prev) => ({ ...prev, hours_worked: Number(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            <div className="flex items-center gap-2">
                              <status.icon className="h-4 w-4" />
                              {status.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="equipment_used">Equipment Used</Label>
                  <Textarea
                    id="equipment_used"
                    placeholder="List equipment and machinery used (separate with commas or new lines)"
                    value={formData.equipment_used}
                    onChange={(e) => setFormData((prev) => ({ ...prev, equipment_used: e.target.value }))}
                    rows={2}
                  />
                </div>

                <div>
                  <Label>Workers Present</Label>
                  <ScrollArea className="h-32 border rounded-md p-3">
                    <div className="space-y-2">
                      {workers
                        .filter((worker) => worker.status === "Active")
                        .map((worker) => {
                          const isChecked = formData.workers_present.includes(String(worker.id))

                          return (
                            <div key={worker.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`worker-${worker.id}`}
                                checked={isChecked}
                                onCheckedChange={(checked) => {
                                  handleWorkerToggle(String(worker.id), checked as boolean)
                                }}
                              />
                              <Label htmlFor={`worker-${worker.id}`} className="text-sm cursor-pointer">
                                {worker.name} - {worker.role}
                              </Label>
                            </div>
                          )
                        })}
                    </div>
                  </ScrollArea>
                  {formData.workers_present.length > 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      Selected: {formData.workers_present.length} worker(s)
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Label>Materials Used</Label>
                    <div className="flex items-center gap-1 text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded">
                      <Info className="h-3 w-3" />
                      Select locations first, then choose materials from those locations
                    </div>
                  </div>
                  <div className="space-y-3">
                    {formData.materials_used.map((materialUsed, index) => {
                      const material = materials.find((m) => m.id === materialUsed.material_id)
                      return (
                        <div key={index} className="p-4 border rounded-lg bg-gray-50">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex flex-col">
                              <span className="font-medium">{getMaterialName(materialUsed.material_id)}</span>
                              <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                <MapPin className="h-3 w-3" />
                                From: {getLocationName(materialUsed.source_location)}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMaterial(materialUsed.material_id)}
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label
                                htmlFor={`material-actual-${materialUsed.material_id}`}
                                className="text-xs flex items-center gap-1"
                              >
                                <Lock className="h-3 w-3" />
                                Actual Usage (Internal)
                              </Label>
                              <div className="flex items-center">
                                <Input
                                  id={`material-actual-${materialUsed.material_id}`}
                                  type="number"
                                  min="0"
                                  step="0.1"
                                  value={materialUsed.actual_quantity}
                                  onChange={(e) =>
                                    handleMaterialChange(
                                      materialUsed.material_id,
                                      Number.parseFloat(e.target.value) || 0,
                                      materialUsed.visible_quantity,
                                      materialUsed.source_location,
                                    )
                                  }
                                  className="flex-1"
                                />
                                <span className="text-sm text-gray-500 ml-2 w-12">
                                  {getMaterialUnit(materialUsed.material_id)}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">Affects inventory calculations</div>
                            </div>
                            <div>
                              <Label
                                htmlFor={`material-visible-${materialUsed.material_id}`}
                                className="text-xs flex items-center gap-1"
                              >
                                <Unlock className="h-3 w-3" />
                                Visible Usage (Public)
                              </Label>
                              <div className="flex items-center">
                                <Input
                                  id={`material-visible-${materialUsed.material_id}`}
                                  type="number"
                                  min="0"
                                  step="0.1"
                                  value={materialUsed.visible_quantity}
                                  onChange={(e) =>
                                    handleMaterialChange(
                                      materialUsed.material_id,
                                      materialUsed.actual_quantity,
                                      Number.parseFloat(e.target.value) || 0,
                                      materialUsed.source_location,
                                    )
                                  }
                                  className="flex-1"
                                />
                                <span className="text-sm text-gray-500 ml-2 w-12">
                                  {getMaterialUnit(materialUsed.material_id)}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">Shown to non-admin users</div>
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    <div className="border rounded-lg p-4 bg-blue-50 space-y-4">
                      <div>
                        <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          1. Select Locations to Pull Materials From
                        </Label>
                        <ScrollArea className="h-48 border rounded-md p-3 bg-white">
                          <div className="space-y-2">
                            {/* Storage option */}
                            <div className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                              <Checkbox
                                id="location-storage"
                                checked={selectedLocationsForMaterial.includes("storage")}
                                onCheckedChange={(checked) => handleLocationToggle("storage", checked as boolean)}
                              />
                              <Label
                                htmlFor="location-storage"
                                className="flex items-center gap-2 cursor-pointer flex-1"
                              >
                                <Package className="h-4 w-4 text-blue-600" />
                                <span className="font-medium">Central Storage</span>
                                <span className="text-xs text-gray-500 ml-auto">
                                  ({materials.filter((m) => !m.project_id).length} materials)
                                </span>
                              </Label>
                            </div>

                            {/* Project options */}
                            {projects.map((project) => {
                              const projectMaterialCount = materials.filter((m) => m.project_id === project.id).length
                              return (
                                <div
                                  key={project.id}
                                  className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
                                >
                                  <Checkbox
                                    id={`location-${project.id}`}
                                    checked={selectedLocationsForMaterial.includes(project.id)}
                                    onCheckedChange={(checked) => handleLocationToggle(project.id, checked as boolean)}
                                  />
                                  <Label
                                    htmlFor={`location-${project.id}`}
                                    className="flex items-center gap-2 cursor-pointer flex-1"
                                  >
                                    <Building2 className="h-4 w-4 text-green-600" />
                                    <span className="font-medium">{project.name}</span>
                                    <span className="text-xs text-gray-500 ml-auto">
                                      ({projectMaterialCount} materials)
                                    </span>
                                  </Label>
                                </div>
                              )
                            })}
                          </div>
                        </ScrollArea>
                        <div className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          {selectedLocationsForMaterial.length} location(s) selected
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          2. Select Material from Selected Locations
                        </Label>
                        {availableMaterialsFromLocation.length > 0 ? (
                          <Select
                            onValueChange={(materialId) => {
                              const material = materials.find((m) => m.id === materialId)
                              if (material && !formData.materials_used.some((m) => m.material_id === materialId)) {
                                const sourceLocation = material.project_id || "storage"
                                handleMaterialChange(materialId, 0, 0, sourceLocation)
                              }
                            }}
                          >
                            <SelectTrigger className="bg-white">
                              <SelectValue
                                placeholder={`Select material (${availableMaterialsFromLocation.length} available)`}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {availableMaterialsFromLocation.map((material) => {
                                const locationName = material.project_id
                                  ? getProjectName(material.project_id)
                                  : "Central Storage"
                                return (
                                  <SelectItem key={material.id} value={material.id}>
                                    <div className="flex items-center gap-2">
                                      <span>{material.name}</span>
                                      <span className="text-xs text-gray-500">
                                        ({material.current_stock} {material.unit})
                                      </span>
                                      <Badge variant="outline" className="text-xs">
                                        {locationName}
                                      </Badge>
                                    </div>
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-sm text-gray-500 bg-white p-3 rounded border">
                            {selectedLocationsForMaterial.length === 0
                              ? "Please select at least one location above"
                              : "No materials available in selected locations"}
                          </p>
                        )}
                      </div>
                    </div>
                    {/* </CHANGE> */}
                  </div>
                  {/* </CHANGE> */}
                </div>

                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any additional observations or notes"
                    value={formData.notes}
                    onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleAddDailyLog} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Daily Log"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Daily Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Date Filter Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <Label className="text-sm font-medium">Filter by Date</Label>
              </div>

              {/* Quick Filter Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={dateFilter.quickFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleQuickFilter("all")}
                >
                  All Dates
                </Button>
                <Button
                  variant={dateFilter.quickFilter === "today" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleQuickFilter("today")}
                >
                  Today
                </Button>
                <Button
                  variant={dateFilter.quickFilter === "week" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleQuickFilter("week")}
                >
                  This Week
                </Button>
                <Button
                  variant={dateFilter.quickFilter === "month" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleQuickFilter("month")}
                >
                  This Month
                </Button>
                <Button
                  variant={dateFilter.quickFilter === "custom" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleQuickFilter("custom")}
                >
                  Custom Range
                </Button>
              </div>

              {/* Custom Date Range Inputs */}
              {dateFilter.quickFilter === "custom" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fromDate">From Date</Label>
                    <Input
                      id="fromDate"
                      type="date"
                      value={dateFilter.fromDate}
                      onChange={(e) => setDateFilter((prev) => ({ ...prev, fromDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="toDate">To Date</Label>
                    <Input
                      id="toDate"
                      type="date"
                      value={dateFilter.toDate}
                      onChange={(e) => setDateFilter((prev) => ({ ...prev, toDate: e.target.value }))}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Project Filter Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                <Label className="text-sm font-medium">Filter by Project</Label>
              </div>

              <div className="max-w-xs">
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
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <Label className="text-sm font-medium">Filter by Worker</Label>
              </div>
              <div className="max-w-xs">
                <Select value={workerFilter} onValueChange={setWorkerFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Workers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Workers</SelectItem>
                    {workers.map((worker) => (
                      <SelectItem key={worker.id} value={String(worker.id)}>
                        {worker.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* </CHANGE> */}

            {/* Filter Summary and Clear Button */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-gray-600">
                {hasActiveFilters ? (
                  <>
                    Showing {filteredLogs.length} of {totalLogs} logs
                    {dateFilter.fromDate && dateFilter.toDate && (
                      <span className="ml-2">
                        from {new Date(dateFilter.fromDate).toLocaleDateString()} to{" "}
                        {new Date(dateFilter.toDate).toLocaleDateString()}
                      </span>
                    )}
                    {projectFilter !== "all" && (
                      <span className="ml-2">for project: {getProjectName(projectFilter)}</span>
                    )}
                    {/* Display worker filter in summary */}
                    {workerFilter !== "all" && <span className="ml-2">by worker: {getWorkerName(workerFilter)}</span>}
                    {/* </CHANGE> */}
                  </>
                ) : (
                  `Showing all ${totalLogs} logs`
                )}
              </div>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear All Filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{hasActiveFilters ? "Filtered Logs" : "Total Logs"}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLogs}</div>
            <p className="text-xs text-muted-foreground">{hasActiveFilters ? "In selected filters" : "All time"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.thisWeekCount}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.thisMonthCount}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <MapPin className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.activeProjects}</div>
            <p className="text-xs text-muted-foreground">With logs in range</p>
          </CardContent>
        </Card>
      </div>

      {/* Status Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Log Status Overview</CardTitle>
          <CardDescription>Distribution of daily log statuses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statusStats.map((status) => (
              <div key={status.value} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className={`w-3 h-3 rounded-full ${status.color}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-1">
                    <status.icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{status.label}</span>
                  </div>
                  <div className="text-2xl font-bold">{status.count}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Work Logs</CardTitle>
          <CardDescription>
            {canAddDailyLogs && !isAdmin
              ? "Track daily work progress and material usage (Manager Access)"
              : isAdmin
                ? "Track daily work progress and material usage with dual tracking"
                : "View daily work progress and material usage"}
            {filteredLogs.length !== dailyLogs.length && (
              <span className="ml-2 text-blue-600">
                (Showing {filteredLogs.length} of {totalLogs} logs)
              </span>
            )}
            <span className="ml-2 text-gray-600 font-semibold">
              Total Logs: {totalLogs} | Page {currentPage} of {totalPages}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="flex items-center gap-1">
                  Date
                  <span className="text-xs text-gray-400">(Newest First)</span>
                </TableHead>
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
              {filteredLogs
                .sort((a, b) => {
                  // Sort by date from newest to oldest
                  const dateA = new Date(a.date).getTime()
                  const dateB = new Date(b.date).getTime()
                  return dateB - dateA
                })
                .map((log) => {
                  const workersPresent = Array.isArray(log.workers_present)
                    ? log.workers_present
                    : JSON.parse(log.workers_present || "[]")

                  // Parse materials_used and handle both old and new formats
                  let materialsUsed = log.materials_used
                  if (typeof materialsUsed === "string") {
                    try {
                      materialsUsed = JSON.parse(materialsUsed)
                    } catch (e) {
                      materialsUsed = []
                    }
                  }

                  const statusConfig = getStatusConfig(log.status || "completed")

                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {new Date(log.date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getProjectName(log.project_id)}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">{log.work_description || log.work_completed}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                          <statusConfig.icon className="h-3 w-3" />
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="text-sm">{log.hours_worked || 0}h</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const workersPresent = Array.isArray(log.workers_present)
                            ? log.workers_present
                            : JSON.parse(log.workers_present || "[]")
                          return workersPresent.length > 0 ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center cursor-help">
                                    <Users className="h-4 w-4 mr-2 text-gray-400" />
                                    <span className="text-sm">{workersPresent.length} workers</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <div className="space-y-1">
                                    <p className="font-semibold text-sm mb-2">Workers Present:</p>
                                    {workersPresent.length > 0 ? (
                                      workersPresent.map((workerId: string | number, idx: number) => {
                                        const workerName = getWorkerName(workerId)
                                        return (
                                          <div key={idx} className="text-sm flex items-center gap-2">
                                            <User className="h-3 w-3" />
                                            {workerName}
                                          </div>
                                        )
                                      })
                                    ) : (
                                      <p className="text-sm text-gray-500">No workers assigned</p>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )
                        })()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{log.weather_conditions || log.weather || "N/A"}</Badge>
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 cursor-help">
                                <Package className="h-4 w-4 mr-2 text-gray-400" />
                                <span className="text-sm">
                                  {Array.isArray(materialsUsed) ? materialsUsed.length : 0} items
                                </span>
                                {isAdmin &&
                                  Array.isArray(materialsUsed) &&
                                  materialsUsed.some((m) => m.actual_quantity !== m.visible_quantity) && (
                                    <div className="flex items-center gap-1 text-xs text-blue-600">
                                      <Lock className="h-3 w-3" />
                                      <span>Dual</span>
                                    </div>
                                  )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-md">
                              <div className="space-y-2">
                                <p className="font-semibold text-sm mb-2">Materials Used:</p>
                                {Array.isArray(materialsUsed) && materialsUsed.length > 0 ? (
                                  materialsUsed.map((material: any, idx: number) => (
                                    <div key={idx} className="text-sm border-b pb-2 last:border-0">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                          <div className="font-medium">{getMaterialName(material.material_id)}</div>
                                          <div className="text-gray-500 text-xs mt-1">
                                            {isAdmin && material.actual_quantity !== material.visible_quantity ? (
                                              <div className="space-y-1">
                                                <div className="flex items-center gap-1">
                                                  <Unlock className="h-3 w-3" />
                                                  Visible: {material.visible_quantity}{" "}
                                                  {getMaterialUnit(material.material_id)}
                                                </div>
                                                <div className="flex items-center gap-1 text-blue-600">
                                                  <Lock className="h-3 w-3" />
                                                  Actual: {material.actual_quantity}{" "}
                                                  {getMaterialUnit(material.material_id)}
                                                </div>
                                              </div>
                                            ) : (
                                              <span>
                                                Quantity: {material.visible_quantity || material.quantity}{" "}
                                                {getMaterialUnit(material.material_id)}
                                              </span>
                                            )}
                                          </div>
                                          {material.source_location && (
                                            <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                                              <MapPin className="h-3 w-3" />
                                              <span>From: {getLocationName(material.source_location)}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-sm text-gray-500">No materials used</p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{log.created_by_user_name || "Unknown User"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleView(log)}>
                            <Eye className="h-3 w-3" />
                          </Button>
                          {canEditDailyLogs && (
                            <Button variant="outline" size="sm" onClick={() => handleEdit(log)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                          {canDeleteDailyLogs && (
                            <Button variant="outline" size="sm" onClick={() => handleDelete(log)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
            </TableBody>
          </Table>
          {filteredLogs.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {hasActiveFilters
                  ? "No logs found matching the selected filters. Try adjusting your filter criteria."
                  : canAddDailyLogs
                    ? "No daily logs found. Add your first log to get started!"
                    : "No daily logs available to view."}
              </p>
            </div>
          )}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500">
              Showing {Math.min((currentPage - 1) * logsPerPage + 1, totalLogs)} to{" "}
              {Math.min(currentPage * logsPerPage, totalLogs)} of {totalLogs} logs
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Daily Log Details</DialogTitle>
            <DialogDescription>View daily log information</DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Date</Label>
                  <p className="text-sm text-gray-600">{new Date(selectedLog.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Project</Label>
                  <div className="mt-1">
                    <Badge variant="outline">{getProjectName(selectedLog.project_id)}</Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created By</Label>
                  <div className="flex items-center gap-1 mt-1">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{selectedLog.created_by_user_name || "Unknown User"}</span>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Work Description</Label>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedLog.work_description || selectedLog.work_completed}
                </p>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium">Working Place</Label>
                  <p className="text-sm text-gray-600">{selectedLog.working_place || "Not specified"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Weather Conditions</Label>
                  <div className="mt-1">
                    <Badge variant="secondary">{selectedLog.weather_conditions || selectedLog.weather || "N/A"}</Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Hours Worked</Label>
                  <p className="text-sm text-gray-600">{selectedLog.hours_worked || 0} hours</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">
                    {(() => {
                      const statusConfig = getStatusConfig(selectedLog.status || "completed")
                      return (
                        <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                          <statusConfig.icon className="h-3 w-3" />
                          {statusConfig.label}
                        </Badge>
                      )
                    })()}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Equipment Used</Label>
                <div className="mt-2">
                  {Array.isArray(selectedLog.equipment_used) && selectedLog.equipment_used.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedLog.equipment_used.map((equipment: string, index: number) => (
                        <Badge key={index} variant="outline">
                          {equipment}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No equipment specified</p>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Workers Present</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(() => {
                    const workersPresent = Array.isArray(selectedLog.workers_present)
                      ? selectedLog.workers_present
                      : JSON.parse(selectedLog.workers_present || "[]")
                    return workersPresent.length > 0 ? (
                      workersPresent.map((workerId: string | number, index: number) => (
                        <Badge key={index} variant="outline">
                          {getWorkerName(workerId)}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-gray-400 text-sm">No workers specified</span>
                    )
                  })()}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Materials Used</Label>
                <div className="mt-2">
                  {(() => {
                    let materialsUsed = selectedLog.materials_used
                    if (typeof materialsUsed === "string") {
                      try {
                        materialsUsed = JSON.parse(materialsUsed)
                      } catch (e) {
                        materialsUsed = []
                      }
                    }

                    return Array.isArray(materialsUsed) && materialsUsed.length > 0 ? (
                      <div className="space-y-2">
                        {materialsUsed.map((materialUsed: any, index: number) => {
                          // Handle both old and new formats
                          const actualQty =
                            materialUsed.actual_quantity !== undefined
                              ? materialUsed.actual_quantity
                              : materialUsed.quantity || 0
                          const visibleQty =
                            materialUsed.visible_quantity !== undefined
                              ? materialUsed.visible_quantity
                              : materialUsed.quantity || 0
                          const hasDualTracking = actualQty !== visibleQty

                          return (
                            <div key={index} className="flex items-center justify-between p-3 border rounded">
                              <div className="flex flex-col">
                                <span className="font-medium">{getMaterialName(materialUsed.material_id)}</span>
                                {hasDualTracking && isAdmin && (
                                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                    <div className="flex items-center gap-1">
                                      <Lock className="h-3 w-3" />
                                      <span>
                                        Actual: {actualQty} {getMaterialUnit(materialUsed.material_id)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Unlock className="h-3 w-3" />
                                      <span>
                                        Visible: {visibleQty} {getMaterialUnit(materialUsed.material_id)}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <span className="text-sm text-gray-600">
                                {isAdmin ? actualQty : visibleQty} {getMaterialUnit(materialUsed.material_id)}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">No materials used</span>
                    )
                  })()}
                </div>
              </div>

              {selectedLog.notes && (
                <div>
                  <Label className="text-sm font-medium">Additional Notes</Label>
                  <p className="text-sm text-gray-600 mt-1">{selectedLog.notes}</p>
                </div>
              )}

              <div>
                <PhotoGallery
                  photos={logPhotos}
                  onPhotosChange={() => loadDailyLogPhotos(selectedLog.id.toString())}
                  entityType="daily_log"
                  entityId={selectedLog.id.toString()}
                  isAdmin={userProfile?.role === "admin"}
                  canUpload={canEditDailyLogs}
                  canDelete={isAdmin}
                  // </CHANGE>
                  addPhotoFn={async (photo) => {
                    if (!selectedLog?.id) return null
                    return await addDailyLogPhoto(selectedLog.id.toString(), photo)
                  }}
                  deletePhotoFn={deleteDailyLogPhoto}
                  projectName={projects.find((p) => p.id === selectedLog?.project_id)?.name}
                  logDate={selectedLog?.date}
                  logId={selectedLog?.id.toString()}
                />
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={() => setShowViewDialog(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {canEditDailyLogs && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Daily Log</DialogTitle>
              <DialogDescription>Update daily work progress and material usage with dual tracking</DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-date">Date *</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-project">Project *</Label>
                  <Select
                    value={formData.project_id}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, project_id: value }))}
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

              <div>
                <Label htmlFor="edit-work_description">Work Description *</Label>
                <Textarea
                  id="edit-work_description"
                  placeholder="Describe the work performed today"
                  value={formData.work_description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, work_description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="edit-working_place">Working Place</Label>
                  <Input
                    id="edit-working_place"
                    placeholder="Specific location or area"
                    value={formData.working_place}
                    onChange={(e) => setFormData((prev) => ({ ...prev, working_place: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-weather_conditions">Weather Conditions</Label>
                  <Select
                    value={formData.weather_conditions}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, weather_conditions: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select weather" />
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
                <div>
                  <Label htmlFor="edit-hours_worked">Hours Worked *</Label>
                  <Input
                    id="edit-hours_worked"
                    type="number"
                    min="0"
                    max="24"
                    step="0.5"
                    value={formData.hours_worked}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, hours_worked: Number.parseFloat(e.target.value) || 0 }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-status">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          <div className="flex items-center gap-2">
                            <status.icon className="h-4 w-4" />
                            {status.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-equipment_used">Equipment Used</Label>
                <Textarea
                  id="edit-equipment_used"
                  placeholder="List equipment and machinery used (separate with commas or new lines)"
                  value={formData.equipment_used}
                  onChange={(e) => setFormData((prev) => ({ ...prev, equipment_used: e.target.value }))}
                  rows={2}
                />
              </div>

              <div>
                <Label>Workers Present</Label>
                <ScrollArea className="h-32 border rounded-md p-3">
                  <div className="space-y-2">
                    {workers
                      .filter((worker) => worker.status === "Active")
                      .map((worker) => {
                        // Check if this worker should be selected using multiple comparison methods
                        const isChecked =
                          formData.workers_present.includes(String(worker.id)) ||
                          formData.workers_present.includes(worker.id) ||
                          formData.workers_present.some((id) => String(id) === String(worker.id))

                        return (
                          <div key={worker.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`edit-worker-${worker.id}`}
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                handleWorkerToggle(String(worker.id), checked as boolean)
                              }}
                            />
                            <Label htmlFor={`edit-worker-${worker.id}`} className="text-sm">
                              {worker.name} - {worker.role}
                            </Label>
                          </div>
                        )
                      })}
                  </div>
                </ScrollArea>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Label>Materials Used</Label>
                  <div className="flex items-center gap-1 text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded">
                    <Info className="h-3 w-3" />
                    Dual tracking: Actual usage affects inventory, Visible usage shown to non-admins
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        1. Select Locations to Pull Materials From
                      </Label>
                      <ScrollArea className="h-48 border rounded-md p-3 bg-white">
                        <div className="space-y-2">
                          {/* Storage option */}
                          <div className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                            <Checkbox
                              id="edit-location-storage"
                              checked={selectedLocationsForMaterial.includes("storage")}
                              onCheckedChange={(checked) => handleLocationToggle("storage", checked as boolean)}
                            />
                            <Label
                              htmlFor="edit-location-storage"
                              className="flex items-center gap-2 cursor-pointer flex-1"
                            >
                              <Package className="h-4 w-4 text-blue-600" />
                              <span className="font-medium">Central Storage</span>
                              <span className="text-xs text-gray-500 ml-auto">
                                ({materials.filter((m) => !m.project_id).length} materials)
                              </span>
                            </Label>
                          </div>

                          {/* Project options */}
                          {projects.map((project) => {
                            const projectMaterialCount = materials.filter((m) => m.project_id === project.id).length
                            return (
                              <div
                                key={project.id}
                                className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
                              >
                                <Checkbox
                                  id={`edit-location-${project.id}`}
                                  checked={selectedLocationsForMaterial.includes(project.id)}
                                  onCheckedChange={(checked) => handleLocationToggle(project.id, checked as boolean)}
                                />
                                <Label
                                  htmlFor={`edit-location-${project.id}`}
                                  className="flex items-center gap-2 cursor-pointer flex-1"
                                >
                                  <Building2 className="h-4 w-4 text-green-600" />
                                  <span className="font-medium">{project.name}</span>
                                  <span className="text-xs text-gray-500 ml-auto">
                                    ({projectMaterialCount} materials)
                                  </span>
                                </Label>
                              </div>
                            )
                          })}
                        </div>
                      </ScrollArea>
                      <div className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        {selectedLocationsForMaterial.length} location(s) selected
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        2. Select Material from Selected Locations
                      </Label>
                      {availableMaterialsFromLocation.length > 0 ? (
                        <Select
                          onValueChange={(materialId) => {
                            const material = materials.find((m) => m.id === materialId)
                            if (material && !formData.materials_used.some((m) => m.material_id === materialId)) {
                              const sourceLocation = material.project_id || "storage"
                              handleMaterialChange(materialId, 0, 0, sourceLocation)
                            }
                          }}
                        >
                          <SelectTrigger className="bg-white">
                            <SelectValue
                              placeholder={`Select material (${availableMaterialsFromLocation.length} available)`}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {availableMaterialsFromLocation.map((material) => {
                              const locationName = material.project_id
                                ? getProjectName(material.project_id)
                                : "Central Storage"
                              return (
                                <SelectItem key={material.id} value={material.id}>
                                  <div className="flex items-center gap-2">
                                    <span>{material.name}</span>
                                    <Badge variant="outline" className="ml-auto text-xs">
                                      {material.project_id ? (
                                        <Building2 className="h-3 w-3 mr-1 inline" />
                                      ) : (
                                        <Package className="h-3 w-3 mr-1 inline" />
                                      )}
                                      {locationName}
                                    </Badge>
                                    <span className="text-xs text-gray-500">
                                      ({material.current_stock} {material.unit})
                                    </span>
                                  </div>
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded border">
                          No materials available in selected locations. Please select at least one location above.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* </CHANGE> */}

                <div className="space-y-3">
                  {formData.materials_used.map((materialUsed, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{getMaterialName(materialUsed.material_id)}</span>
                          <Badge variant="outline" className="text-xs">
                            {materialUsed.source_location === "storage" ? (
                              <>
                                <Package className="h-3 w-3 mr-1" />
                                Central Storage
                              </>
                            ) : (
                              <>
                                <Building2 className="h-3 w-3 mr-1" />
                                {getLocationName(materialUsed.source_location)}
                              </>
                            )}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMaterial(materialUsed.material_id)}
                          className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label
                            htmlFor={`edit-material-actual-${materialUsed.material_id}`}
                            className="text-xs flex items-center gap-1"
                          >
                            <Lock className="h-3 w-3" />
                            Actual Usage (Internal)
                          </Label>
                          <div className="flex items-center">
                            <Input
                              id={`edit-material-actual-${materialUsed.material_id}`}
                              type="number"
                              step="0.1"
                              placeholder="Actual qty"
                              value={materialUsed.actual_quantity}
                              onChange={(e) =>
                                handleMaterialChange(
                                  materialUsed.material_id,
                                  Number.parseFloat(e.target.value) || 0,
                                  materialUsed.visible_quantity,
                                  materialUsed.source_location,
                                )
                              }
                              className="flex-1"
                            />
                            <span className="text-sm text-gray-500 ml-2 w-12">
                              {getMaterialUnit(materialUsed.material_id)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">Affects inventory calculations</div>
                        </div>
                        <div>
                          <Label
                            htmlFor={`edit-material-visible-${materialUsed.material_id}`}
                            className="text-xs flex items-center gap-1"
                          >
                            <Unlock className="h-3 w-3" />
                            Visible Usage (Public)
                          </Label>
                          <div className="flex items-center">
                            <Input
                              id={`edit-material-visible-${materialUsed.material_id}`}
                              type="number"
                              step="0.1"
                              placeholder="Visible qty"
                              value={materialUsed.visible_quantity}
                              onChange={(e) =>
                                handleMaterialChange(
                                  materialUsed.material_id,
                                  materialUsed.actual_quantity,
                                  Number.parseFloat(e.target.value) || 0,
                                  materialUsed.source_location,
                                )
                              }
                              className="flex-1"
                            />
                            <span className="text-sm text-gray-500 ml-2 w-12">
                              {getMaterialUnit(materialUsed.material_id)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">Shown to non-admin users</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* </CHANGE> */}
                </div>
              </div>

              <div>
                <Label htmlFor="edit-notes">Additional Notes</Label>
                <Textarea
                  id="edit-notes"
                  placeholder="Any additional observations or notes"
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleUpdateDailyLog} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Daily Log"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {canDeleteDailyLogs && (
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the daily log for{" "}
                {selectedLog && new Date(selectedLog.date).toLocaleDateString()} and all its data. This action cannot be
                undone and will restore any materials used back to inventory.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700">
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  "Delete Log"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
