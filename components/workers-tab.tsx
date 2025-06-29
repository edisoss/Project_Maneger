"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, Phone, Mail, MapPin, Calendar, Eye, Edit } from "lucide-react"

export default function WorkersTab() {
  const [workers, setWorkers] = useState([
    {
      id: 1,
      name: "John Smith",
      specialty: "Security Systems",
      phone: "(555) 123-4567",
      email: "john.smith@constructpro.com",
      address: "123 Main St, City, State 12345",
      hireDate: "2023-01-15",
      status: "Active",
      hourlyRate: 35,
      certifications: ["Security+", "CCTV Installation"],
    },
    {
      id: 2,
      name: "Maria Garcia",
      specialty: "Network Cabling",
      phone: "(555) 234-5678",
      email: "maria.garcia@constructpro.com",
      address: "456 Oak Ave, City, State 12345",
      hireDate: "2023-03-20",
      status: "Active",
      hourlyRate: 32,
      certifications: ["BICSI", "Fiber Optic Installation"],
    },
    {
      id: 3,
      name: "David Johnson",
      specialty: "BMS",
      phone: "(555) 345-6789",
      email: "david.johnson@constructpro.com",
      address: "789 Pine Rd, City, State 12345",
      hireDate: "2022-11-10",
      status: "Active",
      hourlyRate: 38,
      certifications: ["BACnet", "HVAC Controls"],
    },
    {
      id: 4,
      name: "Sarah Wilson",
      specialty: "Security Systems",
      phone: "(555) 456-7890",
      email: "sarah.wilson@constructpro.com",
      address: "321 Elm St, City, State 12345",
      hireDate: "2023-06-01",
      status: "Active",
      hourlyRate: 33,
      certifications: ["Access Control", "Alarm Systems"],
    },
  ])

  const [isAddingWorker, setIsAddingWorker] = useState(false)
  const [isViewingWorker, setIsViewingWorker] = useState(false)
  const [isEditingWorker, setIsEditingWorker] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState<(typeof workers)[0] | null>(null)
  const [newWorker, setNewWorker] = useState({
    name: "",
    specialty: "",
    phone: "",
    email: "",
    address: "",
    hireDate: "",
    hourlyRate: "",
    certifications: "",
  })

  const specialties = ["Security Systems", "Network Cabling", "BMS", "General", "Electrical", "HVAC"]

  const handleAddWorker = () => {
    const worker = {
      id: workers.length + 1,
      ...newWorker,
      status: "Active",
      hourlyRate: Number.parseFloat(newWorker.hourlyRate),
      certifications: newWorker.certifications
        .split(",")
        .map((cert) => cert.trim())
        .filter(Boolean),
    }
    setWorkers([...workers, worker])
    setNewWorker({
      name: "",
      specialty: "",
      phone: "",
      email: "",
      address: "",
      hireDate: "",
      hourlyRate: "",
      certifications: "",
    })
    setIsAddingWorker(false)
  }

  const handleViewWorker = (worker: (typeof workers)[0]) => {
    setSelectedWorker(worker)
    setIsViewingWorker(true)
  }

  const handleEditWorker = (worker: (typeof workers)[0]) => {
    setSelectedWorker(worker)
    setIsEditingWorker(true)
  }

  const handleSaveEdit = () => {
    if (!selectedWorker) return

    const updatedWorkers = workers.map((worker) => (worker.id === selectedWorker.id ? selectedWorker : worker))
    setWorkers(updatedWorkers)
    setIsEditingWorker(false)
    setSelectedWorker(null)
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "default"
      case "Inactive":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Workers</h2>
          <p className="text-gray-600">Manage your construction team and worker information</p>
        </div>
        <Dialog open={isAddingWorker} onOpenChange={setIsAddingWorker}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Worker
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Worker</DialogTitle>
              <DialogDescription>Add a new team member to your construction workforce.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="worker-name">Full Name</Label>
                  <Input
                    id="worker-name"
                    value={newWorker.name}
                    onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="worker-specialty">Specialty</Label>
                  <Select
                    value={newWorker.specialty}
                    onValueChange={(value) => setNewWorker({ ...newWorker, specialty: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select specialty" />
                    </SelectTrigger>
                    <SelectContent>
                      {specialties.map((specialty) => (
                        <SelectItem key={specialty} value={specialty}>
                          {specialty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="worker-phone">Phone</Label>
                  <Input
                    id="worker-phone"
                    value={newWorker.phone}
                    onChange={(e) => setNewWorker({ ...newWorker, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="worker-email">Email</Label>
                  <Input
                    id="worker-email"
                    type="email"
                    value={newWorker.email}
                    onChange={(e) => setNewWorker({ ...newWorker, email: e.target.value })}
                    placeholder="worker@constructpro.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="worker-address">Address</Label>
                <Input
                  id="worker-address"
                  value={newWorker.address}
                  onChange={(e) => setNewWorker({ ...newWorker, address: e.target.value })}
                  placeholder="Street address, City, State ZIP"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="worker-hire-date">Hire Date</Label>
                  <Input
                    id="worker-hire-date"
                    type="date"
                    value={newWorker.hireDate}
                    onChange={(e) => setNewWorker({ ...newWorker, hireDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="worker-rate">Hourly Rate ($)</Label>
                  <Input
                    id="worker-rate"
                    type="number"
                    value={newWorker.hourlyRate}
                    onChange={(e) => setNewWorker({ ...newWorker, hourlyRate: e.target.value })}
                    placeholder="35.00"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="worker-certifications">Certifications (comma-separated)</Label>
                <Input
                  id="worker-certifications"
                  value={newWorker.certifications}
                  onChange={(e) => setNewWorker({ ...newWorker, certifications: e.target.value })}
                  placeholder="Security+, CCTV Installation, etc."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddingWorker(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddWorker}>Add Worker</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Worker Dialog */}
        <Dialog open={isViewingWorker} onOpenChange={setIsViewingWorker}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedWorker?.name}</DialogTitle>
              <DialogDescription>Worker details and information</DialogDescription>
            </DialogHeader>
            {selectedWorker && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg">{getInitials(selectedWorker.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedWorker.name}</h3>
                    <p className="text-gray-600">{selectedWorker.specialty}</p>
                    <Badge variant={getStatusColor(selectedWorker.status)}>{selectedWorker.status}</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Phone</Label>
                    <p className="mt-1 text-sm text-gray-600">{selectedWorker.phone}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Email</Label>
                    <p className="mt-1 text-sm text-gray-600">{selectedWorker.email}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Address</Label>
                  <p className="mt-1 text-sm text-gray-600">{selectedWorker.address}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Hire Date</Label>
                    <p className="mt-1 text-sm text-gray-600">{selectedWorker.hireDate}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Hourly Rate</Label>
                    <p className="mt-1 text-sm text-gray-600">${selectedWorker.hourlyRate}/hour</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Certifications</Label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {selectedWorker.certifications.map((cert, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Worker Dialog */}
        <Dialog open={isEditingWorker} onOpenChange={setIsEditingWorker}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Worker</DialogTitle>
              <DialogDescription>Update worker details and information</DialogDescription>
            </DialogHeader>
            {selectedWorker && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-worker-name">Full Name</Label>
                    <Input
                      id="edit-worker-name"
                      value={selectedWorker.name}
                      onChange={(e) => setSelectedWorker({ ...selectedWorker, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-worker-specialty">Specialty</Label>
                    <Select
                      value={selectedWorker.specialty}
                      onValueChange={(value) => setSelectedWorker({ ...selectedWorker, specialty: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {specialties.map((specialty) => (
                          <SelectItem key={specialty} value={specialty}>
                            {specialty}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-worker-phone">Phone</Label>
                    <Input
                      id="edit-worker-phone"
                      value={selectedWorker.phone}
                      onChange={(e) => setSelectedWorker({ ...selectedWorker, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-worker-email">Email</Label>
                    <Input
                      id="edit-worker-email"
                      type="email"
                      value={selectedWorker.email}
                      onChange={(e) => setSelectedWorker({ ...selectedWorker, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-worker-address">Address</Label>
                  <Input
                    id="edit-worker-address"
                    value={selectedWorker.address}
                    onChange={(e) => setSelectedWorker({ ...selectedWorker, address: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-worker-hire-date">Hire Date</Label>
                    <Input
                      id="edit-worker-hire-date"
                      type="date"
                      value={selectedWorker.hireDate}
                      onChange={(e) => setSelectedWorker({ ...selectedWorker, hireDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-worker-rate">Hourly Rate ($)</Label>
                    <Input
                      id="edit-worker-rate"
                      type="number"
                      value={selectedWorker.hourlyRate}
                      onChange={(e) =>
                        setSelectedWorker({ ...selectedWorker, hourlyRate: Number.parseFloat(e.target.value) })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-worker-certifications">Certifications (comma-separated)</Label>
                  <Input
                    id="edit-worker-certifications"
                    value={selectedWorker.certifications.join(", ")}
                    onChange={(e) =>
                      setSelectedWorker({
                        ...selectedWorker,
                        certifications: e.target.value
                          .split(",")
                          .map((cert) => cert.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </div>
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditingWorker(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workers.map((worker) => (
          <Card key={worker.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarFallback>{getInitials(worker.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg">{worker.name}</CardTitle>
                  <CardDescription>{worker.specialty}</CardDescription>
                </div>
                <Badge variant={getStatusColor(worker.status)}>{worker.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  <span>{worker.phone}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  <span className="truncate">{worker.email}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span className="truncate">{worker.address}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Hired: {worker.hireDate}</span>
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Hourly Rate:</span>
                  <span className="font-medium">${worker.hourlyRate}/hour</span>
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-700">Certifications</Label>
                <div className="mt-1 flex flex-wrap gap-1">
                  {worker.certifications.slice(0, 2).map((cert, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {cert}
                    </Badge>
                  ))}
                  {worker.certifications.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{worker.certifications.length - 2}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => handleViewWorker(worker)}>
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleEditWorker(worker)}>
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
