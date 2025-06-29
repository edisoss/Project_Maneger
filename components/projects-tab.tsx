"use client"

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
import { Plus, Calendar, MapPin, User, Eye, Edit } from "lucide-react"

export default function ProjectsTab() {
  const [projects, setProjects] = useState([
    {
      id: 1,
      name: "Office Building Security System",
      description: "Complete security camera installation and access control system for 15-story office building",
      status: "In Progress",
      progress: 75,
      startDate: "2024-01-15",
      endDate: "2024-02-28",
      location: "Downtown Business District",
      manager: "John Smith",
      budget: 125000,
      spent: 93750,
    },
    {
      id: 2,
      name: "Hospital BMS Installation",
      description: "Building Management System installation for new hospital wing including HVAC controls",
      status: "Planning",
      progress: 25,
      startDate: "2024-02-01",
      endDate: "2024-04-15",
      location: "City General Hospital",
      manager: "Maria Garcia",
      budget: 200000,
      spent: 50000,
    },
    {
      id: 3,
      name: "School Network Cabling",
      description: "Complete network infrastructure upgrade for elementary school",
      status: "Completed",
      progress: 100,
      startDate: "2023-12-01",
      endDate: "2024-01-15",
      location: "Riverside Elementary",
      manager: "David Johnson",
      budget: 75000,
      spent: 72500,
    },
  ])

  const [isAddingProject, setIsAddingProject] = useState(false)
  const [isViewingProject, setIsViewingProject] = useState(false)
  const [isEditingProject, setIsEditingProject] = useState(false)
  const [selectedProject, setSelectedProject] = useState<(typeof projects)[0] | null>(null)
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    status: "Planning",
    startDate: "",
    endDate: "",
    location: "",
    manager: "",
    budget: "",
  })

  const handleAddProject = () => {
    const project = {
      id: projects.length + 1,
      ...newProject,
      progress: 0,
      budget: Number.parseFloat(newProject.budget),
      spent: 0,
    }
    setProjects([...projects, project])
    setNewProject({
      name: "",
      description: "",
      status: "Planning",
      startDate: "",
      endDate: "",
      location: "",
      manager: "",
      budget: "",
    })
    setIsAddingProject(false)
  }

  const handleViewProject = (project: (typeof projects)[0]) => {
    setSelectedProject(project)
    setIsViewingProject(true)
  }

  const handleEditProject = (project: (typeof projects)[0]) => {
    setSelectedProject(project)
    setIsEditingProject(true)
  }

  const handleSaveEdit = () => {
    if (!selectedProject) return

    const updatedProjects = projects.map((project) => (project.id === selectedProject.id ? selectedProject : project))
    setProjects(updatedProjects)
    setIsEditingProject(false)
    setSelectedProject(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "default"
      case "In Progress":
        return "secondary"
      case "Planning":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Projects</h2>
          <p className="text-gray-600">Manage your construction projects and track progress</p>
        </div>
        <Dialog open={isAddingProject} onOpenChange={setIsAddingProject}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Project</DialogTitle>
              <DialogDescription>
                Create a new construction project to track progress and manage resources.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input
                    id="project-name"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    placeholder="Enter project name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-status">Status</Label>
                  <Select
                    value={newProject.status}
                    onValueChange={(value) => setNewProject({ ...newProject, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Planning">Planning</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-description">Description</Label>
                <Textarea
                  id="project-description"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Describe the project scope and objectives"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project-start">Start Date</Label>
                  <Input
                    id="project-start"
                    type="date"
                    value={newProject.startDate}
                    onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-end">End Date</Label>
                  <Input
                    id="project-end"
                    type="date"
                    value={newProject.endDate}
                    onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project-location">Location</Label>
                  <Input
                    id="project-location"
                    value={newProject.location}
                    onChange={(e) => setNewProject({ ...newProject, location: e.target.value })}
                    placeholder="Project location"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-manager">Project Manager</Label>
                  <Input
                    id="project-manager"
                    value={newProject.manager}
                    onChange={(e) => setNewProject({ ...newProject, manager: e.target.value })}
                    placeholder="Manager name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-budget">Budget ($)</Label>
                <Input
                  id="project-budget"
                  type="number"
                  value={newProject.budget}
                  onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })}
                  placeholder="Project budget"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddingProject(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddProject}>Add Project</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Project Dialog */}
        <Dialog open={isViewingProject} onOpenChange={setIsViewingProject}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedProject?.name}</DialogTitle>
              <DialogDescription>Project details and progress information</DialogDescription>
            </DialogHeader>
            {selectedProject && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Status</Label>
                    <div className="mt-1">
                      <Badge variant={getStatusColor(selectedProject.status)}>{selectedProject.status}</Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Progress</Label>
                    <div className="mt-1 flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${selectedProject.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{selectedProject.progress}%</span>
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Description</Label>
                  <p className="mt-1 text-sm text-gray-600">{selectedProject.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Start Date</Label>
                    <p className="mt-1 text-sm text-gray-600">{selectedProject.startDate}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">End Date</Label>
                    <p className="mt-1 text-sm text-gray-600">{selectedProject.endDate}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Location</Label>
                    <p className="mt-1 text-sm text-gray-600">{selectedProject.location}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Project Manager</Label>
                    <p className="mt-1 text-sm text-gray-600">{selectedProject.manager}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Budget</Label>
                    <p className="mt-1 text-sm text-gray-600">${selectedProject.budget.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Spent</Label>
                    <p className="mt-1 text-sm text-gray-600">${selectedProject.spent.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Project Dialog */}
        <Dialog open={isEditingProject} onOpenChange={setIsEditingProject}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
              <DialogDescription>Update project details and information</DialogDescription>
            </DialogHeader>
            {selectedProject && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-project-name">Project Name</Label>
                    <Input
                      id="edit-project-name"
                      value={selectedProject.name}
                      onChange={(e) => setSelectedProject({ ...selectedProject, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-project-status">Status</Label>
                    <Select
                      value={selectedProject.status}
                      onValueChange={(value) => setSelectedProject({ ...selectedProject, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Planning">Planning</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-project-description">Description</Label>
                  <Textarea
                    id="edit-project-description"
                    value={selectedProject.description}
                    onChange={(e) => setSelectedProject({ ...selectedProject, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-project-start">Start Date</Label>
                    <Input
                      id="edit-project-start"
                      type="date"
                      value={selectedProject.startDate}
                      onChange={(e) => setSelectedProject({ ...selectedProject, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-project-end">End Date</Label>
                    <Input
                      id="edit-project-end"
                      type="date"
                      value={selectedProject.endDate}
                      onChange={(e) => setSelectedProject({ ...selectedProject, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-project-location">Location</Label>
                    <Input
                      id="edit-project-location"
                      value={selectedProject.location}
                      onChange={(e) => setSelectedProject({ ...selectedProject, location: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-project-manager">Project Manager</Label>
                    <Input
                      id="edit-project-manager"
                      value={selectedProject.manager}
                      onChange={(e) => setSelectedProject({ ...selectedProject, manager: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-project-budget">Budget ($)</Label>
                  <Input
                    id="edit-project-budget"
                    type="number"
                    value={selectedProject.budget}
                    onChange={(e) =>
                      setSelectedProject({ ...selectedProject, budget: Number.parseFloat(e.target.value) })
                    }
                  />
                </div>
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditingProject(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Card key={project.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <CardDescription className="mt-2 line-clamp-2">{project.description}</CardDescription>
                </div>
                <Badge variant={getStatusColor(project.status)}>{project.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>
                    {project.startDate} - {project.endDate}
                  </span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{project.location}</span>
                </div>
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  <span>{project.manager}</span>
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Budget:</span>
                  <span className="font-medium">${project.budget.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Spent:</span>
                  <span className="font-medium">${project.spent.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => handleViewProject(project)}>
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleEditProject(project)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
