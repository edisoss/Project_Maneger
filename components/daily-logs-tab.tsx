"use client"

import { useState, useMemo } from "react"
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
} from "lucide-react"
import { addDailyLog, updateDailyLog, deleteDailyLog, updateMaterial } from "@/lib/database"
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
}: DailyLogsTabProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [selectedLog, setSelectedLog] = useState<DailyLog | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()

  // Date filtering state
  const [dateFilter, setDateFilter] = useState({
    fromDate: "",
    toDate: "",
    quickFilter: "all" as "all" | "today" | "week" | "month" | "custom",
  })

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    project_id: "",
    workers_present: [] as string[],
    work_description: "",
    materials_used: [] as { material_id: string; quantity: number }[],
    equipment_used: "",
    weather_conditions: "",
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
  }

  const clearDateFilter = () => {
    setDateFilter({
      fromDate: "",
      toDate: "",
      quickFilter: "all",
    })
  }

  // Filter logs based on date range
  const filteredLogs = useMemo(() => {
    if (dateFilter.quickFilter === "all" && !dateFilter.fromDate && !dateFilter.toDate) {
      return dailyLogs
    }

    return dailyLogs.filter((log) => {
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
  }, [dailyLogs, dateFilter])

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
  }

  const handleAddDailyLog = async () => {
    if (!isAdmin) {
      toast({ title: "Access Denied", description: "Only administrators can add daily logs", variant: "destructive" })
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

      // Update material stock for used materials
      for (const materialUsed of formData.materials_used) {
        const material = materials.find((m) => m.id === materialUsed.material_id)
        if (material && materialUsed.quantity > 0) {
          const newStock = Math.max(0, material.current_stock - materialUsed.quantity)
          await updateMaterial(material.id, { current_stock: newStock })

          // Log material usage activity
          logActivity({
            type: "material",
            title: "Material Used",
            description: `${materialUsed.quantity} ${material.unit} of ${material.name} used in daily log. Remaining: ${newStock} ${material.unit}`,
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

      setDailyLogs([...dailyLogs, newLog])
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
    console.log("Editing log:", log)
    console.log("Available workers:", workers)
    setSelectedLog(log)

    // Parse workers_present - handle both array and JSON string formats
    let workersPresent: string[] = []
    try {
      console.log("=== DEBUGGING WORKERS_PRESENT ===")
      console.log("Raw workers_present:", log.workers_present, typeof log.workers_present)
      console.log(
        "Available workers:",
        workers.map((w) => ({ id: w.id, name: w.name, idType: typeof w.id })),
      )

      if (Array.isArray(log.workers_present)) {
        // Convert all to strings for consistent comparison
        workersPresent = log.workers_present.map((id) => String(id))
        console.log("Parsed as array:", workersPresent)
      } else if (typeof log.workers_present === "string") {
        const parsed = JSON.parse(log.workers_present || "[]")
        workersPresent = Array.isArray(parsed) ? parsed.map((id) => String(id)) : []
        console.log("Parsed from JSON string:", workersPresent)
      }

      // Verify which workers should be selected
      const matchingWorkers = workers.filter(
        (worker) => workersPresent.includes(String(worker.id)) || workersPresent.includes(worker.id),
      )
      console.log(
        "Workers that should be selected:",
        matchingWorkers.map((w) => ({ id: w.id, name: w.name })),
      )
      console.log("=== END DEBUGGING ===")
    } catch (e) {
      console.error("Error parsing workers_present:", e)
      workersPresent = []
    }

    // Parse materials_used - handle both array and JSON string formats
    let materialsUsed: { material_id: string; quantity: number }[] = []
    try {
      if (Array.isArray(log.materials_used)) {
        materialsUsed = log.materials_used
      } else if (typeof log.materials_used === "string") {
        const parsed = JSON.parse(log.materials_used || "[]")
        materialsUsed = Array.isArray(parsed) ? parsed : []
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
    setShowEditDialog(true)
  }

  const handleView = (log: DailyLog) => {
    setSelectedLog(log)
    setShowViewDialog(true)
  }

  const handleUpdateDailyLog = async () => {
    if (!isAdmin) {
      toast({ title: "Access Denied", description: "Only administrators can edit daily logs", variant: "destructive" })
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
    if (!isAdmin) {
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
      const success = await deleteDailyLog(selectedLog.id)
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

      setDailyLogs(dailyLogs.filter((log) => log.id !== selectedLog.id))
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
    console.log(`handleWorkerToggle called: ${workerIdStr} -> ${checked}`)

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

      console.log("Updated workers_present:", newWorkersPresent)
      return {
        ...prev,
        workers_present: newWorkersPresent,
      }
    })
  }

  const handleMaterialChange = (materialId: string, quantity: number) => {
    setFormData((prev) => ({
      ...prev,
      materials_used: prev.materials_used.some((m) => m.material_id === materialId)
        ? prev.materials_used.map((m) => (m.material_id === materialId ? { ...m, quantity } : m))
        : [...prev.materials_used, { material_id: materialId, quantity }],
    }))
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

  const getWorkerName = (workerId: string | number) => {
    // Convert to string for comparison and try both string and number matching
    const workerIdStr = String(workerId)
    const workerIdNum = Number(workerId)

    console.log("Looking for worker:", workerId, "as string:", workerIdStr, "as number:", workerIdNum)
    console.log(
      "Available workers:",
      workers.map((w) => ({ id: w.id, name: w.name, idType: typeof w.id })),
    )

    const worker = workers.find(
      (w) => w.id === workerIdStr || w.id === String(workerIdNum) || String(w.id) === workerIdStr,
    )

    console.log("Found worker:", worker)
    return worker?.name || `Unknown Worker (ID: ${workerId})`
  }

  const getMaterialName = (materialId: string) => {
    return materials.find((m) => m.id === materialId)?.name || "Unknown Material"
  }

  const getMaterialUnit = (materialId: string) => {
    return materials.find((m) => m.id === materialId)?.unit || "units"
  }

  // Calculate statistics based on filtered logs
  const totalLogs = filteredLogs.length
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Daily Logs Management</h2>
          <p className="text-gray-600">
            Track daily work progress and material usage
            {!isAdmin && " (View Only)"}
          </p>
        </div>
        {isAdmin && (
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
                <DialogDescription>Record daily work progress and material usage</DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
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
                          console.log(`Add Dialog - Worker ${worker.name} (ID: ${worker.id}):`, {
                            isChecked,
                            formWorkersPresent: formData.workers_present,
                            workerIdAsString: String(worker.id),
                          })

                          return (
                            <div key={worker.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`worker-${worker.id}`}
                                checked={isChecked}
                                onCheckedChange={(checked) => {
                                  console.log(`Add Dialog - Toggling worker ${worker.name} (${worker.id}): ${checked}`)
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
                  <Label>Materials Used</Label>
                  <div className="space-y-2">
                    {formData.materials_used.map((materialUsed, index) => {
                      const material = materials.find((m) => m.id === materialUsed.material_id)
                      return (
                        <div key={index} className="flex items-center gap-2 p-2 border rounded">
                          <span className="flex-1">{getMaterialName(materialUsed.material_id)}</span>
                          <Input
                            type="number"
                            min="0"
                            step="0.1"
                            value={materialUsed.quantity}
                            onChange={(e) =>
                              handleMaterialChange(materialUsed.material_id, Number.parseFloat(e.target.value) || 0)
                            }
                            className="w-24"
                          />
                          <span className="text-sm text-gray-500">{getMaterialUnit(materialUsed.material_id)}</span>
                          <Button variant="outline" size="sm" onClick={() => removeMaterial(materialUsed.material_id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )
                    })}
                    <Select
                      onValueChange={(materialId) => {
                        if (!formData.materials_used.some((m) => m.material_id === materialId)) {
                          handleMaterialChange(materialId, 0)
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Add material" />
                      </SelectTrigger>
                      <SelectContent>
                        {materials
                          .filter((material) => !formData.materials_used.some((m) => m.material_id === material.id))
                          .map((material) => (
                            <SelectItem key={material.id} value={material.id}>
                              {material.name} ({material.current_stock} {material.unit} available)
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
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

      {/* Date Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter by Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Quick Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={dateFilter.quickFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => handleQuickFilter("all")}
              >
                All Logs
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
              {(dateFilter.fromDate || dateFilter.toDate) && (
                <Button variant="ghost" size="sm" onClick={clearDateFilter}>
                  <X className="h-4 w-4 mr-1" />
                  Clear Filter
                </Button>
              )}
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

            {/* Filter Summary */}
            {(dateFilter.fromDate || dateFilter.toDate) && (
              <div className="text-sm text-gray-600">
                Showing logs from{" "}
                {dateFilter.fromDate ? new Date(dateFilter.fromDate).toLocaleDateString() : "beginning"} to{" "}
                {dateFilter.toDate ? new Date(dateFilter.toDate).toLocaleDateString() : "end"} ({filteredLogs.length}{" "}
                logs found)
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {dateFilter.quickFilter === "all" ? "Total Logs" : "Filtered Logs"}
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLogs}</div>
            <p className="text-xs text-muted-foreground">
              {dateFilter.quickFilter === "all" ? "All time" : "In selected range"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{thisWeekLogs}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{thisMonthLogs}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <MapPin className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{activeProjects}</div>
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
            {isAdmin ? "Track daily work progress and material usage" : "View daily work progress and material usage"}
            {filteredLogs.length !== dailyLogs.length && (
              <span className="ml-2 text-blue-600">
                (Showing {filteredLogs.length} of {dailyLogs.length} logs)
              </span>
            )}
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
                  const materialsUsed = Array.isArray(log.materials_used)
                    ? log.materials_used
                    : JSON.parse(log.materials_used || "[]")
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
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="text-sm">{workersPresent.length} workers</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{log.weather_conditions || log.weather || "N/A"}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Package className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="text-sm">{materialsUsed.length} items</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleView(log)}>
                            <Eye className="h-3 w-3" />
                          </Button>
                          {isAdmin && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => handleEdit(log)}>
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleDelete(log)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
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
                {dateFilter.quickFilter === "all"
                  ? isAdmin
                    ? "No daily logs found. Add your first log to get started!"
                    : "No daily logs available to view."
                  : "No logs found in the selected date range. Try adjusting your filter."}
              </p>
            </div>
          )}
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
              <div className="grid grid-cols-2 gap-4">
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
                    const materialsUsed = Array.isArray(selectedLog.materials_used)
                      ? selectedLog.materials_used
                      : JSON.parse(selectedLog.materials_used || "[]")
                    return materialsUsed.length > 0 ? (
                      <div className="space-y-2">
                        {materialsUsed.map((materialUsed: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded">
                            <span className="font-medium">{getMaterialName(materialUsed.material_id)}</span>
                            <span className="text-sm text-gray-600">
                              {materialUsed.quantity} {getMaterialUnit(materialUsed.material_id)}
                            </span>
                          </div>
                        ))}
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
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={() => setShowViewDialog(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {isAdmin && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Daily Log</DialogTitle>
              <DialogDescription>Update daily work progress and material usage</DialogDescription>
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
                    onChange={(e) => setFormData((prev) => ({ ...prev, hours_worked: Number(e.target.value) || 0 }))}
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

                        console.log(`Worker ${worker.name} (ID: ${worker.id}, type: ${typeof worker.id}):`, {
                          isChecked,
                          formWorkersPresent: formData.workers_present,
                          workerIdAsString: String(worker.id),
                        })

                        return (
                          <div key={worker.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`edit-worker-${worker.id}`}
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                console.log(`Toggling worker ${worker.name} (${worker.id}): ${checked}`)
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
                <Label>Materials Used</Label>
                <div className="space-y-2">
                  {formData.materials_used.map((materialUsed, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded">
                      <span className="flex-1">{getMaterialName(materialUsed.material_id)}</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        value={materialUsed.quantity}
                        onChange={(e) =>
                          handleMaterialChange(materialUsed.material_id, Number.parseFloat(e.target.value) || 0)
                        }
                        className="w-24"
                      />
                      <span className="text-sm text-gray-500">{getMaterialUnit(materialUsed.material_id)}</span>
                      <Button variant="outline" size="sm" onClick={() => removeMaterial(materialUsed.material_id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <Select
                    onValueChange={(materialId) => {
                      if (!formData.materials_used.some((m) => m.material_id === materialId)) {
                        handleMaterialChange(materialId, 0)
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Add material" />
                    </SelectTrigger>
                    <SelectContent>
                      {materials
                        .filter((material) => !formData.materials_used.some((m) => m.material_id === material.id))
                        .map((material) => (
                          <SelectItem key={material.id} value={material.id}>
                            {material.name} ({material.current_stock} {material.unit} available)
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
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
      {isAdmin && (
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the daily log for{" "}
                {selectedLog && new Date(selectedLog.date).toLocaleDateString()} and all its data. This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} disabled={deleting}>
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
