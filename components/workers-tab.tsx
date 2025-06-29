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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Edit, Eye, Phone, Mail, Users, UserCheck, DollarSign, Calendar } from "lucide-react"
import { addWorker } from "@/lib/database"
import type { Worker } from "@/lib/database"

interface WorkersTabProps {
  workers: Worker[]
  setWorkers: (workers: Worker[]) => void
}

export default function WorkersTab({ workers, setWorkers }: WorkersTabProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    hourly_rate: 0,
    hire_date: "",
    status: "Active",
  })

  const [selectedSkills, setSelectedSkills] = useState<string[]>([])

  const roles = ["Technician", "Senior Technician", "Lead Technician", "Supervisor", "Project Manager"]
  const statusOptions = ["Active", "Inactive", "On Leave"]
  const availableSkills = [
    "Network Cabling",
    "Security Systems",
    "BMS",
    "HVAC",
    "Fire Safety",
    "Electrical",
    "Project Management",
    "Quality Control",
  ]

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "",
      hourly_rate: 0,
      hire_date: "",
      status: "Active",
    })
    setSelectedSkills([])
  }

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]))
  }

  const handleSubmit = async () => {
    try {
      setSaving(true)

      if (!formData.name || !formData.email || !formData.phone || !formData.role || !formData.hire_date) {
        alert("Please fill in all required fields")
        return
      }

      const workerData = {
        ...formData,
        skills: selectedSkills,
      }

      const newWorker = await addWorker(workerData)
      if (!newWorker) {
        alert("Failed to add worker. Please try again.")
        return
      }

      setWorkers([...workers, newWorker])
      setShowAddDialog(false)
      resetForm()
    } catch (error) {
      console.error("Error adding worker:", error)
      alert("Error adding worker. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleView = (worker: Worker) => {
    setSelectedWorker(worker)
    setShowViewDialog(true)
  }

  // Calculate statistics
  const totalWorkers = workers.length
  const activeWorkers = workers.filter((w) => w.status === "Active").length
  const averageRate = workers.length > 0 ? workers.reduce((sum, w) => sum + w.hourly_rate, 0) / workers.length : 0
  const totalPayroll = workers.filter((w) => w.status === "Active").reduce((sum, w) => sum + w.hourly_rate * 40 * 4, 0) // Assuming 40 hours/week

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Workers Management</h2>
          <p className="text-gray-600">Manage your construction team and track worker information</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Worker
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Worker</DialogTitle>
              <DialogDescription>Add a new team member to your construction crew</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

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
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    min="0"
                    step="0.50"
                    value={formData.hourly_rate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, hourly_rate: Number.parseFloat(e.target.value) || 0 }))
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="hire_date">Hire Date *</Label>
                  <Input
                    id="hire_date"
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, hire_date: e.target.value }))}
                  />
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

              {/* Skills */}
              <div className="space-y-4">
                <div>
                  <Label>Skills & Certifications</Label>
                  <div className="border rounded-lg p-3 max-h-60 overflow-y-auto">
                    {availableSkills.map((skill) => (
                      <div key={skill} className="flex items-center space-x-2 py-1">
                        <Checkbox
                          id={`skill-${skill}`}
                          checked={selectedSkills.includes(skill)}
                          onCheckedChange={() => handleSkillToggle(skill)}
                        />
                        <Label htmlFor={`skill-${skill}`} className="text-sm">
                          {skill}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Selected: {selectedSkills.length} skills</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? "Adding..." : "Add Worker"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
            <CardTitle className="text-sm font-medium">Average Rate</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${averageRate.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Per hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Payroll</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPayroll.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Estimated</p>
          </CardContent>
        </Card>
      </div>

      {/* Workers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Complete list of workers and their information</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Skills</TableHead>
                <TableHead>Rate</TableHead>
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
                  <TableCell>
                    <Badge variant="outline">{worker.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Mail className="h-3 w-3 mr-1" />
                        {worker.email}
                      </div>
                      <div className="flex items-center text-sm">
                        <Phone className="h-3 w-3 mr-1" />
                        {worker.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {worker.skills.slice(0, 2).map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {worker.skills.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{worker.skills.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>${worker.hourly_rate}/hr</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        worker.status === "Active" ? "default" : worker.status === "On Leave" ? "secondary" : "outline"
                      }
                    >
                      {worker.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{worker.hire_date}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleView(worker)}>
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
          {workers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No workers found. Add your first team member to get started!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Worker Details</DialogTitle>
            <DialogDescription>Complete information about this team member</DialogDescription>
          </DialogHeader>

          {selectedWorker && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Full Name</Label>
                  <p>{selectedWorker.name}</p>
                </div>
                <div>
                  <Label className="font-medium">Role</Label>
                  <Badge variant="outline">{selectedWorker.role}</Badge>
                </div>
                <div>
                  <Label className="font-medium">Email</Label>
                  <p>{selectedWorker.email}</p>
                </div>
                <div>
                  <Label className="font-medium">Phone</Label>
                  <p>{selectedWorker.phone}</p>
                </div>
                <div>
                  <Label className="font-medium">Hourly Rate</Label>
                  <p>${selectedWorker.hourly_rate}/hour</p>
                </div>
                <div>
                  <Label className="font-medium">Hire Date</Label>
                  <p>{selectedWorker.hire_date}</p>
                </div>
                <div>
                  <Label className="font-medium">Status</Label>
                  <Badge
                    variant={
                      selectedWorker.status === "Active"
                        ? "default"
                        : selectedWorker.status === "On Leave"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {selectedWorker.status}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="font-medium">Skills & Certifications</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedWorker.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
