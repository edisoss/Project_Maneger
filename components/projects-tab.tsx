"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
  Building2,
  Calendar,
  MapPin,
  TrendingUp,
  Loader2,
  Eye,
  MapIcon,
  List,
  FileText,
  Upload,
  Download,
  X,
  FileCheck,
} from "lucide-react"
import { addProject, updateProject, deleteProject, getDocuments, addDocument, deleteDocument } from "@/lib/database"
import type { Project, Document } from "@/lib/database"
import { useToast } from "@/hooks/use-toast"
import dynamic from "next/dynamic"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PhotoGallery from "@/components/photo-gallery"
import { getProjectPhotos, addProjectPhoto, deleteProjectPhoto } from "@/lib/database"
import QualityControlDocument from "@/components/quality-control-document"

// Dynamically import the map component to avoid SSR issues with Leaflet
const ProjectMap = dynamic(() => import("./project-map"), {
  ssr: false,
  loading: () => <div className="h-[400px] bg-gray-100 rounded-lg animate-pulse" />,
})

interface ProjectsTabProps {
  projects: Project[]
  setProjects: (projects: Project[]) => void
  logActivity?: (activity: any) => void
  isAdmin: boolean
}

export default function ProjectsTab({ projects = [], setProjects = () => {}, logActivity, isAdmin }: ProjectsTabProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [viewMode, setViewMode] = useState<"list" | "map">("list")
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [projectDocuments, setProjectDocuments] = useState<Document[]>([])
  const [projectPhotos, setProjectPhotos] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showQualityControlDoc, setShowQualityControlDoc] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "",
    location: "",
    latitude: 0,
    longitude: 0,
    status: "Planning",
    start_date: "",
    end_date: "",
    progress: 0,
  })

  const projectTypes = ["Residential", "Commercial", "Industrial", "Infrastructure", "Renovation"]
  const statusOptions = ["Planning", "Active", "On Hold", "Completed", "Cancelled"]

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: projectTypes[0],
      location: "",
      latitude: 0,
      longitude: 0,
      status: "Planning",
      start_date: "",
      end_date: "",
      progress: 0,
    })
  }

  const handleAddProject = async () => {
    if (!isAdmin) {
      toast({ title: "Access Denied", description: "Only administrators can add projects", variant: "destructive" })
      return
    }

    try {
      setSaving(true)
      if (!formData.name || !formData.location || !formData.start_date) {
        toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" })
        return
      }

      // Ensure lat/lng are numbers
      const projectData = {
        ...formData,
        latitude: Number(formData.latitude) || 0,
        longitude: Number(formData.longitude) || 0,
      }

      const newProject = await addProject(projectData)
      if (!newProject) {
        toast({ title: "Error", description: "Failed to add project.", variant: "destructive" })
        return
      }

      logActivity?.({
        type: "project",
        title: "Project Created",
        description: `New project "${newProject.name}" was created.`,
        icon: Plus,
        variant: "default",
      })

      setProjects([...projects, newProject])
      setShowAddDialog(false)
      resetForm()
      toast({ title: "Success", description: "Project added successfully!" })
    } catch (error) {
      console.error("Error adding project:", error)
      toast({ title: "Error", description: "Error adding project.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (project: Project) => {
    setSelectedProject(project)
    setFormData({
      name: project.name,
      description: project.description,
      type: project.type,
      location: project.location,
      latitude: project.latitude || 0,
      longitude: project.longitude || 0,
      status: project.status,
      start_date: project.start_date,
      end_date: project.end_date,
      progress: project.progress,
    })
    setShowEditDialog(true)
  }

  const loadProjectDocuments = async (projectId: string) => {
    const docs = await getDocuments(projectId)
    setProjectDocuments(docs)
  }

  const loadProjectPhotos = async (projectId: string) => {
    const photos = await getProjectPhotos(projectId)
    setProjectPhotos(photos)
  }

  const handleView = async (project: Project) => {
    setSelectedProject(project)
    setShowViewDialog(true)
    await loadProjectDocuments(project.id.toString())
    await loadProjectPhotos(project.id.toString())
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !selectedProject) return

    const file = e.target.files[0]
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Error", description: "File size must be less than 10MB", variant: "destructive" })
      return
    }

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Upload failed")

      const { url } = await response.json()

      const newDoc = await addDocument({
        project_id: selectedProject.id,
        name: file.name,
        url,
        type: file.type,
        size: file.size,
        uploaded_by: "admin@company.com", // In a real app, get current user
      })

      if (newDoc) {
        setProjectDocuments([newDoc, ...projectDocuments])
        toast({ title: "Success", description: "File uploaded successfully" })
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast({ title: "Error", description: "Failed to upload file", variant: "destructive" })
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteDocument = async (docId: string) => {
    try {
      const success = await deleteDocument(docId)
      if (success) {
        setProjectDocuments(projectDocuments.filter((d) => d.id !== docId))
        toast({ title: "Success", description: "File deleted successfully" })
      } else {
        throw new Error("Delete failed")
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete file", variant: "destructive" })
    }
  }

  const handleUpdateProject = async () => {
    if (!isAdmin) {
      toast({ title: "Access Denied", description: "Only administrators can edit projects", variant: "destructive" })
      return
    }

    if (!selectedProject) return
    try {
      setSaving(true)
      if (!formData.name || !formData.location || !formData.start_date) {
        toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" })
        return
      }

      // Ensure lat/lng are numbers
      const projectData = {
        ...formData,
        latitude: Number(formData.latitude) || 0,
        longitude: Number(formData.longitude) || 0,
      }

      const updatedProject = await updateProject(selectedProject.id, projectData)
      if (!updatedProject) {
        toast({ title: "Error", description: "Failed to update project.", variant: "destructive" })
        return
      }

      logActivity?.({
        type: "project",
        title: "Project Updated",
        description: `Project "${updatedProject.name}" was updated.`,
        icon: Edit,
        variant: "secondary",
      })

      setProjects(projects.map((p) => (p.id === selectedProject.id ? updatedProject : p)))
      setShowEditDialog(false)
      setSelectedProject(null)
      resetForm()
      toast({ title: "Success", description: "Project updated successfully!" })
    } catch (error) {
      console.error("Error updating project:", error)
      toast({ title: "Error", description: "Error updating project.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (project: Project) => {
    if (!isAdmin) {
      toast({ title: "Access Denied", description: "Only administrators can delete projects", variant: "destructive" })
      return
    }
    setSelectedProject(project)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!selectedProject) return
    try {
      setDeleting(true)
      const success = await deleteProject(selectedProject.id)
      if (!success) {
        toast({ title: "Error", description: "Failed to delete project.", variant: "destructive" })
        return
      }

      logActivity?.({
        type: "project",
        title: "Project Deleted",
        description: `Project "${selectedProject.name}" was deleted.`,
        icon: Trash2,
        variant: "destructive",
      })

      setProjects(projects.filter((p) => p.id !== selectedProject.id))
      setShowDeleteDialog(false)
      setSelectedProject(null)
      toast({ title: "Success", description: "Project deleted successfully!" })
    } catch (error) {
      console.error("Error deleting project:", error)
      toast({ title: "Error", description: "Error deleting project.", variant: "destructive" })
    } finally {
      setDeleting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge variant="default">{status}</Badge>
      case "Planning":
        return <Badge variant="secondary">{status}</Badge>
      case "On Hold":
        return <Badge variant="outline">{status}</Badge>
      case "Completed":
        return <Badge className="bg-green-100 text-green-800">{status}</Badge>
      case "Cancelled":
        return <Badge variant="destructive">{status}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Calculate statistics
  const totalProjects = projects.length
  const activeProjects = projects.filter((p) => p.status === "Active").length
  const completedProjects = projects.filter((p) => p.status === "Completed").length
  const avgProgress =
    projects.length > 0 ? Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / projects.length) : 0

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Projects Management</h2>
          <p className="text-gray-600">
            Manage your construction projects and track progress
            {!isAdmin && " (View Only)"}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="bg-muted p-1 rounded-lg flex">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8"
            >
              <List className="h-4 w-4 mr-2" />
              List
            </Button>
            <Button
              variant={viewMode === "map" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("map")}
              className="h-8"
            >
              <MapIcon className="h-4 w-4 mr-2" />
              Map
            </Button>
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
                  Add Project
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Project</DialogTitle>
                  <DialogDescription>Create a new construction project</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Project Name *</Label>
                      <Input
                        id="name"
                        placeholder="Enter project name"
                        value={formData.name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Project Type</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {projectTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Enter project description"
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      placeholder="Enter project location"
                      value={formData.location}
                      onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="any"
                        placeholder="e.g. 40.7128"
                        value={formData.latitude}
                        onChange={(e) => setFormData((prev) => ({ ...prev, latitude: Number(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="any"
                        placeholder="e.g. -74.0060"
                        value={formData.longitude}
                        onChange={(e) => setFormData((prev) => ({ ...prev, longitude: Number(e.target.value) }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_date">Start Date *</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData((prev) => ({ ...prev, start_date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_date">End Date</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData((prev) => ({ ...prev, end_date: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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
                    <div>
                      <Label htmlFor="progress">Progress (%)</Label>
                      <Input
                        id="progress"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.progress}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, progress: Number.parseInt(e.target.value) || 0 }))
                        }
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={saving}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddProject} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Project"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
            <p className="text-xs text-muted-foreground">All projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeProjects}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Building2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{completedProjects}</div>
            <p className="text-xs text-muted-foreground">Finished projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{avgProgress}%</div>
            <p className="text-xs text-muted-foreground">Overall progress</p>
          </CardContent>
        </Card>
      </div>

      {viewMode === "map" ? (
        <ProjectMap projects={projects} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Construction Projects</CardTitle>
            <CardDescription>
              {isAdmin
                ? "Manage and track your construction projects"
                : "View construction projects and their progress"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Timeline</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{project.name}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{project.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{project.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                        {project.location}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(project.status)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-2" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        <div>
                          <div>{new Date(project.start_date).toLocaleDateString()}</div>
                          {project.end_date && (
                            <div className="text-gray-500">to {new Date(project.end_date).toLocaleDateString()}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleView(project)}>
                          <Eye className="h-3 w-3" />
                        </Button>
                        {isAdmin && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => handleEdit(project)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete(project)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {projects.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  No projects found.{" "}
                  {isAdmin ? "Add your first project to get started!" : "No projects available to view."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {selectedProject?.name}
            </DialogTitle>
            <DialogDescription>{selectedProject?.description}</DialogDescription>
          </DialogHeader>

          {selectedProject && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="photos">Photos</TabsTrigger>
                <TabsTrigger value="templates">Templates</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Project Name</Label>
                    <p className="text-sm text-gray-600">{selectedProject.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Type</Label>
                    <p className="text-sm text-gray-600">{selectedProject.type}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-gray-600">{selectedProject.description || "No description provided"}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Location</Label>
                    <p className="text-sm text-gray-600">{selectedProject.location}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Coordinates</Label>
                    <p className="text-sm text-gray-600">
                      {selectedProject.latitude && selectedProject.longitude
                        ? `${selectedProject.latitude}, ${selectedProject.longitude}`
                        : "Not set"}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Start Date</Label>
                    <p className="text-sm text-gray-600">{new Date(selectedProject.start_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">End Date</Label>
                    <p className="text-sm text-gray-600">
                      {selectedProject.end_date ? new Date(selectedProject.end_date).toLocaleDateString() : "Not set"}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedProject.status)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Progress</Label>
                    <div className="mt-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{selectedProject.progress}%</span>
                      </div>
                      <Progress value={selectedProject.progress} className="h-2" />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="documents" className="space-y-4 mt-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Project Documents</h3>
                  {isAdmin && (
                    <div className="flex items-center">
                      <Input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={uploading}
                      />
                      <Label
                        htmlFor="file-upload"
                        className={`cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload File
                          </>
                        )}
                      </Label>
                    </div>
                  )}
                </div>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projectDocuments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                            No documents uploaded yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        projectDocuments.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center">
                                <FileText className="h-4 w-4 mr-2 text-blue-500" />
                                {doc.name}
                              </div>
                            </TableCell>
                            <TableCell>{doc.type.split("/")[1] || doc.type}</TableCell>
                            <TableCell>{(doc.size / 1024).toFixed(1)} KB</TableCell>
                            <TableCell>{new Date(doc.created_at).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(doc.url, "_blank")}
                                  title="Download"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                {isAdmin && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteDocument(doc.id)}
                                    title="Delete"
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="photos" className="space-y-4 mt-4">
                <PhotoGallery
                  photos={projectPhotos}
                  onPhotosChange={() => loadProjectPhotos(selectedProject.id.toString())}
                  entityType="project"
                  entityId={selectedProject.id.toString()}
                  isAdmin={isAdmin}
                  addPhotoFn={(photo) => addProjectPhoto(selectedProject.id.toString(), photo)}
                  deletePhotoFn={deleteProjectPhoto}
                  projectName={selectedProject.name}
                />
              </TabsContent>

              <TabsContent value="templates" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Document Templates</h3>
                      <p className="text-sm text-muted-foreground">Create documents from templates</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => setShowQualityControlDoc(true)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-primary/10 rounded-lg">
                            <FileCheck className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">Kvalitātes kontroles akts (KKA)</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              Quality Control Act for EL cable tray construction
                            </p>
                            <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                              <Badge variant="secondary">ME Nr. EL-04</Badge>
                              <Badge variant="outline">Rev. 01</Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="opacity-50">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-muted rounded-lg">
                            <FileText className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-muted-foreground">More templates coming soon</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              Additional document templates will be added here
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {showQualityControlDoc && selectedProject && (
        <Dialog open={showQualityControlDoc} onOpenChange={setShowQualityControlDoc}>
          <QualityControlDocument
            projectId={selectedProject.id.toString()}
            projectName={selectedProject.name}
            onClose={() => setShowQualityControlDoc(false)}
          />
        </Dialog>
      )}

      {/* Edit Dialog */}
      {isAdmin && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
              <DialogDescription>Update project information</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Project Name *</Label>
                  <Input
                    id="edit-name"
                    placeholder="Enter project name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-type">Project Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Enter project description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit-location">Location *</Label>
                <Input
                  id="edit-location"
                  placeholder="Enter project location"
                  value={formData.location}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-latitude">Latitude</Label>
                  <Input
                    id="edit-latitude"
                    type="number"
                    step="any"
                    placeholder="e.g. 40.7128"
                    value={formData.latitude}
                    onChange={(e) => setFormData((prev) => ({ ...prev, latitude: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-longitude">Longitude</Label>
                  <Input
                    id="edit-longitude"
                    type="number"
                    step="any"
                    placeholder="e.g. -74.0060"
                    value={formData.longitude}
                    onChange={(e) => setFormData((prev) => ({ ...prev, longitude: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-start_date">Start Date *</Label>
                  <Input
                    id="edit-start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-end_date">End Date</Label>
                  <Input
                    id="edit-end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <Label htmlFor="edit-progress">Progress (%)</Label>
                  <Input
                    id="edit-progress"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.progress}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, progress: Number.parseInt(e.target.value) || 0 }))
                    }
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleUpdateProject} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Project"
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
                This will permanently delete "{selectedProject?.name}" and all its data. This action cannot be undone.
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
