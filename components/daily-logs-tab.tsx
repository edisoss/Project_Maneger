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
import { Plus, Edit, Trash2, FileText, Calendar, Users, Package, MapPin, Clock, Loader2, Eye } from "lucide-react"
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

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    project_id: "",
    workers_present: [] as string[],
    work_description: "",
    materials_used: [] as { material_id: string; quantity: number }[],
    equipment_used: "",
    weather_conditions: "",
    working_place: "",
    notes: "",
  })

  const weatherOptions = ["Sunny", "Cloudy", "Rainy", "Windy", "Stormy", "Foggy", "Hot", "Cold"]

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

      const logData = {
        ...formData,
        materials_used: JSON.stringify(formData.materials_used),
        workers_present: JSON.stringify(formData.workers_present),
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

      logActivity({
        type: "daily_log",
        title: "Daily Log Created",
        description: `New daily log created for ${new Date(formData.date).toLocaleDateString()}.`,
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
    setSelectedLog(log)
    setFormData({
      date: log.date,
      project_id: log.project_id,
      workers_present: Array.isArray(log.workers_present)
        ? log.workers_present
        : JSON.parse(log.workers_present || "[]"),
      work_description: log.work_description,
      materials_used: Array.isArray(log.materials_used) ? log.materials_used : JSON.parse(log.materials_used || "[]"),
      equipment_used: log.equipment_used || "",
      weather_conditions: log.weather_conditions || "Sunny",
      working_place: log.working_place || "",
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

      const logData = {
        ...formData,
        materials_used: JSON.stringify(formData.materials_used),
        workers_present: JSON.stringify(formData.workers_present),
      }

      const updatedLog = await updateDailyLog(selectedLog.id, logData)
      if (!updatedLog) {
        toast({ title: "Error", description: "Failed to update daily log.", variant: "destructive" })
        return
      }

      logActivity({
        type: "daily_log",
        title: "Daily Log Updated",
        description: `Daily log for ${new Date(formData.date).toLocaleDateString()} was updated.`,
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
    setFormData((prev) => ({
      ...prev,
      workers_present: checked
        ? [...prev.workers_present, workerId]
        : prev.workers_present.filter((id) => id !== workerId),
    }))
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

  const getWorkerName = (workerId: string) => {
    return workers.find((w) => w.id === workerId)?.name || "Unknown Worker"
  }

  const getMaterialName = (materialId: string) => {
    return materials.find((m) => m.id === materialId)?.name || "Unknown Material"
  }

  const getMaterialUnit = (materialId: string) => {
    return materials.find((m) => m.id === materialId)?.unit || "units"
  }

  // Calculate statistics
  const totalLogs = dailyLogs.length
  const thisWeekLogs = dailyLogs.filter((log) => {
    const logDate = new Date(log.date)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return logDate >= weekAgo
  }).length
  const thisMonthLogs = dailyLogs.filter((log) => {
    const logDate = new Date(log.date)
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    return logDate >= monthAgo
  }).length
  const activeProjects = new Set(dailyLogs.map((log) => log.project_id)).size

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

                <div className="grid grid-cols-2 gap-4">
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
                </div>

                <div>
                  <Label htmlFor="equipment_used">Equipment Used</Label>
                  <Textarea
                    id="equipment_used"
                    placeholder="List equipment and machinery used"
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
                        .map((worker) => (
                          <div key={worker.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`worker-${worker.id}`}
                              checked={formData.workers_present.includes(worker.id)}
                              onCheckedChange={(checked) => handleWorkerToggle(worker.id, checked as boolean)}
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLogs}</div>
            <p className="text-xs text-muted-foreground">All time</p>
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
            <p className="text-xs text-muted-foreground">With recent logs</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Work Logs</CardTitle>
          <CardDescription>
            {isAdmin ? "Track daily work progress and material usage" : "View daily work progress and material usage"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Work Description</TableHead>
                <TableHead>Workers</TableHead>
                <TableHead>Weather</TableHead>
                <TableHead>Materials Used</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dailyLogs
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((log) => {
                  const workersPresent = Array.isArray(log.workers_present)
                    ? log.workers_present
                    : JSON.parse(log.workers_present || "[]")
                  const materialsUsed = Array.isArray(log.materials_used)
                    ? log.materials_used
                    : JSON.parse(log.materials_used || "[]")

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
                        <div className="max-w-xs truncate">{log.work_description}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="text-sm">{workersPresent.length} workers</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{log.weather_conditions || "N/A"}</Badge>
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
          {dailyLogs.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {isAdmin
                  ? "No daily logs found. Add your first log to get started!"
                  : "No daily logs available to view."}
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
                <p className="text-sm text-gray-600 mt-1">{selectedLog.work_description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Working Place</Label>
                  <p className="text-sm text-gray-600">{selectedLog.working_place || "Not specified"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Weather Conditions</Label>
                  <div className="mt-1">
                    <Badge variant="secondary">{selectedLog.weather_conditions || "N/A"}</Badge>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Equipment Used</Label>
                <p className="text-sm text-gray-600 mt-1">{selectedLog.equipment_used || "No equipment specified"}</p>
              </div>

              <div>
                <Label className="text-sm font-medium">Workers Present</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(() => {
                    const workersPresent = Array.isArray(selectedLog.workers_present)
                      ? selectedLog.workers_present
                      : JSON.parse(selectedLog.workers_present || "[]")
                    return workersPresent.length > 0 ? (
                      workersPresent.map((workerId: string, index: number) => (
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

              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <div>
                <Label htmlFor="edit-equipment_used">Equipment Used</Label>
                <Textarea
                  id="edit-equipment_used"
                  placeholder="List equipment and machinery used"
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
                      .map((worker) => (
                        <div key={worker.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-worker-${worker.id}`}
                            checked={formData.workers_present.includes(worker.id)}
                            onCheckedChange={(checked) => handleWorkerToggle(worker.id, checked as boolean)}
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
