"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
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
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Clock,
  Users,
  Package,
  FileText,
  Download,
  Loader2,
  MapPin,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
} from "lucide-react"
import { addDailyLog, updateDailyLog, deleteDailyLog } from "@/lib/database"
import type { DailyLog, Project, Worker, Material } from "@/lib/database"
import { useToast } from "@/hooks/use-toast"
import type { Activity } from "./recent-activities"

interface DailyLogsTabProps {
  dailyLogs: DailyLog[]
  setDailyLogs: (logs: DailyLog[]) => void
  projects: Project[]
  workers: Worker[]
  materials: Material[]
  logActivity: (activity: Omit<Activity, "id" | "timestamp">) => void
}

interface MaterialUsage {
  material_id: number
  material_name: string
  quantity: number
  unit: string
}

export default function DailyLogsTab({
  dailyLogs = [],
  setDailyLogs = () => {},
  projects = [],
  workers = [],
  materials = [],
  logActivity,
}: DailyLogsTabProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [selectedLog, setSelectedLog] = useState<DailyLog | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    title: "",
    date: new Date().toISOString().split("T")[0],
    project_id: 0,
    work_completed: "",
    working_place: "",
    workers_present: [] as string[],
    materials_used: [] as MaterialUsage[],
    notes: "",
    weather: "Sunny",
    status: "In Progress",
    hours_worked: 8,
  })

  const resetForm = () => {
    setFormData({
      title: "",
      date: new Date().toISOString().split("T")[0],
      project_id: projects[0]?.id || 0,
      work_completed: "",
      working_place: "",
      workers_present: [],
      materials_used: [],
      notes: "",
      weather: "Sunny",
      status: "In Progress",
      hours_worked: 8,
    })
  }

  const handleWorkerToggle = (workerName: string) => {
    setFormData((prev) => ({
      ...prev,
      workers_present: prev.workers_present.includes(workerName)
        ? prev.workers_present.filter((w) => w !== workerName)
        : [...prev.workers_present, workerName],
    }))
  }

  const handleMaterialAdd = () => {
    if (materials.length === 0) {
      toast({
        title: "No Materials",
        description: "Please add materials first before using them in logs.",
        variant: "destructive",
      })
      return
    }

    const firstMaterial = materials[0]
    setFormData((prev) => ({
      ...prev,
      materials_used: [
        ...prev.materials_used,
        {
          material_id: firstMaterial.id,
          material_name: firstMaterial.name,
          quantity: 1,
          unit: firstMaterial.unit,
        },
      ],
    }))
  }

  const handleMaterialRemove = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      materials_used: prev.materials_used.filter((_, i) => i !== index),
    }))
  }

  const handleMaterialChange = (index: number, field: keyof MaterialUsage, value: any) => {
    setFormData((prev) => ({
      ...prev,
      materials_used: prev.materials_used.map((material, i) => {
        if (i === index) {
          if (field === "material_id") {
            const selectedMaterial = materials.find((m) => m.id === value)
            return {
              ...material,
              material_id: value,
              material_name: selectedMaterial?.name || "",
              unit: selectedMaterial?.unit || material.unit,
            }
          }
          return { ...material, [field]: value }
        }
        return material
      }),
    }))
  }

  const handleAddLog = async () => {
    try {
      setSaving(true)
      if (!formData.title || !formData.project_id || !formData.work_completed) {
        toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" })
        return
      }

      const newLog = await addDailyLog(formData)
      if (!newLog) {
        toast({ title: "Error", description: "Failed to add daily log.", variant: "destructive" })
        return
      }

      logActivity({
        type: "daily_log",
        title: "Daily Log Added",
        description: `New daily log "${newLog.title}" was created.`,
        icon: Plus,
        variant: "default",
      })

      setDailyLogs([newLog, ...dailyLogs])
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
    setFormData({
      title: log.title,
      date: log.date,
      project_id: log.project_id,
      work_completed: log.work_completed || "",
      working_place: log.working_place || "",
      workers_present: log.workers_present || [],
      materials_used: log.materials_used || [],
      notes: log.notes,
      weather: log.weather,
      status: log.status,
      hours_worked: log.hours_worked || 8,
    })
    setShowEditDialog(true)
  }

  const handleUpdateLog = async () => {
    if (!selectedLog) return
    try {
      setSaving(true)
      if (!formData.title || !formData.project_id || !formData.work_completed) {
        toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" })
        return
      }

      const updatedLog = await updateDailyLog(selectedLog.id, formData)
      if (!updatedLog) {
        toast({ title: "Error", description: "Failed to update daily log.", variant: "destructive" })
        return
      }

      logActivity({
        type: "daily_log",
        title: "Daily Log Updated",
        description: `Daily log "${updatedLog.title}" was updated.`,
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
        description: `Daily log "${selectedLog.title}" was deleted.`,
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

  const handleView = (log: DailyLog) => {
    setSelectedLog(log)
    setShowViewDialog(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return <Badge variant="default">{status}</Badge>
      case "In Progress":
        return <Badge variant="secondary">{status}</Badge>
      case "On Hold":
        return <Badge variant="outline">{status}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getWeatherIcon = (weather: string) => {
    switch (weather) {
      case "Sunny":
        return <Sun className="h-4 w-4 text-yellow-500" />
      case "Cloudy":
        return <Cloud className="h-4 w-4 text-gray-500" />
      case "Rainy":
        return <CloudRain className="h-4 w-4 text-blue-500" />
      case "Snowy":
        return <CloudSnow className="h-4 w-4 text-blue-300" />
      default:
        return <Sun className="h-4 w-4 text-yellow-500" />
    }
  }

  const generatePDF = (log: DailyLog) => {
    const content = `
DAILY WORK LOG REPORT
=====================

Title: ${log.title}
Date: ${new Date(log.date).toLocaleDateString()}
Project: ${log.project_name || "Unknown Project"}
Working Place: ${log.working_place || "Not specified"}
Status: ${log.status}
Weather: ${log.weather}
Hours Worked: ${log.hours_worked || 0}

WORK COMPLETED:
${log.work_completed || "No work description provided"}

WORKERS PRESENT:
${
  log.workers_present && log.workers_present.length > 0
    ? log.workers_present.map((worker) => `• ${worker}`).join("\n")
    : "No workers recorded"
}

MATERIALS USED:
${
  log.materials_used && log.materials_used.length > 0
    ? log.materials_used
        .map((material) => `• ${material.material_name}: ${material.quantity} ${material.unit}`)
        .join("\n")
    : "No materials used"
}

NOTES:
${log.notes || "No additional notes"}

Generated on: ${new Date().toLocaleString()}
    `.trim()

    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `daily-log-${log.title.replace(/\s+/g, "-").toLowerCase()}-${log.date}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const totalLogs = dailyLogs.length
  const completedLogs = dailyLogs.filter((log) => log.status === "Completed").length
  const inProgressLogs = dailyLogs.filter((log) => log.status === "In Progress").length
  const onHoldLogs = dailyLogs.filter((log) => log.status === "On Hold").length

  return (
    <div className="space-y-6 px-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Daily Logs</h2>
          <p className="text-gray-600">Track daily work progress and activities</p>
        </div>
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
              <DialogDescription>Record daily work activities and progress</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter log title"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="project">Project *</Label>
                  <Select
                    value={formData.project_id.toString()}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, project_id: Number.parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="working_place">Working Place</Label>
                  <Input
                    id="working_place"
                    placeholder="Enter working location"
                    value={formData.working_place}
                    onChange={(e) => setFormData((prev) => ({ ...prev, working_place: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="work_completed">Work Completed *</Label>
                <Textarea
                  id="work_completed"
                  placeholder="Describe the work completed today"
                  value={formData.work_completed}
                  onChange={(e) => setFormData((prev) => ({ ...prev, work_completed: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="weather">Weather</Label>
                  <Select
                    value={formData.weather}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, weather: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sunny">Sunny</SelectItem>
                      <SelectItem value="Cloudy">Cloudy</SelectItem>
                      <SelectItem value="Rainy">Rainy</SelectItem>
                      <SelectItem value="Snowy">Snowy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="On Hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="hours_worked">Hours Worked</Label>
                  <Input
                    id="hours_worked"
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
              </div>

              <div>
                <Label>Workers Present</Label>
                <div className="grid grid-cols-3 gap-2 mt-2 max-h-32 overflow-y-auto border rounded p-2">
                  {workers
                    .filter((w) => w.status === "Active")
                    .map((worker) => (
                      <div key={worker.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`worker-${worker.id}`}
                          checked={formData.workers_present.includes(worker.name)}
                          onChange={() => handleWorkerToggle(worker.name)}
                          className="rounded"
                        />
                        <Label htmlFor={`worker-${worker.id}`} className="text-sm">
                          {worker.name}
                        </Label>
                      </div>
                    ))}
                </div>
                {workers.filter((w) => w.status === "Active").length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">No active workers available</p>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <Label>Materials Used</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleMaterialAdd}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Material
                  </Button>
                </div>
                <div className="space-y-2 mt-2">
                  {formData.materials_used.map((material, index) => (
                    <div key={index} className="flex gap-2 items-center p-2 border rounded">
                      <Select
                        value={material.material_id.toString()}
                        onValueChange={(value) => handleMaterialChange(index, "material_id", Number.parseInt(value))}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {materials.map((mat) => (
                            <SelectItem key={mat.id} value={mat.id.toString()}>
                              {mat.name} (Stock: {mat.current_stock} {mat.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={material.quantity}
                        onChange={(e) =>
                          handleMaterialChange(index, "quantity", Number.parseFloat(e.target.value) || 0)
                        }
                        className="w-20"
                        min="0"
                        step="0.1"
                      />
                      <span className="text-sm text-gray-500 w-12">{material.unit}</span>
                      <Button type="button" variant="outline" size="sm" onClick={() => handleMaterialRemove(index)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes or observations"
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
              <Button onClick={handleAddLog} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Log"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLogs}</div>
            <p className="text-xs text-muted-foreground">Daily entries</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Calendar className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedLogs}</div>
            <p className="text-xs text-muted-foreground">Finished work</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inProgressLogs}</div>
            <p className="text-xs text-muted-foreground">Ongoing work</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Hold</CardTitle>
            <Users className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{onHoldLogs}</div>
            <p className="text-xs text-muted-foreground">Paused work</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Work Logs</CardTitle>
          <CardDescription>Track and manage daily work activities</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Working Place</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Weather</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dailyLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="font-medium">{log.title}</div>
                  </TableCell>
                  <TableCell>{new Date(log.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.project_name || "Unknown Project"}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-gray-500" />
                      <span className="text-sm">{log.working_place || "Not specified"}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(log.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getWeatherIcon(log.weather)}
                      <span className="text-sm">{log.weather}</span>
                    </div>
                  </TableCell>
                  <TableCell>{log.hours_worked || 0}h</TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button variant="outline" size="sm" onClick={() => handleView(log)}>
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(log)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => generatePDF(log)}>
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(log)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {dailyLogs.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No daily logs found. Add your first log to get started!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Daily Log</DialogTitle>
            <DialogDescription>Update daily work activities and progress</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-title">Title *</Label>
                <Input
                  id="edit-title"
                  placeholder="Enter log title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-date">Date *</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-project">Project *</Label>
                <Select
                  value={formData.project_id.toString()}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, project_id: Number.parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-working_place">Working Place</Label>
                <Input
                  id="edit-working_place"
                  placeholder="Enter working location"
                  value={formData.working_place}
                  onChange={(e) => setFormData((prev) => ({ ...prev, working_place: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-work_completed">Work Completed *</Label>
              <Textarea
                id="edit-work_completed"
                placeholder="Describe the work completed today"
                value={formData.work_completed}
                onChange={(e) => setFormData((prev) => ({ ...prev, work_completed: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-weather">Weather</Label>
                <Select
                  value={formData.weather}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, weather: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sunny">Sunny</SelectItem>
                    <SelectItem value="Cloudy">Cloudy</SelectItem>
                    <SelectItem value="Rainy">Rainy</SelectItem>
                    <SelectItem value="Snowy">Snowy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="On Hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-hours_worked">Hours Worked</Label>
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
            </div>

            <div>
              <Label>Workers Present</Label>
              <div className="grid grid-cols-3 gap-2 mt-2 max-h-32 overflow-y-auto border rounded p-2">
                {workers
                  .filter((w) => w.status === "Active")
                  .map((worker) => (
                    <div key={worker.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`edit-worker-${worker.id}`}
                        checked={formData.workers_present.includes(worker.name)}
                        onChange={() => handleWorkerToggle(worker.name)}
                        className="rounded"
                      />
                      <Label htmlFor={`edit-worker-${worker.id}`} className="text-sm">
                        {worker.name}
                      </Label>
                    </div>
                  ))}
              </div>
              {workers.filter((w) => w.status === "Active").length === 0 && (
                <p className="text-sm text-gray-500 mt-2">No active workers available</p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center">
                <Label>Materials Used</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleMaterialAdd}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Material
                </Button>
              </div>
              <div className="space-y-2 mt-2">
                {formData.materials_used.map((material, index) => (
                  <div key={index} className="flex gap-2 items-center p-2 border rounded">
                    <Select
                      value={material.material_id.toString()}
                      onValueChange={(value) => handleMaterialChange(index, "material_id", Number.parseInt(value))}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {materials.map((mat) => (
                          <SelectItem key={mat.id} value={mat.id.toString()}>
                            {mat.name} (Stock: {mat.current_stock} {mat.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={material.quantity}
                      onChange={(e) => handleMaterialChange(index, "quantity", Number.parseFloat(e.target.value) || 0)}
                      className="w-20"
                      min="0"
                      step="0.1"
                    />
                    <span className="text-sm text-gray-500 w-12">{material.unit}</span>
                    <Button type="button" variant="outline" size="sm" onClick={() => handleMaterialRemove(index)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                placeholder="Additional notes or observations"
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
            <Button onClick={handleUpdateLog} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Log"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Daily Log Details</DialogTitle>
            <DialogDescription>View complete daily log information</DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Title</Label>
                  <p className="text-sm">{selectedLog.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Date</Label>
                  <p className="text-sm">{new Date(selectedLog.date).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Project</Label>
                  <p className="text-sm">{selectedLog.project_name || "Unknown Project"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Working Place</Label>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-gray-500" />
                    <p className="text-sm">{selectedLog.working_place || "Not specified"}</p>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Work Completed</Label>
                <p className="text-sm mt-1 p-2 bg-gray-50 rounded">
                  {selectedLog.work_completed || "No description provided"}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Weather</Label>
                  <div className="flex items-center gap-1 mt-1">
                    {getWeatherIcon(selectedLog.weather)}
                    <p className="text-sm">{selectedLog.weather}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedLog.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Hours Worked</Label>
                  <p className="text-sm mt-1">{selectedLog.hours_worked || 0} hours</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Workers Present</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedLog.workers_present && selectedLog.workers_present.length > 0 ? (
                    selectedLog.workers_present.map((worker, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {worker}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No workers recorded</p>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Materials Used</Label>
                <div className="mt-1">
                  {selectedLog.materials_used && selectedLog.materials_used.length > 0 ? (
                    <div className="space-y-1">
                      {selectedLog.materials_used.map((material, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                          <Package className="h-3 w-3 text-gray-500" />
                          <span>{material.material_name}</span>
                          <Badge variant="outline" className="text-xs">
                            {material.quantity} {material.unit}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No materials used</p>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Notes</Label>
                <p className="text-sm mt-1 p-2 bg-gray-50 rounded">{selectedLog.notes || "No additional notes"}</p>
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
            {selectedLog && (
              <Button onClick={() => generatePDF(selectedLog)}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{selectedLog?.title}" and restore any materials used back to inventory. This
              action cannot be undone.
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
    </div>
  )
}
