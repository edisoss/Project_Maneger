"use client"

import { useState } from "react"
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
  Eye,
  FileText,
  Calendar,
  Users,
  Package,
  MapPin,
  Download,
  Loader2,
  X,
  Clock,
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
  reloadMaterials?: () => Promise<void>
  logActivity: (activity: Omit<Activity, "id" | "timestamp">) => void
}

export default function DailyLogsTab({
  dailyLogs = [],
  setDailyLogs = () => {},
  projects = [],
  workers = [],
  materials = [],
  reloadMaterials,
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
    hours_worked: 8,
    workers_present: [] as string[],
    materials_used: [] as Array<{
      material_id: number
      material_name: string
      quantity: number
      unit: string
    }>,
    notes: "",
    weather: "Clear",
    status: "Completed",
  })

  const weatherOptions = ["Clear", "Cloudy", "Rainy", "Stormy", "Snowy", "Foggy", "Windy"]
  const statusOptions = ["Completed", "In Progress", "Delayed", "Cancelled"]

  const resetForm = () => {
    setFormData({
      title: "",
      date: new Date().toISOString().split("T")[0],
      project_id: projects[0]?.id || 0,
      work_completed: "",
      working_place: "",
      hours_worked: 8,
      workers_present: [],
      materials_used: [],
      notes: "",
      weather: "Clear",
      status: "Completed",
    })
  }

  const handleAddLog = async () => {
    try {
      setSaving(true)
      if (!formData.title || !formData.date || !formData.project_id || !formData.work_completed) {
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
        title: "Daily Log Created",
        description: `New daily log "${newLog.title}" was created.`,
        icon: Plus,
        variant: "default",
      })

      setDailyLogs([newLog, ...dailyLogs])
      setShowAddDialog(false)
      resetForm()
      toast({ title: "Success", description: "Daily log added successfully!" })

      // Reload materials to update stock display on overview
      if (reloadMaterials) {
        await reloadMaterials()
      }
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
      hours_worked: log.hours_worked || 8,
      workers_present: log.workers_present || [],
      materials_used: log.materials_used || [],
      // Ensure Textarea gets a string, not null
      notes: log.notes || "",
      weather: log.weather,
      status: log.status,
    })
    setShowEditDialog(true)
  }

  const handleUpdateLog = async () => {
    if (!selectedLog) return
    try {
      setSaving(true)
      if (!formData.title || !formData.date || !formData.project_id || !formData.work_completed) {
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

      // Reload materials to update stock display on overview
      if (reloadMaterials) {
        await reloadMaterials()
      }
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

      // Reload materials to update stock display on overview
      if (reloadMaterials) {
        await reloadMaterials()
      }
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

  const handleWorkerToggle = (workerName: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      workers_present: checked
        ? [...prev.workers_present, workerName]
        : prev.workers_present.filter((w) => w !== workerName),
    }))
  }

  const handleMaterialAdd = (materialId: number) => {
    const material = materials.find((m) => m.id === materialId)
    if (!material) return

    const existingMaterial = formData.materials_used.find((m) => m.material_id === materialId)
    if (existingMaterial) {
      toast({ title: "Info", description: "Material already added", variant: "default" })
      return
    }

    setFormData((prev) => ({
      ...prev,
      materials_used: [
        ...prev.materials_used,
        {
          material_id: materialId,
          material_name: material.name,
          quantity: 1,
          unit: material.unit,
        },
      ],
    }))
  }

  const handleMaterialQuantityChange = (materialId: number, quantity: number) => {
    setFormData((prev) => ({
      ...prev,
      materials_used: prev.materials_used.map((m) =>
        m.material_id === materialId ? { ...m, quantity: Math.max(0, quantity) } : m,
      ),
    }))
  }

  const handleMaterialRemove = (materialId: number) => {
    setFormData((prev) => ({
      ...prev,
      materials_used: prev.materials_used.filter((m) => m.material_id !== materialId),
    }))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return <Badge variant="default">{status}</Badge>
      case "In Progress":
        return <Badge variant="secondary">{status}</Badge>
      case "Delayed":
        return <Badge variant="destructive">{status}</Badge>
      case "Cancelled":
        return <Badge variant="outline">{status}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getWeatherIcon = (weather: string) => {
    switch (weather) {
      case "Clear":
        return "☀️"
      case "Cloudy":
        return "☁️"
      case "Rainy":
        return "🌧️"
      case "Stormy":
        return "⛈️"
      case "Snowy":
        return "❄️"
      case "Foggy":
        return "🌫️"
      case "Windy":
        return "💨"
      default:
        return "🌤️"
    }
  }

  const generatePDF = (log: DailyLog) => {
    // Simple PDF generation using browser print
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const project = projects.find((p) => p.id === log.project_id)
    const materialsUsedText =
      log.materials_used?.map((m) => `${m.material_name}: ${m.quantity} ${m.unit}`).join(", ") || "None"

    printWindow.document.write(`
      <html>
        <head>
          <title>Daily Log - ${log.title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .section { margin-bottom: 15px; }
            .label { font-weight: bold; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Daily Work Log</h1>
            <h2>${log.title}</h2>
          </div>
          
          <div class="grid">
            <div>
              <div class="section">
                <span class="label">Date:</span> ${new Date(log.date).toLocaleDateString()}
              </div>
              <div class="section">
                <span class="label">Project:</span> ${project?.name || "Unknown"}
              </div>
              <div class="section">
                <span class="label">Working Place:</span> ${log.working_place || "Not specified"}
              </div>
              <div class="section">
                <span class="label">Hours Worked:</span> ${log.hours_worked || 0} hours
              </div>
            </div>
            
            <div>
              <div class="section">
                <span class="label">Weather:</span> ${log.weather}
              </div>
              <div class="section">
                <span class="label">Status:</span> ${log.status}
              </div>
              <div class="section">
                <span class="label">Workers Present:</span> ${log.workers_present?.join(", ") || "None"}
              </div>
            </div>
          </div>
          
          <div class="section">
            <span class="label">Work Completed:</span>
            <p>${log.work_completed}</p>
          </div>
          
          <div class="section">
            <span class="label">Materials Used:</span>
            <p>${materialsUsedText}</p>
          </div>
          
          <div class="section">
            <span class="label">Notes:</span>
            <p>${log.notes}</p>
          </div>
          
          <div class="section" style="margin-top: 30px; font-size: 12px; color: #666;">
            Generated on ${new Date().toLocaleString()}
          </div>
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.print()
  }

  // Calculate statistics
  const totalLogs = dailyLogs.length
  const completedLogs = dailyLogs.filter((log) => log.status === "Completed").length
  const inProgressLogs = dailyLogs.filter((log) => log.status === "In Progress").length
  const thisWeekLogs = dailyLogs.filter((log) => {
    const logDate = new Date(log.date)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return logDate >= weekAgo
  }).length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Daily Logs Management</h2>
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
              <DialogTitle>Add New Daily Log</DialogTitle>
              <DialogDescription>Record daily work activities and progress</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Log Title *</Label>
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
                <div>
                  <Label htmlFor="weather">Weather</Label>
                  <Select
                    value={formData.weather}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, weather: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select weather" />
                    </SelectTrigger>
                    <SelectContent>
                      {weatherOptions.map((weather) => (
                        <SelectItem key={weather} value={weather}>
                          {getWeatherIcon(weather)} {weather}
                        </SelectItem>
                      ))}
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
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Workers Present</Label>
                <ScrollArea className="h-32 border rounded-md p-3">
                  <div className="space-y-2">
                    {workers.map((worker) => (
                      <div key={worker.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`worker-${worker.id}`}
                          checked={formData.workers_present.includes(worker.name)}
                          onCheckedChange={(checked) => handleWorkerToggle(worker.name, checked as boolean)}
                        />
                        <Label htmlFor={`worker-${worker.id}`} className="text-sm">
                          {worker.name} - {worker.role}
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div>
                <Label>Materials Used</Label>
                <div className="space-y-2">
                  <Select onValueChange={(value) => handleMaterialAdd(Number.parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Add material" />
                    </SelectTrigger>
                    <SelectContent>
                      {materials
                        .filter((m) => !formData.materials_used.some((used) => used.material_id === m.id))
                        .map((material) => (
                          <SelectItem key={material.id} value={material.id.toString()}>
                            {material.name} (Available: {material.current_stock} {material.unit})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  {formData.materials_used.length > 0 && (
                    <div className="border rounded-md p-3 space-y-2">
                      {formData.materials_used.map((material) => (
                        <div key={material.material_id} className="flex items-center gap-2">
                          <span className="flex-1 text-sm">{material.material_name}</span>
                          <Input
                            type="number"
                            min="0"
                            step="0.1"
                            value={material.quantity}
                            onChange={(e) =>
                              handleMaterialQuantityChange(material.material_id, Number.parseFloat(e.target.value) || 0)
                            }
                            className="w-20"
                          />
                          <span className="text-sm text-gray-500">{material.unit}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMaterialRemove(material.material_id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes or observations"
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={3}
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
            <p className="text-xs text-muted-foreground">All time logs</p>
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
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{thisWeekLogs}</div>
            <p className="text-xs text-muted-foreground">Recent logs</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Work Logs</CardTitle>
          <CardDescription>Track daily work progress and activities</CardDescription>
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
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dailyLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="font-medium">{log.title}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {log.work_completed?.substring(0, 50)}...
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {new Date(log.date).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.project_name || "Unknown"}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      {log.working_place || "Not specified"}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(log.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span className="mr-2">{getWeatherIcon(log.weather)}</span>
                      {log.weather}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleView(log)}>
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => generatePDF(log)}>
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(log)}>
                        <Edit className="h-3 w-3" />
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

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedLog?.title}</DialogTitle>
            <DialogDescription>Daily log details</DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Date</Label>
                  <p className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    {new Date(selectedLog.date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Project</Label>
                  <p>{selectedLog.project_name || "Unknown"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Working Place</Label>
                  <p className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    {selectedLog.working_place || "Not specified"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Hours Worked</Label>
                  <p>{selectedLog.hours_worked || 0} hours</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Weather</Label>
                  <p className="flex items-center">
                    <span className="mr-2">{getWeatherIcon(selectedLog.weather)}</span>
                    {selectedLog.weather}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div>{getStatusBadge(selectedLog.status)}</div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Work Completed</Label>
                <p className="mt-1 p-3 bg-gray-50 rounded-md">{selectedLog.work_completed}</p>
              </div>

              <div>
                <Label className="text-sm font-medium">Workers Present</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedLog.workers_present && selectedLog.workers_present.length > 0 ? (
                    selectedLog.workers_present.map((worker, index) => (
                      <Badge key={index} variant="secondary">
                        <Users className="h-3 w-3 mr-1" />
                        {worker}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-gray-500">No workers recorded</span>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Materials Used</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedLog.materials_used && selectedLog.materials_used.length > 0 ? (
                    selectedLog.materials_used.map((material, index) => (
                      <Badge key={index} variant="outline">
                        <Package className="h-3 w-3 mr-1" />
                        {material.material_name}: {material.quantity} {material.unit}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-gray-500">No materials recorded</span>
                  )}
                </div>
              </div>

              {selectedLog.notes && (
                <div>
                  <Label className="text-sm font-medium">Notes</Label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-md">{selectedLog.notes}</p>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => selectedLog && generatePDF(selectedLog)}>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button onClick={() => setShowViewDialog(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog - Similar to Add Dialog but with pre-filled data */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Daily Log</DialogTitle>
            <DialogDescription>Update daily work activities and progress</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-title">Log Title *</Label>
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
              <div>
                <Label htmlFor="edit-weather">Weather</Label>
                <Select
                  value={formData.weather}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, weather: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select weather" />
                  </SelectTrigger>
                  <SelectContent>
                    {weatherOptions.map((weather) => (
                      <SelectItem key={weather} value={weather}>
                        {getWeatherIcon(weather)} {weather}
                      </SelectItem>
                    ))}
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
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Workers Present</Label>
              <ScrollArea className="h-32 border rounded-md p-3">
                <div className="space-y-2">
                  {workers.map((worker) => (
                    <div key={worker.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-worker-${worker.id}`}
                        checked={formData.workers_present.includes(worker.name)}
                        onCheckedChange={(checked) => handleWorkerToggle(worker.name, checked as boolean)}
                      />
                      <Label htmlFor={`edit-worker-${worker.id}`} className="text-sm">
                        {worker.name} - {worker.role}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div>
              <Label>Materials Used</Label>
              <div className="space-y-2">
                <Select onValueChange={(value) => handleMaterialAdd(Number.parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add material" />
                  </SelectTrigger>
                  <SelectContent>
                    {materials
                      .filter((m) => !formData.materials_used.some((used) => used.material_id === m.id))
                      .map((material) => (
                        <SelectItem key={material.id} value={material.id.toString()}>
                          {material.name} (Available: {material.current_stock} {material.unit})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                {formData.materials_used.length > 0 && (
                  <div className="border rounded-md p-3 space-y-2">
                    {formData.materials_used.map((material) => (
                      <div key={material.material_id} className="flex items-center gap-2">
                        <span className="flex-1 text-sm">{material.material_name}</span>
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          value={material.quantity}
                          onChange={(e) =>
                            handleMaterialQuantityChange(material.material_id, Number.parseFloat(e.target.value) || 0)
                          }
                          className="w-20"
                        />
                        <span className="text-sm text-gray-500">{material.unit}</span>
                        <Button variant="outline" size="sm" onClick={() => handleMaterialRemove(material.material_id)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                placeholder="Additional notes or observations"
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                rows={3}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{selectedLog?.title}" and all its data. This action cannot be undone.
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
