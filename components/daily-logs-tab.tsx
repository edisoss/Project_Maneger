"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Calendar, Clock, User, Package, Edit, Camera, X, Eye } from "lucide-react"

// Mock data for workers (in real app, this would come from your database)
const availableWorkers = [
  { id: 1, name: "John Smith", specialty: "Security Systems" },
  { id: 2, name: "Maria Garcia", specialty: "Network Cabling" },
  { id: 3, name: "David Johnson", specialty: "BMS" },
  { id: 4, name: "Sarah Wilson", specialty: "Security Systems" },
  { id: 5, name: "Mike Brown", specialty: "General" },
  { id: 6, name: "Lisa Chen", specialty: "Network Cabling" },
]

interface DailyLogsTabProps {
  materials: Array<{
    id: number
    name: string
    category: string
    currentStock: number
    minStock: number
    unit: string
    location: string
    lastUpdated: string
    status: string
  }>
  setMaterials: React.Dispatch<
    React.SetStateAction<
      Array<{
        id: number
        name: string
        category: string
        currentStock: number
        minStock: number
        unit: string
        location: string
        lastUpdated: string
        status: string
      }>
    >
  >
}

export default function DailyLogsTab({ materials, setMaterials }: DailyLogsTabProps) {
  const [logs, setLogs] = useState([
    {
      id: 1,
      date: "2024-01-20",
      project: "Office Building Security System",
      workers: [
        { id: 1, name: "John Smith", hoursWorked: 8 },
        { id: 4, name: "Sarah Wilson", hoursWorked: 7.5 },
      ],
      tasksCompleted: "Installed 12 CCTV cameras on floors 10-12, configured network connections",
      materialsUsed: [
        { id: 2, name: "Security Cameras (IP)", quantity: 12, unit: "pieces" },
        { id: 1, name: "Cat6 Network Cable", quantity: 200, unit: "meters" },
        { id: 4, name: "RJ45 Connectors", quantity: 24, unit: "pieces" },
      ],
      notes: "All cameras tested and working properly. Need additional mounting brackets for next phase.",
      status: "Completed",
      photos: [
        { id: 1, url: "/placeholder.svg?height=200&width=300", caption: "Cameras installed on floor 10" },
        { id: 2, url: "/placeholder.svg?height=200&width=300", caption: "Network configuration complete" },
      ],
    },
    {
      id: 2,
      date: "2024-01-20",
      project: "Hospital BMS Installation",
      workers: [
        { id: 2, name: "Maria Garcia", hoursWorked: 7.5 },
        { id: 3, name: "David Johnson", hoursWorked: 8 },
      ],
      tasksCompleted: "Wired control panels for HVAC zones 1-3, tested communication protocols",
      materialsUsed: [
        { id: 3, name: "BMS Control Panels", quantity: 3, unit: "pieces" },
        { id: 1, name: "Cat6 Network Cable", quantity: 150, unit: "meters" },
        { id: 5, name: "Temperature Sensors", quantity: 6, unit: "pieces" },
      ],
      notes: "Zone 2 panel needs firmware update. Scheduled for tomorrow.",
      status: "In Progress",
      photos: [{ id: 3, url: "/placeholder.svg?height=200&width=300", caption: "Control panel installation" }],
    },
  ])

  const [isAddingLog, setIsAddingLog] = useState(false)
  const [newLog, setNewLog] = useState({
    date: new Date().toISOString().split("T")[0],
    project: "",
    workers: [] as Array<{ id: number; name: string; hoursWorked: number }>,
    tasksCompleted: "",
    materialsUsed: [] as Array<{ id: number; name: string; quantity: number; unit: string }>,
    notes: "",
    photos: [] as Array<{ id: number; url: string; caption: string }>,
  })

  const [selectedWorkers, setSelectedWorkers] = useState<number[]>([])
  const [workerHours, setWorkerHours] = useState<Record<number, number>>({})
  const [selectedMaterials, setSelectedMaterials] = useState<number[]>([])
  const [materialQuantities, setMaterialQuantities] = useState<Record<number, number>>({})
  const [uploadedPhotos, setUploadedPhotos] = useState<Array<{ file: File; preview: string; caption: string }>>([])
  const [isUploading, setIsUploading] = useState(false)

  const [isEditingLog, setIsEditingLog] = useState(false)
  const [editingLog, setEditingLog] = useState<(typeof logs)[0] | null>(null)
  const [editSelectedWorkers, setEditSelectedWorkers] = useState<number[]>([])
  const [editWorkerHours, setEditWorkerHours] = useState<Record<number, number>>({})
  const [editSelectedMaterials, setEditSelectedMaterials] = useState<number[]>([])
  const [editMaterialQuantities, setEditMaterialQuantities] = useState<Record<number, number>>({})
  const [editUploadedPhotos, setEditUploadedPhotos] = useState<Array<{ file: File; preview: string; caption: string }>>(
    [],
  )

  const [viewingPhotos, setViewingPhotos] = useState<Array<{ id: number; url: string; caption: string }>>([])
  const [isViewingPhotos, setIsViewingPhotos] = useState(false)

  const projects = ["Office Building Security System", "Hospital BMS Installation", "School Network Cabling"]

  const updateMaterialStock = (materialId: number, quantityChange: number) => {
    setMaterials((prev) =>
      prev.map((material) => {
        if (material.id === materialId) {
          const newStock = Math.max(0, material.currentStock + quantityChange)
          const newStatus =
            newStock <= 0
              ? "Out of Stock"
              : newStock <= material.minStock * 0.5
                ? "Critical"
                : newStock <= material.minStock
                  ? "Low Stock"
                  : "In Stock"

          return {
            ...material,
            currentStock: newStock,
            status: newStatus,
            lastUpdated: new Date().toISOString().split("T")[0],
          }
        }
        return material
      }),
    )
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const newPhotos = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      caption: "",
    }))

    setUploadedPhotos([...uploadedPhotos, ...newPhotos])
  }

  const handleEditPhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const newPhotos = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      caption: "",
    }))

    setEditUploadedPhotos([...editUploadedPhotos, ...newPhotos])
  }

  const removePhoto = (index: number) => {
    const newPhotos = [...uploadedPhotos]
    URL.revokeObjectURL(newPhotos[index].preview)
    newPhotos.splice(index, 1)
    setUploadedPhotos(newPhotos)
  }

  const removeEditPhoto = (index: number) => {
    const newPhotos = [...editUploadedPhotos]
    URL.revokeObjectURL(newPhotos[index].preview)
    newPhotos.splice(index, 1)
    setEditUploadedPhotos(newPhotos)
  }

  const updatePhotoCaption = (index: number, caption: string) => {
    const newPhotos = [...uploadedPhotos]
    newPhotos[index].caption = caption
    setUploadedPhotos(newPhotos)
  }

  const updateEditPhotoCaption = (index: number, caption: string) => {
    const newPhotos = [...editUploadedPhotos]
    newPhotos[index].caption = caption
    setEditUploadedPhotos(newPhotos)
  }

  const uploadPhotosToBlob = async (photos: Array<{ file: File; caption: string }>) => {
    const uploadedPhotos = []

    for (const photo of photos) {
      try {
        // In preview mode, use placeholder URLs instead of actual upload
        if (typeof window !== "undefined" && window.location.hostname.includes("vusercontent.net")) {
          uploadedPhotos.push({
            id: Date.now() + Math.random(),
            url: `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(photo.file.name)}`,
            caption: photo.caption,
          })
          continue
        }

        const formData = new FormData()
        formData.append("file", photo.file)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (response.ok) {
          const { url } = await response.json()
          uploadedPhotos.push({
            id: Date.now() + Math.random(),
            url,
            caption: photo.caption,
          })
        } else {
          // Fallback to placeholder if upload fails
          uploadedPhotos.push({
            id: Date.now() + Math.random(),
            url: `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(photo.file.name)}`,
            caption: photo.caption,
          })
        }
      } catch (error) {
        console.error("Failed to upload photo:", error)
        // Fallback to placeholder on error
        uploadedPhotos.push({
          id: Date.now() + Math.random(),
          url: `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(photo.file.name)}`,
          caption: photo.caption,
        })
      }
    }

    return uploadedPhotos
  }

  const handleWorkerSelection = (workerId: number, checked: boolean) => {
    if (checked) {
      setSelectedWorkers([...selectedWorkers, workerId])
      setWorkerHours({ ...workerHours, [workerId]: 8 }) // Default 8 hours
    } else {
      setSelectedWorkers(selectedWorkers.filter((id) => id !== workerId))
      const newHours = { ...workerHours }
      delete newHours[workerId]
      setWorkerHours(newHours)
    }
  }

  const handleMaterialSelection = (materialId: number, checked: boolean) => {
    if (checked) {
      setSelectedMaterials([...selectedMaterials, materialId])
      setMaterialQuantities({ ...materialQuantities, [materialId]: 1 }) // Default 1 unit
    } else {
      setSelectedMaterials(selectedMaterials.filter((id) => id !== materialId))
      const newQuantities = { ...materialQuantities }
      delete newQuantities[materialId]
      setMaterialQuantities(newQuantities)
    }
  }

  const handleAddLog = async () => {
    try {
      setIsUploading(true)

      // Validate required fields
      if (!newLog.project || selectedWorkers.length === 0 || !newLog.tasksCompleted) {
        alert("Please fill in all required fields: project, workers, and tasks completed.")
        setIsUploading(false)
        return
      }

      const workersData = selectedWorkers.map((workerId) => {
        const worker = availableWorkers.find((w) => w.id === workerId)!
        return {
          id: workerId,
          name: worker.name,
          hoursWorked: workerHours[workerId] || 0,
        }
      })

      const materialsData = selectedMaterials.map((materialId) => {
        const material = materials.find((m) => m.id === materialId)!
        return {
          id: materialId,
          name: material.name,
          quantity: materialQuantities[materialId] || 0,
          unit: material.unit,
        }
      })

      // Upload photos to Vercel Blob (with fallback for preview mode)
      const photosData = await uploadPhotosToBlob(uploadedPhotos)

      // Update material stock by deducting used quantities
      selectedMaterials.forEach((materialId) => {
        const usedQuantity = materialQuantities[materialId] || 0
        if (usedQuantity > 0) {
          updateMaterialStock(materialId, -usedQuantity)
        }
      })

      const log = {
        id: logs.length + 1,
        date: newLog.date,
        project: newLog.project,
        workers: workersData,
        tasksCompleted: newLog.tasksCompleted,
        materialsUsed: materialsData,
        notes: newLog.notes,
        photos: photosData,
        status: "Completed" as const,
      }

      setLogs([log, ...logs])

      // Reset form completely
      setNewLog({
        date: new Date().toISOString().split("T")[0],
        project: "",
        workers: [],
        tasksCompleted: "",
        materialsUsed: [],
        notes: "",
        photos: [],
      })
      setSelectedWorkers([])
      setWorkerHours({})
      setSelectedMaterials([])
      setMaterialQuantities({})

      // Clean up photo previews
      uploadedPhotos.forEach((photo) => URL.revokeObjectURL(photo.preview))
      setUploadedPhotos([])

      setIsAddingLog(false)

      console.log("Log saved successfully:", log)
    } catch (error) {
      console.error("Error adding log:", error)
      alert("Failed to save log. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleEditLog = (log: (typeof logs)[0]) => {
    setEditingLog(log)

    // Set up workers
    const workerIds = log.workers.map((w) => w.id)
    const workerHoursMap = log.workers.reduce((acc, w) => ({ ...acc, [w.id]: w.hoursWorked }), {})
    setEditSelectedWorkers(workerIds)
    setEditWorkerHours(workerHoursMap)

    // Set up materials
    const materialIds = log.materialsUsed.map((m) => m.id)
    const materialQuantitiesMap = log.materialsUsed.reduce((acc, m) => ({ ...acc, [m.id]: m.quantity }), {})
    setEditSelectedMaterials(materialIds)
    setEditMaterialQuantities(materialQuantitiesMap)

    setIsEditingLog(true)
  }

  const handleEditWorkerSelection = (workerId: number, checked: boolean) => {
    if (checked) {
      setEditSelectedWorkers([...editSelectedWorkers, workerId])
      setEditWorkerHours({ ...editWorkerHours, [workerId]: 8 })
    } else {
      setEditSelectedWorkers(editSelectedWorkers.filter((id) => id !== workerId))
      const newHours = { ...editWorkerHours }
      delete newHours[workerId]
      setEditWorkerHours(newHours)
    }
  }

  const handleEditMaterialSelection = (materialId: number, checked: boolean) => {
    if (checked) {
      setEditSelectedMaterials([...editSelectedMaterials, materialId])
      setEditMaterialQuantities({ ...editMaterialQuantities, [materialId]: 1 })
    } else {
      setEditSelectedMaterials(editSelectedMaterials.filter((id) => id !== materialId))
      const newQuantities = { ...editMaterialQuantities }
      delete newQuantities[materialId]
      setEditMaterialQuantities(newQuantities)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingLog) return

    try {
      setIsUploading(true)

      // First, restore the original quantities back to stock
      editingLog.materialsUsed.forEach((material) => {
        updateMaterialStock(material.id, material.quantity)
      })

      const workersData = editSelectedWorkers.map((workerId) => {
        const worker = availableWorkers.find((w) => w.id === workerId)!
        return {
          id: workerId,
          name: worker.name,
          hoursWorked: editWorkerHours[workerId] || 0,
        }
      })

      const materialsData = editSelectedMaterials.map((materialId) => {
        const material = materials.find((m) => m.id === materialId)!
        return {
          id: materialId,
          name: material.name,
          quantity: editMaterialQuantities[materialId] || 0,
          unit: material.unit,
        }
      })

      // Upload new photos to Vercel Blob (with fallback for preview mode)
      const newPhotosData = await uploadPhotosToBlob(editUploadedPhotos)
      const allPhotos = [...editingLog.photos, ...newPhotosData]

      // Now deduct the new quantities from stock
      editSelectedMaterials.forEach((materialId) => {
        const usedQuantity = editMaterialQuantities[materialId] || 0
        updateMaterialStock(materialId, -usedQuantity)
      })

      const updatedLogs = logs.map((log) =>
        log.id === editingLog.id
          ? {
              ...editingLog,
              workers: workersData,
              materialsUsed: materialsData,
              photos: allPhotos,
            }
          : log,
      )

      setLogs(updatedLogs)

      // Clean up photo previews
      editUploadedPhotos.forEach((photo) => URL.revokeObjectURL(photo.preview))
      setEditUploadedPhotos([])

      setIsEditingLog(false)
      setEditingLog(null)
      setEditSelectedWorkers([])
      setEditWorkerHours({})
      setEditSelectedMaterials([])
      setEditMaterialQuantities({})
    } catch (error) {
      console.error("Error saving edit:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleViewPhotos = (photos: Array<{ id: number; url: string; caption: string }>) => {
    setViewingPhotos(photos)
    setIsViewingPhotos(true)
  }

  const getTotalHours = (workers: Array<{ hoursWorked: number }>) => {
    return workers.reduce((total, worker) => total + worker.hoursWorked, 0)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Daily Work Logs</h2>
          <p className="text-gray-600">Track daily work progress, material usage, and photo documentation</p>
        </div>
        <Dialog open={isAddingLog} onOpenChange={setIsAddingLog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Log Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Daily Work Log</DialogTitle>
              <DialogDescription>
                Record daily work activities, workers, hours, materials used, and photos.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="log-date">Date</Label>
                  <Input
                    id="log-date"
                    type="date"
                    value={newLog.date}
                    onChange={(e) => setNewLog({ ...newLog, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="log-project">Project</Label>
                  <Select value={newLog.project} onValueChange={(value) => setNewLog({ ...newLog, project: value })}>
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
              </div>

              {/* Workers Selection */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Workers & Hours</Label>
                <div className="border rounded-lg p-4 space-y-3 max-h-60 overflow-y-auto">
                  {availableWorkers.map((worker) => (
                    <div key={worker.id} className="flex items-center justify-between space-x-3">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id={`worker-${worker.id}`}
                          checked={selectedWorkers.includes(worker.id)}
                          onCheckedChange={(checked) => handleWorkerSelection(worker.id, checked as boolean)}
                        />
                        <div>
                          <Label htmlFor={`worker-${worker.id}`} className="font-medium">
                            {worker.name}
                          </Label>
                          <p className="text-xs text-gray-500">{worker.specialty}</p>
                        </div>
                      </div>
                      {selectedWorkers.includes(worker.id) && (
                        <div className="flex items-center space-x-2">
                          <Label htmlFor={`hours-${worker.id}`} className="text-sm">
                            Hours:
                          </Label>
                          <Input
                            id={`hours-${worker.id}`}
                            type="number"
                            step="0.5"
                            min="0"
                            max="24"
                            value={workerHours[worker.id] || 8}
                            onChange={(e) =>
                              setWorkerHours({ ...workerHours, [worker.id]: Number.parseFloat(e.target.value) })
                            }
                            className="w-20"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {selectedWorkers.length > 0 && (
                  <div className="text-sm text-gray-600">
                    Selected: {selectedWorkers.length} workers, Total hours:{" "}
                    {Object.values(workerHours).reduce((sum, hours) => sum + hours, 0)}
                  </div>
                )}
              </div>

              {/* Materials Selection */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Materials Used</Label>
                <div className="border rounded-lg p-4 space-y-3 max-h-60 overflow-y-auto">
                  {materials.map((material) => (
                    <div key={material.id} className="flex items-center justify-between space-x-3">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id={`material-${material.id}`}
                          checked={selectedMaterials.includes(material.id)}
                          onCheckedChange={(checked) => handleMaterialSelection(material.id, checked as boolean)}
                          disabled={material.currentStock === 0}
                        />
                        <div>
                          <Label htmlFor={`material-${material.id}`} className="font-medium">
                            {material.name}
                          </Label>
                          <p className={`text-xs ${material.currentStock === 0 ? "text-red-500" : "text-gray-500"}`}>
                            Stock: {material.currentStock} {material.unit}
                            {material.currentStock === 0 && " (Out of Stock)"}
                          </p>
                        </div>
                      </div>
                      {selectedMaterials.includes(material.id) && (
                        <div className="flex items-center space-x-2">
                          <Label htmlFor={`quantity-${material.id}`} className="text-sm">
                            Qty:
                          </Label>
                          <Input
                            id={`quantity-${material.id}`}
                            type="number"
                            min="0"
                            max={material.currentStock}
                            value={materialQuantities[material.id] || 1}
                            onChange={(e) =>
                              setMaterialQuantities({
                                ...materialQuantities,
                                [material.id]: Number.parseInt(e.target.value),
                              })
                            }
                            className="w-20"
                          />
                          <span className="text-xs text-gray-500">{material.unit}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {selectedMaterials.length > 0 && (
                  <div className="text-sm text-gray-600">Selected: {selectedMaterials.length} materials</div>
                )}
              </div>

              {/* Photo Upload */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Progress Photos</Label>
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                    />
                    <Label htmlFor="photo-upload" className="cursor-pointer">
                      <Button type="button" variant="outline" asChild>
                        <span>
                          <Camera className="h-4 w-4 mr-2" />
                          Add Photos
                        </span>
                      </Button>
                    </Label>
                    <span className="text-sm text-gray-500">Upload progress photos (JPG, PNG)</span>
                  </div>

                  {uploadedPhotos.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {uploadedPhotos.map((photo, index) => (
                        <div key={index} className="relative border rounded-lg p-2">
                          <img
                            src={photo.preview || "/placeholder.svg"}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-32 object-cover rounded"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 h-6 w-6 p-0"
                            onClick={() => removePhoto(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          <Input
                            placeholder="Add caption..."
                            value={photo.caption}
                            onChange={(e) => updatePhotoCaption(index, e.target.value)}
                            className="mt-2 text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Tasks and Notes */}
              <div className="space-y-2">
                <Label htmlFor="log-tasks">Tasks Completed</Label>
                <Textarea
                  id="log-tasks"
                  value={newLog.tasksCompleted}
                  onChange={(e) => setNewLog({ ...newLog, tasksCompleted: e.target.value })}
                  placeholder="Describe what was accomplished today..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="log-notes">Additional Notes</Label>
                <Textarea
                  id="log-notes"
                  value={newLog.notes}
                  onChange={(e) => setNewLog({ ...newLog, notes: e.target.value })}
                  placeholder="Any additional observations, issues, or next steps..."
                  rows={2}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddingLog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddLog}
                disabled={!newLog.project || selectedWorkers.length === 0 || !newLog.tasksCompleted || isUploading}
              >
                {isUploading ? "Saving..." : "Save Log Entry"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Photo Viewer Dialog */}
        <Dialog open={isViewingPhotos} onOpenChange={setIsViewingPhotos}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Progress Photos</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {viewingPhotos.map((photo) => (
                <div key={photo.id} className="space-y-2">
                  <img
                    src={photo.url || "/placeholder.svg"}
                    alt={photo.caption}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  {photo.caption && <p className="text-sm text-gray-600 text-center">{photo.caption}</p>}
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {logs.map((log) => (
          <Card key={log.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="h-4 w-4" />
                    {log.date}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {log.workers.length} workers
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {getTotalHours(log.workers)}h total
                    </span>
                    <span className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {log.materialsUsed.length} materials
                    </span>
                    {log.photos && log.photos.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Camera className="h-3 w-3" />
                        {log.photos.length} photos
                      </span>
                    )}
                  </CardDescription>
                </div>
                <Badge variant={log.status === "Completed" ? "default" : "secondary"}>{log.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-1">Project</h4>
                <p className="text-sm">{log.project}</p>
              </div>

              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2">Workers & Hours</h4>
                <div className="flex flex-wrap gap-2">
                  {log.workers.map((worker) => (
                    <Badge key={worker.id} variant="outline" className="text-xs">
                      {worker.name}: {worker.hoursWorked}h
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-1">Tasks Completed</h4>
                <p className="text-sm">{log.tasksCompleted}</p>
              </div>

              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2">Materials Used</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {log.materialsUsed.map((material) => (
                    <div key={material.id} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                      <span>{material.name}</span>
                      <span className="font-medium">
                        {material.quantity} {material.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {log.photos && log.photos.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Progress Photos</h4>
                  <div className="flex gap-2 overflow-x-auto">
                    {log.photos.slice(0, 3).map((photo) => (
                      <img
                        key={photo.id}
                        src={photo.url || "/placeholder.svg"}
                        alt={photo.caption}
                        className="w-20 h-20 object-cover rounded cursor-pointer hover:opacity-80"
                        onClick={() => handleViewPhotos(log.photos)}
                      />
                    ))}
                    {log.photos.length > 3 && (
                      <div
                        className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center cursor-pointer hover:bg-gray-200"
                        onClick={() => handleViewPhotos(log.photos)}
                      >
                        <span className="text-xs text-gray-600">+{log.photos.length - 3}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {log.notes && (
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-1">Notes</h4>
                  <p className="text-sm text-gray-600">{log.notes}</p>
                </div>
              )}

              <div className="flex justify-end mt-4 space-x-2">
                {log.photos && log.photos.length > 0 && (
                  <Button variant="outline" size="sm" onClick={() => handleViewPhotos(log.photos)}>
                    <Eye className="h-4 w-4 mr-1" />
                    View Photos
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => handleEditLog(log)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit Log
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
