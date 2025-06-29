"use client"

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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Eye, Calendar, DollarSign, Users, TrendingUp } from "lucide-react"
import { addProject } from "@/lib/database"
import type { Project } from "@/lib/database"

interface ProjectsTabProps {
  projects: Project[]
  setProjects: (projects: Project[]) => void
}

export default function ProjectsTab({ projects, setProjects }: ProjectsTabProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "",
    start_date: "",
    end_date: "",
    budget: 0,
    progress: 0,
  })

  const statusOptions = ["Planning", "In Progress", "On Hold", "Completed", "Cancelled"]

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      status: "",
      start_date: "",
      end_date: "",
      budget: 0,
      progress: 0,
    })
  }

  const handleSubmit = async () => {
    try {
      setSaving(true)

      if (!formData.name || !formData.description || !formData.status || !formData.start_date) {
        alert("Please fill in all required fields")
        return
      }

      const newProject = await addProject(formData)
      if (!newProject) {
        alert("Failed to add project. Please try again.")
        return
      }

      setProjects([...projects, newProject])
      setShowAddDialog(false)
      resetForm()
    } catch (error) {
      console.error("Error adding project:", error)
      alert("Error adding project. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleView = (project: Project) => {
    setSelectedProject(project)
    setShowViewDialog(true)
  }

  // Calculate statistics
  const totalProjects = projects.length
  const activeProjects = projects.filter((p) => p.status === "In Progress").length
  const completedProjects = projects.filter((p) => p.status === "Completed").length
  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Project Management</h2>
          <p className="text-gray-600">Manage construction projects and track progress</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Project</DialogTitle>
              <DialogDescription>Create a new construction project</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
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
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Enter project description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
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
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

              <div>
                <Label htmlFor="budget">Budget ($)</Label>
                <Input
                  id="budget"
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.budget}
                  onChange={(e) => setFormData((prev) => ({ ...prev, budget: Number.parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div>
                <Label htmlFor="progress">Progress (%)</Label>
                <Input
                  id="progress"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => setFormData((prev) => ({ ...prev, progress: Number.parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? "Adding..." : "Add Project"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
            <p className="text-xs text-muted-foreground">All projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{activeProjects}</div>
            <p className="text-xs text-muted-foreground">Currently in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedProjects}</div>
            <p className="text-xs text-muted-foreground">Successfully finished</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalBudget.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Combined project value</p>
          </CardContent>
        </Card>
      </div>

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle>Projects Overview</CardTitle>
          <CardDescription>All construction projects and their current status</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <div className="font-medium">{project.name}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">{project.description}</div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        project.status === "Completed"
                          ? "default"
                          : project.status === "In Progress"
                            ? "secondary"
                            : project.status === "On Hold"
                              ? "destructive"
                              : "outline"
                      }
                    >
                      {project.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="w-full">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>
                  </TableCell>
                  <TableCell>{project.start_date}</TableCell>
                  <TableCell>${project.budget.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleView(project)}>
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {projects.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No projects found. Add your first project to get started!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Project Details</DialogTitle>
            <DialogDescription>Complete information about this project</DialogDescription>
          </DialogHeader>

          {selectedProject && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Project Name</Label>
                  <p>{selectedProject.name}</p>
                </div>
                <div>
                  <Label className="font-medium">Status</Label>
                  <Badge
                    variant={
                      selectedProject.status === "Completed"
                        ? "default"
                        : selectedProject.status === "In Progress"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {selectedProject.status}
                  </Badge>
                </div>
                <div>
                  <Label className="font-medium">Start Date</Label>
                  <p>{selectedProject.start_date}</p>
                </div>
                <div>
                  <Label className="font-medium">End Date</Label>
                  <p>{selectedProject.end_date || "Not set"}</p>
                </div>
                <div>
                  <Label className="font-medium">Budget</Label>
                  <p>${selectedProject.budget.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="font-medium">Progress</Label>
                  <div className="flex items-center space-x-2">
                    <Progress value={selectedProject.progress} className="flex-1" />
                    <span className="text-sm">{selectedProject.progress}%</span>
                  </div>
                </div>
              </div>

              <div>
                <Label className="font-medium">Description</Label>
                <p className="mt-1">{selectedProject.description}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
