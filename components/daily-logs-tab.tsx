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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Eye, Edit, Trash2, Calendar, Clock, Users, Package } from "lucide-react"
import { addDailyLog, updateDailyLog, deleteDailyLog, updateMaterial } from "@/lib/database"
import type { Material, DailyLog, Worker } from "@/lib/database"

interface DailyLogsTabProps {
  materials: Material[]
  setMaterials: (materials: Material[]) => void
  dailyLogs: DailyLog[]
  setDailyLogs: (logs: DailyLog[]) => void
  workers: Worker[]
}

export default function DailyLogsTab({ materials, setMaterials, dailyLogs, setDailyLogs, workers }: DailyLogsTabProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedLog, setSelectedLog] = useState<DailyLog | null>(null)
  const [editingLog, setEditingLog] = useState<DailyLog | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    project: "",
    work_description: "",
    hours_worked: 8,
    notes: "",
    weather: "",
  })

  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([])
  const [selectedMaterials, setSelectedMaterials] = useState<
    Array<{
      material_id: number
      material_name: string
      quantity: number
      unit: string
    }>
  >([])

  const projects = [
    "Office Building Security System",
    "Hospital BMS Installation",
    "School Network Cabling",
    "Warehouse HVAC System",
    "Hotel Fire Safety System",
  ]

  const weatherOptions = ["Clear", "Partly Cloudy", "Cloudy", "Light Rain", "Heavy Rain", "Snow"]

  const handleWorkerToggle = (workerName: string) => {
    setSelectedWorkers((prev) =>
      prev.includes(workerName) ? prev.filter((w) => w !== workerName) : [...prev, workerName],
    )
  }

  const handleMaterialAdd = (materialId: number) => {
    const material = materials.find((m) => m.id === materialId)
    if (!material) return

    const existing = selectedMaterials.find((m) => m.material_id === materialId)
    if (existing) return

    setSelectedMaterials((prev) => [
      ...prev,
      {
        material_id: material.id,
        material_name: material.name,
        quantity: 1,
        unit: material.unit,
      },
    ])
  }

  const handleMaterialQuantityChange = (materialId: number, quantity: number) => {
    setSelectedMaterials((prev) =>
      prev.map((m) => (m.material_id === materialId ? { ...m, quantity: Math.max(0, quantity) } : m)),
    )
  }

  const handleMaterialRemove = (materialId: number) => {
    setSelectedMaterials((prev) => prev.filter((m) => m.material_id !== materialId))
  }

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      project: "",
      work_description: "",
      hours_worked: 8,
      notes: "",
      weather: "",
    })
    setSelectedWorkers([])
    setSelectedMaterials([])
  }

  const handleSubmit = async () => {
    try {
      setSaving(true)

      // Validate required fields
      if (!formData.project || !formData.work_description || selectedWorkers.length === 0) {
        alert("Please fill in all required fields")
        return
      }

      const newLogData = {
        date: formData.date,
        project: formData.project,
        work_description: formData.work_description,
        workers_present: selectedWorkers,
        hours_worked: formData.hours_worked,
        materials_used: selectedMaterials,
        notes: formData.notes,
        weather: formData.weather,
        status: "Completed",
        created_by: "manager@company.com",
      }

      // Add the daily log to database
      const newLog = await addDailyLog(newLogData)
      if (!newLog) {
        alert("Failed to save daily log. Please try again.")
        return
      }

      // Update materials stock in database and local state
      const materialUpdates = []
      for (const usedMaterial of selectedMaterials) {
        const material = materials.find((m) => m.id === usedMaterial.material_id)
        if (material) {
          const newStock = Math.max(0, material.current_stock - usedMaterial.quantity)
          const updatedMaterial = await updateMaterial(material.id, {
            current_stock: newStock,
            status: newStock <= material.min_stock ? "Low Stock" : newStock === 0 ? "Out of Stock" : "In Stock",
            last_updated: new Date().toISOString().split("T")[0],
          })
          if (updatedMaterial) {
            materialUpdates.push(updatedMaterial)
          }
        }
      }

      // Update local state
      setMaterials((prev) =>
        prev.map((material) => {
          const updated = materialUpdates.find((u) => u.id === material.id)
          return updated || material
        }),
      )

      setDailyLogs((prev) => [newLog, ...prev])
      setShowAddDialog(false)
      resetForm()

      console.log("Daily log saved successfully:", newLog)
    } catch (error) {
      console.error("Error saving daily log:", error)
      alert("Error saving daily log. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (log: DailyLog) => {
    setEditingLog(log)
    setFormData({
      date: log.date,
      project: log.project,
      work_description: log.work_description,
      hours_worked: log.hours_worked,
      notes: log.notes,
      weather: log.weather,
    })
    setSelectedWorkers(log.workers_present)
    setSelectedMaterials(log.materials_used)
    setShowEditDialog(true)
  }

  const handleEditSubmit = async () => {
    if (!editingLog) return

    try {
      setSaving(true)

      // Validate required fields
      if (!formData.project || !formData.work_description || selectedWorkers.length === 0) {
        alert("Please fill in all required fields")
        return
      }

      const updatedLogData = {
        date: formData.date,
        project: formData.project,
        work_description: formData.work_description,
        workers_present: selectedWorkers,
        hours_worked: formData.hours_worked,
        materials_used: selectedMaterials,
        notes: formData.notes,
        weather: formData.weather,
      }

      // Update the daily log in database
      const updatedLog = await updateDailyLog(editingLog.id, updatedLogData)
      if (!updatedLog) {
        alert("Failed to update daily log. Please try again.")
        return
      }

      // Calculate material differences and update stock
      const oldMaterials = editingLog.materials_used
      const newMaterials = selectedMaterials

      const materialUpdates = []
      for (const material of materials) {
        const oldUsage = oldMaterials.find((m) => m.material_id === material.id)?.quantity || 0
        const newUsage = newMaterials.find((m) => m.material_id === material.id)?.quantity || 0
        const difference = newUsage - oldUsage

        if (difference !== 0) {
          const newStock = Math.max(0, material.current_stock - difference)
          const updatedMaterial = await updateMaterial(material.id, {
            current_stock: newStock,
            status: newStock <= material.min_stock ? "Low Stock" : newStock === 0 ? "Out of Stock" : "In Stock",
            last_updated: new Date().toISOString().split("T")[0],
          })
          if (updatedMaterial) {
            materialUpdates.push(updatedMaterial)
          }
        }
      }

      // Update local state
      setMaterials((prev) =>
        prev.map((material) => {
          const updated = materialUpdates.find((u) => u.id === material.id)
          return updated || material
        }),
      )

      setDailyLogs((prev) => prev.map((log) => (log.id === editingLog.id ? updatedLog : log)))
      setShowEditDialog(false)
      setEditingLog(null)
      resetForm()

      console.log("Daily log updated successfully:", updatedLog)
    } catch (error) {
      console.error("Error updating daily log:", error)
      alert("Error updating daily log. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleView = (log: DailyLog) => {
    setSelectedLog(log)
    setShowViewDialog(true)
  }

  const handleDelete = async (logId: number) => {
    if (!confirm("Are you sure you want to delete this daily log?")) return

    try {
      const logToDelete = dailyLogs.find((log) => log.id === logId)
      if (!logToDelete) return

      // Delete from database
      const success = await deleteDailyLog(logId)
      if (!success) {
        alert("Failed to delete daily log. Please try again.")
        return
      }

      // Restore materials stock when deleting log
      const materialUpdates = []
      for (const usedMaterial of logToDelete.materials_used) {
        const material = materials.find((m) => m.id === usedMaterial.material_id)
        if (material) {
          const newStock = material.current_stock + usedMaterial.quantity
          const updatedMaterial = await updateMaterial(material.id, {
            current_stock: newStock,
            status: newStock <= material.min_stock ? "Low Stock" : "In Stock",
            last_updated: new Date().toISOString().split("T")[0],
          })
          if (updatedMaterial) {
            materialUpdates.push(updatedMaterial)
          }
        }
      }

      // Update local state
      setMaterials((prev) =>
        prev.map((material) => {
          const updated = materialUpdates.find((u) => u.id === material.id)
          return updated || material
        }),
      )

      setDailyLogs((prev) => prev.filter((log) => log.id !== logId))
    } catch (error) {
      console.error("Error deleting daily log:", error)
      alert("Error deleting daily log. Please try again.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Daily Work Logs</h2>
          <p className="text-gray-600">Track daily work progress, materials used, and worker attendance</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Daily Log
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Daily Work Log</DialogTitle>
              <DialogDescription>Record today's work progress and material usage</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
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
                    value={formData.project}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, project: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project} value={project}>
                          {project}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="workDescription">Work Description *</Label>
                  <Textarea
                    id="workDescription"
                    placeholder="Describe the work completed today..."
                    value={formData.work_description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, work_description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="hoursWorked">Hours Worked</Label>
                  <Input
                    id="hoursWorked"
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
                          {weather}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes or observations..."
                    value={formData.notes}
                    onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                    rows={2}
                  />
                </div>
              </div>

              {/* Workers and Materials */}
              <div className="space-y-4">
                {/* Workers Present */}
                <div>
                  <Label>Workers Present *</Label>
                  <div className="border rounded-lg p-3 max-h-40 overflow-y-auto">
                    {workers
                      .filter((w) => w.status === "Active")
                      .map((worker) => (
                        <div key={worker.id} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={`worker-${worker.id}`}
                            checked={selectedWorkers.includes(worker.name)}
                            onCheckedChange={() => handleWorkerToggle(worker.name)}
                          />
                          <Label htmlFor={`worker-${worker.id}`} className="text-sm">
                            {worker.name} - {worker.role}
                          </Label>
                        </div>
                      ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Selected: {selectedWorkers.length} workers</p>
                </div>

                {/* Materials Used */}
                <div>
                  <Label>Materials Used</Label>
                  <div className="space-y-2">
                    <Select onValueChange={(value) => handleMaterialAdd(Number.parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Add material" />
                      </SelectTrigger>
                      <SelectContent>
                        {materials
                          .filter((material) => !selectedMaterials.find((m) => m.material_id === material.id))
                          .map((material) => (
                            <SelectItem key={material.id} value={material.id.toString()}>
                              {material.name} (Stock: {material.current_stock} {material.unit})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>

                    {selectedMaterials.length > 0 && (
                      <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                        {selectedMaterials.map((material) => (
                          <div
                            key={material.material_id}
                            className="flex items-center justify-between bg-gray-50 p-2 rounded"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium">{material.material_name}</p>
                              <p className="text-xs text-gray-500">
                                Available: {materials.find((m) => m.id === material.material_id)?.current_stock}{" "}
                                {material.unit}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Input
                                type="number"
                                min="0"
                                max={materials.find((m) => m.id === material.material_id)?.current_stock || 0}
                                value={material.quantity}
                                onChange={(e) =>
                                  handleMaterialQuantityChange(
                                    material.material_id,
                                    Number.parseInt(e.target.value) || 0,
                                  )
                                }
                                className="w-20"
                              />
                              <span className="text-xs text-gray-500">{material.unit}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMaterialRemove(material.material_id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? "Saving..." : "Save Daily Log"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Daily Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Daily Logs ({dailyLogs.length})</CardTitle>
          <CardDescription>Overview of daily work activities and progress</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Workers</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Materials</TableHead>
                <TableHead>Weather</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dailyLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {log.date}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{log.project}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">{log.work_description}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-gray-400" />
                      {log.workers_present.length}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-400" />
                      {log.hours_worked}h
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Package className="h-4 w-4 mr-2 text-gray-400" />
                      {log.materials_used.length}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.weather}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">{log.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleView(log)}>
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(log)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(log.id)}>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Daily Log Details</DialogTitle>
            <DialogDescription>Complete information for this work day</DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Date</Label>
                  <p>{selectedLog.date}</p>
                </div>
                <div>
                  <Label className="font-medium">Project</Label>
                  <p>{selectedLog.project}</p>
                </div>
                <div>
                  <Label className="font-medium">Hours Worked</Label>
                  <p>{selectedLog.hours_worked} hours</p>
                </div>
                <div>
                  <Label className="font-medium">Weather</Label>
                  <p>{selectedLog.weather}</p>
                </div>
              </div>

              <div>
                <Label className="font-medium">Work Description</Label>
                <p className="mt-1">{selectedLog.work_description}</p>
              </div>

              <div>
                <Label className="font-medium">Workers Present ({selectedLog.workers_present.length})</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedLog.workers_present.map((worker) => (
                    <Badge key={worker} variant="secondary">
                      {worker}
                    </Badge>
                  ))}
                </div>
              </div>

              {selectedLog.materials_used.length > 0 && (
                <div>
                  <Label className="font-medium">Materials Used</Label>
                  <div className="mt-1 space-y-2">
                    {selectedLog.materials_used.map((material) => (
                      <div
                        key={material.material_id}
                        className="flex justify-between items-center bg-gray-50 p-2 rounded"
                      >
                        <span>{material.material_name}</span>
                        <span className="font-medium">
                          {material.quantity} {material.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedLog.notes && (
                <div>
                  <Label className="font-medium">Notes</Label>
                  <p className="mt-1">{selectedLog.notes}</p>
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
            <DialogTitle>Edit Daily Work Log</DialogTitle>
            <DialogDescription>Update work progress and material usage</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
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
                  value={formData.project}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, project: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project} value={project}>
                        {project}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-workDescription">Work Description *</Label>
                <Textarea
                  id="edit-workDescription"
                  placeholder="Describe the work completed today..."
                  value={formData.work_description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, work_description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="edit-hoursWorked">Hours Worked</Label>
                <Input
                  id="edit-hoursWorked"
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
                        {weather}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  placeholder="Additional notes or observations..."
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                />
              </div>
            </div>

            {/* Workers and Materials */}
            <div className="space-y-4">
              {/* Workers Present */}
              <div>
                <Label>Workers Present *</Label>
                <div className="border rounded-lg p-3 max-h-40 overflow-y-auto">
                  {workers
                    .filter((w) => w.status === "Active")
                    .map((worker) => (
                      <div key={worker.id} className="flex items-center space-x-2 py-1">
                        <Checkbox
                          id={`edit-worker-${worker.id}`}
                          checked={selectedWorkers.includes(worker.name)}
                          onCheckedChange={() => handleWorkerToggle(worker.name)}
                        />
                        <Label htmlFor={`edit-worker-${worker.id}`} className="text-sm">
                          {worker.name} - {worker.role}
                        </Label>
                      </div>
                    ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">Selected: {selectedWorkers.length} workers</p>
              </div>

              {/* Materials Used */}
              <div>
                <Label>Materials Used</Label>
                <div className="space-y-2">
                  <Select onValueChange={(value) => handleMaterialAdd(Number.parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Add material" />
                    </SelectTrigger>
                    <SelectContent>
                      {materials
                        .filter((material) => !selectedMaterials.find((m) => m.material_id === material.id))
                        .map((material) => (
                          <SelectItem key={material.id} value={material.id.toString()}>
                            {material.name} (Stock: {material.current_stock} {material.unit})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  {selectedMaterials.length > 0 && (
                    <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                      {selectedMaterials.map((material) => (
                        <div
                          key={material.material_id}
                          className="flex items-center justify-between bg-gray-50 p-2 rounded"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium">{material.material_name}</p>
                            <p className="text-xs text-gray-500">
                              Available: {materials.find((m) => m.id === material.material_id)?.current_stock}{" "}
                              {material.unit}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              min="0"
                              value={material.quantity}
                              onChange={(e) =>
                                handleMaterialQuantityChange(material.material_id, Number.parseInt(e.target.value) || 0)
                              }
                              className="w-20"
                            />
                            <span className="text-xs text-gray-500">{material.unit}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMaterialRemove(material.material_id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={saving}>
              {saving ? "Updating..." : "Update Daily Log"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
