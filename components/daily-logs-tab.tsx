"use client"

import { DialogTrigger } from "@/components/ui/dialog"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  FileText,
  Calendar,
  Users,
  Package,
  CloudRain,
  Sun,
  Cloud,
  CloudSnow,
  Eye,
  Download,
  Loader2,
} from "lucide-react"
import { addDailyLog, updateDailyLog, deleteDailyLog } from "@/lib/database"
import type { DailyLog, Project, Worker, Material } from "@/lib/database"
import { useToast } from "@/hooks/use-toast"
import jsPDF from "jspdf"
import type { Activity } from "./recent-activities"

interface DailyLogsTabProps {
  dailyLogs: DailyLog[]
  setDailyLogs: (logs: DailyLog[]) => void
  projects: Project[]
  workers: Worker[]
  materials: Material[]
  setMaterials: (materials: Material[]) => void
  logActivity: (activity: Omit<Activity, "id" | "timestamp">) => void
}

export default function DailyLogsTab({
  dailyLogs = [],
  setDailyLogs = () => {},
  projects = [],
  workers = [],
  materials = [],
  setMaterials = () => {},
  logActivity,
}: DailyLogsTabProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedLog, setSelectedLog] = useState<DailyLog | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    title: "",
    date: new Date().toISOString().split("T")[0],
    project_id: 0,
    work_completed: "",
    hours_worked: 0,
    workers_present: [] as string[],
    materials_used: [] as Array<{
      material_id: number
      material_name: string
      quantity_used: number
      unit: string
    }>,
    notes: "",
    weather: "Sunny",
    status: "In Progress",
  })

  const weatherOptions = [
    { value: "Sunny", icon: Sun, color: "text-yellow-500" },
    { value: "Cloudy", icon: Cloud, color: "text-gray-500" },
    { value: "Rainy", icon: CloudRain, color: "text-blue-500" },
    { value: "Snowy", icon: CloudSnow, color: "text-blue-300" },
  ]

  const statusOptions = ["In Progress", "Completed", "On Hold", "Cancelled"]

  const resetForm = () => {
    setFormData({
      title: "",
      date: new Date().toISOString().split("T")[0],
      project_id: 0,
      work_completed: "",
      hours_worked: 0,
      workers_present: [],
      materials_used: [],
      notes: "",
      weather: "Sunny",
      status: "In Progress",
    })
  }

  const handleAddLog = async () => {
    try {
      setSaving(true)
      if (!formData.title || !formData.project_id || !formData.work_completed) {
        toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" })
        return
      }
      const logData = {
        title: formData.title,
        date: formData.date,
        project_id: formData.project_id,
        work_completed: formData.work_completed,
        hours_worked: formData.hours_worked || 0,
        workers_present: formData.workers_present,
        materials_used: formData.materials_used.map((m) => ({
          material_id: m.material_id,
          material_name: m.material_name,
          quantity: m.quantity_used,
          unit: m.unit,
        })),
        notes: formData.notes,
        weather: formData.weather,
        status: formData.status,
      }
      const newLog = await addDailyLog(logData)
      if (!newLog) {
        toast({ title: "Error", description: "Failed to add daily log.", variant: "destructive" })
        return
      }
      logActivity({
        type: "daily_log",
        title: "Log Added",
        description: `New daily log "${newLog.title}" was created.`,
        icon: Plus,
        variant: "default",
      })
      setDailyLogs([newLog, ...dailyLogs])
      if (formData.materials_used.length > 0) {
        const updatedMaterials = materials.map((m) => {
          const used = formData.materials_used.find((u) => u.material_id === m.id)
          return used ? { ...m, current_stock: Math.max(0, m.current_stock - used.quantity_used) } : m
        })
        setMaterials(updatedMaterials)
      }
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
      hours_worked: log.hours_worked || 0,
      workers_present: log.workers_present || [],
      materials_used:
        log.materials_used?.map((m) => ({
          material_id: m.material_id,
          material_name: m.material_name,
          quantity_used: m.quantity,
          unit: m.unit,
        })) || [],
      notes: log.notes,
      weather: log.weather,
      status: log.status,
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
      const updateData = {
        title: formData.title,
        date: formData.date,
        project_id: formData.project_id,
        work_completed: formData.work_completed,
        hours_worked: formData.hours_worked || 0,
        workers_present: formData.workers_present,
        materials_used: formData.materials_used.map((m) => ({
          material_id: m.material_id,
          material_name: m.material_name,
          quantity: m.quantity_used,
          unit: m.unit,
        })),
        notes: formData.notes,
        weather: formData.weather,
        status: formData.status,
      }
      const updatedLog = await updateDailyLog(selectedLog.id, updateData)
      if (!updatedLog) {
        toast({ title: "Error", description: "Failed to update daily log.", variant: "destructive" })
        return
      }
      logActivity({
        type: "daily_log",
        title: "Log Updated",
        description: `Daily log "${updatedLog.title}" was updated.`,
        icon: Edit,
        variant: "secondary",
      })
      setDailyLogs(dailyLogs.map((log) => (log.id === selectedLog.id ? updatedLog : log)))
      // Handle material stock updates
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

  const handleView = (log: DailyLog) => {
    setSelectedLog(log)
    setShowViewDialog(true)
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
        title: "Log Deleted",
        description: `Daily log "${selectedLog.title}" was deleted.`,
        icon: Trash2,
        variant: "destructive",
      })
      setDailyLogs(dailyLogs.filter((log) => log.id !== selectedLog.id))
      // Handle material stock restoration
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

  const addWorker = () => {
    setFormData((prev) => ({
      ...prev,
      workers_present: [...prev.workers_present, ""],
    }))
  }

  const updateWorker = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      workers_present: prev.workers_present.map((worker, i) => (i === index ? value : worker)),
    }))
  }

  const removeWorker = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      workers_present: prev.workers_present.filter((_, i) => i !== index),
    }))
  }

  const addMaterial = () => {
    setFormData((prev) => ({
      ...prev,
      materials_used: [
        ...prev.materials_used,
        {
          material_id: 0,
          material_name: "",
          quantity_used: 0,
          unit: "",
        },
      ],
    }))
  }

  const updateMaterial = (index: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      materials_used: prev.materials_used.map((material, i) =>
        i === index ? { ...material, [field]: value } : material,
      ),
    }))
  }

  const removeMaterial = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      materials_used: prev.materials_used.filter((_, i) => i !== index),
    }))
  }

  const handleMaterialSelect = (index: number, materialId: string) => {
    const selectedMaterial = materials.find((m) => m.id === Number.parseInt(materialId))
    if (selectedMaterial) {
      updateMaterial(index, "material_id", selectedMaterial.id)
      updateMaterial(index, "material_name", selectedMaterial.name)
      updateMaterial(index, "unit", selectedMaterial.unit)
    }
  }

  const generatePDF = (log: DailyLog, type: "detailed" | "summary" = "detailed") => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    let yPosition = 20

    // Header
    doc.setFontSize(20)
    doc.setFont("helvetica", "bold")
    doc.text("Daily Work Log", pageWidth / 2, yPosition, { align: "center" })
    yPosition += 15

    // Basic Info
    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    doc.text(`Title: ${log.title}`, 20, yPosition)
    yPosition += 8
    doc.text(`Date: ${new Date(log.date).toLocaleDateString()}`, 20, yPosition)
    yPosition += 8
    doc.text(`Project: ${log.project_name || "Unknown"}`, 20, yPosition)
    yPosition += 8
    doc.text(`Status: ${log.status}`, 20, yPosition)
    yPosition += 8
    doc.text(`Weather: ${log.weather}`, 20, yPosition)
    yPosition += 8
    if (log.hours_worked) {
      doc.text(`Hours Worked: ${log.hours_worked}`, 20, yPosition)
      yPosition += 8
    }
    yPosition += 5

    if (type === "detailed") {
      // Work Completed
      doc.setFont("helvetica", "bold")
      doc.text("Work Completed:", 20, yPosition)
      yPosition += 8
      doc.setFont("helvetica", "normal")
      const workLines = doc.splitTextToSize(log.work_completed || "", pageWidth - 40)
      doc.text(workLines, 20, yPosition)
      yPosition += workLines.length * 6 + 10

      // Workers Present
      if (log.workers_present && log.workers_present.length > 0) {
        doc.setFont("helvetica", "bold")
        doc.text("Workers Present:", 20, yPosition)
        yPosition += 8
        doc.setFont("helvetica", "normal")
        log.workers_present.forEach((worker) => {
          doc.text(`• ${worker}`, 25, yPosition)
          yPosition += 6
        })
        yPosition += 5
      }

      // Materials Used
      if (log.materials_used && log.materials_used.length > 0) {
        doc.setFont("helvetica", "bold")
        doc.text("Materials Used:", 20, yPosition)
        yPosition += 8
        doc.setFont("helvetica", "normal")
        log.materials_used.forEach((material) => {
          doc.text(`• ${material.material_name}: ${material.quantity} ${material.unit}`, 25, yPosition)
          yPosition += 6
        })
        yPosition += 5
      }

      // Notes
      if (log.notes) {
        doc.setFont("helvetica", "bold")
        doc.text("Notes:", 20, yPosition)
        yPosition += 8
        doc.setFont("helvetica", "normal")
        const notesLines = doc.splitTextToSize(log.notes, pageWidth - 40)
        doc.text(notesLines, 20, yPosition)
      }
    }

    // Save the PDF
    const fileName =
      type === "summary"
        ? `daily-logs-summary-${new Date().toISOString().split("T")[0]}.pdf`
        : `daily-log-${log.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}-${log.date}.pdf`

    doc.save(fileName)
  }

  const generateSummaryPDF = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    let yPosition = 20

    // Header
    doc.setFontSize(20)
    doc.setFont("helvetica", "bold")
    doc.text("Daily Logs Summary Report", pageWidth / 2, yPosition, { align: "center" })
    yPosition += 15

    // Summary stats
    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    doc.text(`Total Logs: ${dailyLogs.length}`, 20, yPosition)
    yPosition += 8
    doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, 20, yPosition)
    yPosition += 15

    // Logs table
    doc.setFont("helvetica", "bold")
    doc.text("Recent Daily Logs:", 20, yPosition)
    yPosition += 10

    doc.setFont("helvetica", "normal")
    dailyLogs.slice(0, 20).forEach((log, index) => {
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 20
      }

      doc.text(`${index + 1}. ${log.title}`, 20, yPosition)
      yPosition += 6
      doc.text(
        `   Date: ${new Date(log.date).toLocaleDateString()} | Project: ${log.project_name || "Unknown"} | Status: ${log.status}`,
        25,
        yPosition,
      )
      yPosition += 10
    })

    doc.save(`daily-logs-summary-${new Date().toISOString().split("T")[0]}.pdf`)
  }

  const getWeatherIcon = (weather: string) => {
    const option = weatherOptions.find((opt) => opt.value === weather)
    if (option) {
      const IconComponent = option.icon
      return <IconComponent className={`h-4 w-4 ${option.color}`} />
    }
    return <Sun className="h-4 w-4 text-yellow-500" />
  }

  // Calculate statistics
  const totalLogs = dailyLogs.length
  const completedLogs = dailyLogs.filter((log) => log.status === "Completed").length
  const inProgressLogs = dailyLogs.filter((log) => log.status === "In Progress").length
  const totalHours = dailyLogs.reduce((sum, log) => sum + (log.hours_worked || 0), 0)

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Daily Work Logs</h2>
          <p className="text-gray-600">Track daily construction activities and progress</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateSummaryPDF}>
            <Download className="h-4 w-4 mr-2" />
            Export Summary
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  console.log("Add Log button clicked")
                  resetForm()
                  setShowAddDialog(true)
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Log
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Daily Log</DialogTitle>
                <DialogDescription>Record daily work activities and progress</DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  <div>
                    <Label htmlFor="project">Project *</Label>
                    <Select
                      value={formData.project_id > 0 ? formData.project_id.toString() : ""}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, project_id: Number.parseInt(value) }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.length === 0 ? (
                          <SelectItem value="no-projects" disabled>
                            No projects available
                          </SelectItem>
                        ) : (
                          projects.map((project) => (
                            <SelectItem key={project.id} value={project.id.toString()}>
                              {project.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="hours_worked">Hours Worked</Label>
                    <Input
                      id="hours_worked"
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="0"
                      value={formData.hours_worked || ""}
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
                        {weatherOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <option.icon className={`h-4 w-4 ${option.color}`} />
                              {option.value}
                            </div>
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

                {/* Work Completed */}
                <div>
                  <Label htmlFor="work_completed">Work Completed *</Label>
                  <Textarea
                    id="work_completed"
                    placeholder="Describe the work completed today..."
                    value={formData.work_completed}
                    onChange={(e) => setFormData((prev) => ({ ...prev, work_completed: e.target.value }))}
                    rows={4}
                  />
                </div>

                {/* Workers Present */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label>Workers Present</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addWorker}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Worker
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {formData.workers_present.map((worker, index) => (
                      <div key={index} className="flex gap-2">
                        <Select value={worker} onValueChange={(value) => updateWorker(index, value)}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select worker" />
                          </SelectTrigger>
                          <SelectContent>
                            {workers.map((w) => (
                              <SelectItem key={w.id} value={w.name}>
                                {w.name} - {w.role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button type="button" variant="outline" size="sm" onClick={() => removeWorker(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Materials Used */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label>Materials Used</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addMaterial}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Material
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {formData.materials_used.map((material, index) => (
                      <div key={index} className="grid grid-cols-3 gap-2">
                        <Select
                          value={material.material_id.toString()}
                          onValueChange={(value) => handleMaterialSelect(index, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select material" />
                          </SelectTrigger>
                          <SelectContent>
                            {materials.map((m) => (
                              <SelectItem key={m.id} value={m.id.toString()}>
                                {m.name} ({m.unit})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          placeholder="Quantity"
                          value={material.quantity_used ?? 0}
                          onChange={(e) =>
                            updateMaterial(index, "quantity_used", Number.parseFloat(e.target.value) || 0)
                          }
                        />
                        <Button type="button" variant="outline" size="sm" onClick={() => removeMaterial(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any additional notes or observations..."
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
            <p className="text-xs text-muted-foreground">Daily work entries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Calendar className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedLogs}</div>
            <p className="text-xs text-muted-foreground">Finished tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inProgressLogs}</div>
            <p className="text-xs text-muted-foreground">Active work</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Package className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{totalHours}</div>
            <p className="text-xs text-muted-foreground">Hours logged</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Daily Logs</CardTitle>
          <CardDescription>Overview of daily work activities</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Project</TableHead>
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
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {log.work_completed?.substring(0, 50)}...
                    </div>
                  </TableCell>
                  <TableCell>{new Date(log.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.project_name || "Unknown"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        log.status === "Completed"
                          ? "default"
                          : log.status === "In Progress"
                            ? "secondary"
                            : log.status === "On Hold"
                              ? "outline"
                              : "destructive"
                      }
                    >
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getWeatherIcon(log.weather)}
                      <span className="text-sm">{log.weather}</span>
                    </div>
                  </TableCell>
                  <TableCell>{log.hours_worked || 0}h</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => generatePDF(log, "detailed")}>
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleView(log)}>
                        <Eye className="h-3 w-3" />
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
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Daily Log Details</DialogTitle>
            <DialogDescription>Complete information for {selectedLog?.title}</DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Title</Label>
                  <p>{selectedLog.title}</p>
                </div>
                <div>
                  <Label className="font-semibold">Date</Label>
                  <p>{new Date(selectedLog.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="font-semibold">Project</Label>
                  <p>{selectedLog.project_name || "Unknown"}</p>
                </div>
                <div>
                  <Label className="font-semibold">Status</Label>
                  <Badge
                    variant={
                      selectedLog.status === "Completed"
                        ? "default"
                        : selectedLog.status === "In Progress"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {selectedLog.status}
                  </Badge>
                </div>
                <div>
                  <Label className="font-semibold">Weather</Label>
                  <div className="flex items-center gap-2">
                    {getWeatherIcon(selectedLog.weather)}
                    <span>{selectedLog.weather}</span>
                  </div>
                </div>
                <div>
                  <Label className="font-semibold">Hours Worked</Label>
                  <p>{selectedLog.hours_worked || 0} hours</p>
                </div>
              </div>

              <div>
                <Label className="font-semibold">Work Completed</Label>
                <p className="mt-2 p-3 bg-gray-50 rounded-md">{selectedLog.work_completed}</p>
              </div>

              {selectedLog.workers_present && selectedLog.workers_present.length > 0 && (
                <div>
                  <Label className="font-semibold">Workers Present</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedLog.workers_present.map((worker, index) => (
                      <Badge key={index} variant="secondary">
                        {worker}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedLog.materials_used && selectedLog.materials_used.length > 0 && (
                <div>
                  <Label className="font-semibold">Materials Used</Label>
                  <div className="mt-2 space-y-2">
                    {selectedLog.materials_used.map((material, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span>{material.material_name}</span>
                        <Badge variant="outline">
                          {material.quantity} {material.unit}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedLog.notes && (
                <div>
                  <Label className="font-semibold">Notes</Label>
                  <p className="mt-2 p-3 bg-gray-50 rounded-md">{selectedLog.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Daily Log</DialogTitle>
            <DialogDescription>Update daily work activities and progress</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div>
                <Label htmlFor="edit-project">Project *</Label>
                <Select
                  value={formData.project_id > 0 ? formData.project_id.toString() : ""}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, project_id: Number.parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.length === 0 ? (
                      <SelectItem value="no-projects" disabled>
                        No projects available
                      </SelectItem>
                    ) : (
                      projects.map((project) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-hours_worked">Hours Worked</Label>
                <Input
                  id="edit-hours_worked"
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="0"
                  value={formData.hours_worked || ""}
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
                    {weatherOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <option.icon className={`h-4 w-4 ${option.color}`} />
                          {option.value}
                        </div>
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

            {/* Work Completed */}
            <div>
              <Label htmlFor="edit-work_completed">Work Completed *</Label>
              <Textarea
                id="edit-work_completed"
                placeholder="Describe the work completed today..."
                value={formData.work_completed}
                onChange={(e) => setFormData((prev) => ({ ...prev, work_completed: e.target.value }))}
                rows={4}
              />
            </div>

            {/* Workers Present */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Workers Present</Label>
                <Button type="button" variant="outline" size="sm" onClick={addWorker}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Worker
                </Button>
              </div>
              <div className="space-y-2">
                {formData.workers_present.map((worker, index) => (
                  <div key={index} className="flex gap-2">
                    <Select value={worker} onValueChange={(value) => updateWorker(index, value)}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select worker" />
                      </SelectTrigger>
                      <SelectContent>
                        {workers.map((w) => (
                          <SelectItem key={w.id} value={w.name}>
                            {w.name} - {w.role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" size="sm" onClick={() => removeWorker(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Materials Used */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Materials Used</Label>
                <Button type="button" variant="outline" size="sm" onClick={addMaterial}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Material
                </Button>
              </div>
              <div className="space-y-2">
                {formData.materials_used.map((material, index) => (
                  <div key={index} className="grid grid-cols-3 gap-2">
                    <Select
                      value={material.material_id.toString()}
                      onValueChange={(value) => handleMaterialSelect(index, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select material" />
                      </SelectTrigger>
                      <SelectContent>
                        {materials.map((m) => (
                          <SelectItem key={m.id} value={m.id.toString()}>
                            {m.name} ({m.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="Quantity"
                      value={material.quantity_used ?? 0}
                      onChange={(e) => updateMaterial(index, "quantity_used", Number.parseFloat(e.target.value) || 0)}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={() => removeMaterial(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="edit-notes">Additional Notes</Label>
              <Textarea
                id="edit-notes"
                placeholder="Any additional notes or observations..."
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
