"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Plus, Edit, Trash2, Users, UserCheck, UserX, Settings, Loader2 } from "lucide-react"
import { addWorker, updateWorker, deleteWorker, addRole, addSkill, deleteRole, deleteSkill } from "@/lib/database"
import type { Worker, Role, Skill } from "@/lib/database"
import { useToast } from "@/hooks/use-toast"
import type { Activity } from "./recent-activities"

interface WorkersTabProps {
  workers: Worker[]
  setWorkers: (workers: Worker[]) => void
  roles: Role[]
  setRoles: (roles: Role[]) => void
  skills: Skill[]
  setSkills: (skills: Skill[]) => void
  logActivity: (activity: Omit<Activity, "id" | "timestamp">) => void
}

export default function WorkersTab({
  workers = [],
  setWorkers = () => {},
  roles = [],
  setRoles = () => {},
  skills = [],
  setSkills = () => {},
  logActivity,
}: WorkersTabProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showManageDialog, setShowManageDialog] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()

  const [newRoleName, setNewRoleName] = useState("")
  const [newSkillName, setNewSkillName] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    role: "",
    skills: [] as string[],
    status: "Active",
    hire_date: new Date().toISOString().split("T")[0],
  })

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      role: roles[0]?.name || "",
      skills: [],
      status: "Active",
      hire_date: new Date().toISOString().split("T")[0],
    })
  }

  const handleAddWorker = async () => {
    try {
      setSaving(true)
      if (!formData.name || !formData.phone || !formData.role) {
        toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" })
        return
      }
      const newWorker = await addWorker(formData)
      if (!newWorker) {
        toast({ title: "Error", description: "Failed to add worker.", variant: "destructive" })
        return
      }
      logActivity({
        type: "worker",
        title: "Worker Added",
        description: `New worker "${newWorker.name}" was added to the team.`,
        icon: Plus,
        variant: "default",
      })
      setWorkers([...workers, newWorker])
      setShowAddDialog(false)
      resetForm()
      toast({ title: "Success", description: "Worker added successfully!" })
    } catch (error) {
      console.error("Error adding worker:", error)
      toast({ title: "Error", description: "Error adding worker.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (worker: Worker) => {
    setSelectedWorker(worker)
    setFormData({
      name: worker.name,
      phone: worker.phone,
      role: worker.role,
      skills: worker.skills || [],
      status: worker.status,
      hire_date: worker.hire_date,
    })
    setShowEditDialog(true)
  }

  const handleUpdateWorker = async () => {
    if (!selectedWorker) return
    try {
      setSaving(true)
      if (!formData.name || !formData.phone || !formData.role) {
        toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" })
        return
      }
      const updatedWorker = await updateWorker(selectedWorker.id, formData)
      if (!updatedWorker) {
        toast({ title: "Error", description: "Failed to update worker.", variant: "destructive" })
        return
      }
      logActivity({
        type: "worker",
        title: "Worker Updated",
        description: `Worker "${updatedWorker.name}" was updated.`,
        icon: Edit,
        variant: "secondary",
      })
      setWorkers(workers.map((w) => (w.id === selectedWorker.id ? updatedWorker : w)))
      setShowEditDialog(false)
      setSelectedWorker(null)
      resetForm()
      toast({ title: "Success", description: "Worker updated successfully!" })
    } catch (error) {
      console.error("Error updating worker:", error)
      toast({ title: "Error", description: "Error updating worker.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (worker: Worker) => {
    setSelectedWorker(worker)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!selectedWorker) return
    try {
      setDeleting(true)
      const success = await deleteWorker(selectedWorker.id)
      if (!success) {
        toast({ title: "Error", description: "Failed to delete worker.", variant: "destructive" })
        return
      }
      logActivity({
        type: "worker",
        title: "Worker Removed",
        description: `Worker "${selectedWorker.name}" was removed from the team.`,
        icon: Trash2,
        variant: "destructive",
      })
      setWorkers(workers.filter((w) => w.id !== selectedWorker.id))
      setShowDeleteDialog(false)
      setSelectedWorker(null)
      toast({ title: "Success", description: "Worker deleted successfully!" })
    } catch (error) {
      console.error("Error deleting worker:", error)
      toast({ title: "Error", description: "Error deleting worker.", variant: "destructive" })
    } finally {
      setDeleting(false)
    }
  }

  const handleAddRole = async () => {
    if (!newRoleName.trim()) return
    const newRole = await addRole(newRoleName.trim())
    if (newRole) {
      setRoles([...roles, newRole])
      setNewRoleName("")
      toast({ title: "Success", description: "Role added successfully!" })
    }
  }

  const handleAddSkill = async () => {
    if (!newSkillName.trim()) return
    const newSkill = await addSkill(newSkillName.trim())
    if (newSkill) {
      setSkills([...skills, newSkill])
      setNewSkillName("")
      toast({ title: "Success", description: "Skill added successfully!" })
    }
  }

  const handleDeleteRole = async (roleId: number) => {
    const isInUse = workers.some((w) => w.role === roles.find((r) => r.id === roleId)?.name)
    if (isInUse) {
      toast({
        title: "Error",
        description: "Cannot delete role that is currently assigned to workers",
        variant: "destructive",
      })
      return
    }
    await deleteRole(roleId)
    setRoles(roles.filter((r) => r.id !== roleId))
    toast({ title: "Success", description: "Role deleted successfully!" })
  }

  const handleDeleteSkill = async (skillId: number) => {
    await deleteSkill(skillId)
    setSkills(skills.filter((s) => s.id !== skillId))
    toast({ title: "Success", description: "Skill deleted successfully!" })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge variant="default">{status}</Badge>
      case "Inactive":
        return <Badge variant="secondary">{status}</Badge>
      case "On Leave":
        return <Badge variant="outline">{status}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const totalWorkers = workers.length
  const activeWorkers = workers.filter((w) => w.status === "Active").length
  const inactiveWorkers = workers.filter((w) => w.status === "Inactive").length
  const onLeaveWorkers = workers.filter((w) => w.status === "On Leave").length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Workers Management</h2>
          <p className="text-gray-600">Manage your construction team and their skills</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowManageDialog(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Manage Roles & Skills
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  resetForm()
                  setShowAddDialog(true)
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Worker
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Worker</DialogTitle>
                <DialogDescription>Add a new team member to your construction crew</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      placeholder="Enter worker name"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      placeholder="Enter phone number"
                      value={formData.phone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="role">Role *</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, role: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.name}>
                            {role.name}
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
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                        <SelectItem value="On Leave">On Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="hire_date">Hire Date</Label>
                  <Input
                    id="hire_date"
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, hire_date: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleAddWorker} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Worker"
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
            <CardTitle className="text-sm font-medium">Total Workers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWorkers}</div>
            <p className="text-xs text-muted-foreground">Team members</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workers</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeWorkers}</div>
            <p className="text-xs text-muted-foreground">Currently working</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{inactiveWorkers}</div>
            <p className="text-xs text-muted-foreground">Not active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Leave</CardTitle>
            <Users className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{onLeaveWorkers}</div>
            <p className="text-xs text-muted-foreground">Temporarily away</p>
          </CardContent>
        </Card>
      </div>

      {/* Workers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Manage your construction team</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Skills</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Hire Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workers.map((worker) => (
                <TableRow key={worker.id}>
                  <TableCell>
                    <div className="font-medium">{worker.name}</div>
                  </TableCell>
                  <TableCell>{worker.phone}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{worker.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {worker.skills?.slice(0, 2).map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {worker.skills && worker.skills.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{worker.skills.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(worker.status)}</TableCell>
                  <TableCell>{new Date(worker.hire_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(worker)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(worker)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {workers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No workers found. Add your first team member to get started!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Worker</DialogTitle>
            <DialogDescription>Update worker information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Full Name *</Label>
                <Input
                  id="edit-name"
                  placeholder="Enter worker name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Phone Number *</Label>
                <Input
                  id="edit-phone"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-role">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.name}>
                        {role.name}
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
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="On Leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-hire_date">Hire Date</Label>
              <Input
                id="edit-hire_date"
                type="date"
                value={formData.hire_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, hire_date: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleUpdateWorker} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Worker"
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
              This will permanently delete "{selectedWorker?.name}" and all their data. This action cannot be undone.
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

      {/* Manage Roles & Skills Dialog */}
      <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Roles & Skills</DialogTitle>
            <DialogDescription>Add and manage worker roles and skills</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Roles Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Roles</h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter role name"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddRole()}
                />
                <Button onClick={handleAddRole}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {roles.map((role) => (
                  <div key={role.id} className="flex justify-between items-center p-2 border rounded">
                    <span>{role.name}</span>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteRole(role.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {roles.length === 0 && <p className="text-gray-500 text-center py-4">No roles added yet</p>}
              </div>
            </div>

            {/* Skills Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Skills</h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter skill name"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddSkill()}
                />
                <Button onClick={handleAddSkill}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {skills.map((skill) => (
                  <div key={skill.id} className="flex justify-between items-center p-2 border rounded">
                    <span>{skill.name}</span>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteSkill(skill.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {skills.length === 0 && <p className="text-gray-500 text-center py-4">No skills added yet</p>}
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setShowManageDialog(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
