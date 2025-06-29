"use client"

import type React from "react"

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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, History, TrendingUp, TrendingDown, Eye, Edit } from "lucide-react"

interface Transaction {
  id: number
  date: string
  type: "in" | "out"
  quantity: number
  reason: string
  project?: string
  worker?: string
  reference?: string
}

interface Material {
  id: number
  name: string
  category: string
  currentStock: number
  minStock: number
  unit: string
  location: string
  lastUpdated: string
  status: string
  transactions: Transaction[]
}

interface MaterialsTabProps {
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

export default function MaterialsTab({ materials, setMaterials }: MaterialsTabProps) {
  // Convert materials to include transactions
  const [materialsWithTransactions, setMaterialsWithTransactions] = useState<Material[]>(
    materials.map((material) => ({
      ...material,
      transactions: [
        {
          id: 1,
          date: "2024-01-15",
          type: "in" as const,
          quantity: material.currentStock,
          reason: "Initial stock",
          reference: "INV-001",
        },
      ],
    })),
  )

  const [isAddingMaterial, setIsAddingMaterial] = useState(false)
  const [isViewingMaterial, setIsViewingMaterial] = useState(false)
  const [isEditingMaterial, setIsEditingMaterial] = useState(false)
  const [isViewingHistory, setIsViewingHistory] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [newMaterial, setNewMaterial] = useState({
    name: "",
    category: "",
    currentStock: "",
    minStock: "",
    unit: "",
    location: "",
  })

  const categories = ["Network Cabling", "Security Systems", "BMS", "Electrical", "HVAC", "General"]
  const units = ["pieces", "meters", "feet", "boxes", "rolls", "kg", "lbs"]

  const handleAddMaterial = () => {
    const material: Material = {
      id: materialsWithTransactions.length + 1,
      ...newMaterial,
      currentStock: Number.parseInt(newMaterial.currentStock),
      minStock: Number.parseInt(newMaterial.minStock),
      lastUpdated: new Date().toISOString().split("T")[0],
      status: "In Stock",
      transactions: [
        {
          id: 1,
          date: new Date().toISOString().split("T")[0],
          type: "in",
          quantity: Number.parseInt(newMaterial.currentStock),
          reason: "Initial stock",
          reference: `INV-${Date.now()}`,
        },
      ],
    }
    setMaterialsWithTransactions([...materialsWithTransactions, material])

    // Update the parent materials state
    setMaterials([
      ...materials,
      {
        id: material.id,
        name: material.name,
        category: material.category,
        currentStock: material.currentStock,
        minStock: material.minStock,
        unit: material.unit,
        location: material.location,
        lastUpdated: material.lastUpdated,
        status: material.status,
      },
    ])

    setNewMaterial({
      name: "",
      category: "",
      currentStock: "",
      minStock: "",
      unit: "",
      location: "",
    })
    setIsAddingMaterial(false)
  }

  const handleViewMaterial = (material: Material) => {
    setSelectedMaterial(material)
    setIsViewingMaterial(true)
  }

  const handleViewHistory = (material: Material) => {
    setSelectedMaterial(material)
    setIsViewingHistory(true)
  }

  const handleEditMaterial = (material: Material) => {
    setSelectedMaterial(material)
    setIsEditingMaterial(true)
  }

  const handleSaveEdit = () => {
    if (!selectedMaterial) return

    const updatedMaterials = materialsWithTransactions.map((material) =>
      material.id === selectedMaterial.id
        ? {
            ...selectedMaterial,
            lastUpdated: new Date().toISOString().split("T")[0],
          }
        : material,
    )
    setMaterialsWithTransactions(updatedMaterials)

    // Update parent state
    setMaterials(
      updatedMaterials.map((m) => ({
        id: m.id,
        name: m.name,
        category: m.category,
        currentStock: m.currentStock,
        minStock: m.minStock,
        unit: m.unit,
        location: m.location,
        lastUpdated: m.lastUpdated,
        status: m.status,
      })),
    )

    setIsEditingMaterial(false)
    setSelectedMaterial(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Stock":
        return "default"
      case "Low Stock":
        return "secondary"
      case "Critical":
        return "destructive"
      case "Out of Stock":
        return "outline"
      default:
        return "outline"
    }
  }

  const updateMaterialStatus = (material: Material) => {
    if (material.currentStock <= 0) return "Out of Stock"
    if (material.currentStock <= material.minStock * 0.5) return "Critical"
    if (material.currentStock <= material.minStock) return "Low Stock"
    return "In Stock"
  }

  // Add transaction when material is used
  const addTransaction = (
    materialId: number,
    type: "in" | "out",
    quantity: number,
    reason: string,
    project?: string,
    worker?: string,
  ) => {
    const updatedMaterials = materialsWithTransactions.map((material) => {
      if (material.id === materialId) {
        const newTransaction: Transaction = {
          id: material.transactions.length + 1,
          date: new Date().toISOString().split("T")[0],
          type,
          quantity,
          reason,
          project,
          worker,
          reference: `${type === "in" ? "IN" : "OUT"}-${Date.now()}`,
        }
        return {
          ...material,
          transactions: [...material.transactions, newTransaction],
          lastUpdated: new Date().toISOString().split("T")[0],
        }
      }
      return material
    })
    setMaterialsWithTransactions(updatedMaterials)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Materials Inventory</h2>
          <p className="text-gray-600">Manage construction materials and track inventory levels</p>
        </div>
        <Dialog open={isAddingMaterial} onOpenChange={setIsAddingMaterial}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Material
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Material</DialogTitle>
              <DialogDescription>Add a new material to your inventory system.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="material-name">Material Name</Label>
                  <Input
                    id="material-name"
                    value={newMaterial.name}
                    onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                    placeholder="Enter material name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="material-category">Category</Label>
                  <Select
                    value={newMaterial.category}
                    onValueChange={(value) => setNewMaterial({ ...newMaterial, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="material-stock">Current Stock</Label>
                  <Input
                    id="material-stock"
                    type="number"
                    value={newMaterial.currentStock}
                    onChange={(e) => setNewMaterial({ ...newMaterial, currentStock: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="material-min">Min Stock</Label>
                  <Input
                    id="material-min"
                    type="number"
                    value={newMaterial.minStock}
                    onChange={(e) => setNewMaterial({ ...newMaterial, minStock: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="material-unit">Unit</Label>
                  <Select
                    value={newMaterial.unit}
                    onValueChange={(value) => setNewMaterial({ ...newMaterial, unit: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="material-location">Storage Location</Label>
                <Input
                  id="material-location"
                  value={newMaterial.location}
                  onChange={(e) => setNewMaterial({ ...newMaterial, location: e.target.value })}
                  placeholder="Warehouse A - Shelf 1"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddingMaterial(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddMaterial}>Add Material</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Material Dialog */}
        <Dialog open={isViewingMaterial} onOpenChange={setIsViewingMaterial}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedMaterial?.name}</DialogTitle>
              <DialogDescription>Material details and inventory information</DialogDescription>
            </DialogHeader>
            {selectedMaterial && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Category</Label>
                    <p className="mt-1 text-sm text-gray-600">{selectedMaterial.category}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Status</Label>
                    <div className="mt-1">
                      <Badge variant={getStatusColor(updateMaterialStatus(selectedMaterial))}>
                        {updateMaterialStatus(selectedMaterial)}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Current Stock</Label>
                    <p className="mt-1 text-sm text-gray-600">
                      {selectedMaterial.currentStock} {selectedMaterial.unit}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Minimum Stock</Label>
                    <p className="mt-1 text-sm text-gray-600">
                      {selectedMaterial.minStock} {selectedMaterial.unit}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Unit</Label>
                    <p className="mt-1 text-sm text-gray-600">{selectedMaterial.unit}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Storage Location</Label>
                  <p className="mt-1 text-sm text-gray-600">{selectedMaterial.location}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Last Updated</Label>
                  <p className="mt-1 text-sm text-gray-600">{selectedMaterial.lastUpdated}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Recent Transactions</Label>
                  <div className="mt-2 space-y-1">
                    {selectedMaterial.transactions.slice(-3).map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded"
                      >
                        <span className="flex items-center gap-1">
                          {transaction.type === "in" ? (
                            <TrendingUp className="h-3 w-3 text-green-500" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-500" />
                          )}
                          {transaction.reason}
                        </span>
                        <span className="font-medium">
                          {transaction.type === "in" ? "+" : "-"}
                          {transaction.quantity} {selectedMaterial.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Transaction History Dialog */}
        <Dialog open={isViewingHistory} onOpenChange={setIsViewingHistory}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Transaction History - {selectedMaterial?.name}</DialogTitle>
              <DialogDescription>Complete history of all material movements</DialogDescription>
            </DialogHeader>
            {selectedMaterial && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Current Stock</p>
                    <p className="text-2xl font-bold">
                      {selectedMaterial.currentStock} {selectedMaterial.unit}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total In</p>
                    <p className="text-2xl font-bold text-green-600">
                      {selectedMaterial.transactions
                        .filter((t) => t.type === "in")
                        .reduce((sum, t) => sum + t.quantity, 0)}{" "}
                      {selectedMaterial.unit}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total Out</p>
                    <p className="text-2xl font-bold text-red-600">
                      {selectedMaterial.transactions
                        .filter((t) => t.type === "out")
                        .reduce((sum, t) => sum + t.quantity, 0)}{" "}
                      {selectedMaterial.unit}
                    </p>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Project/Worker</TableHead>
                      <TableHead>Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedMaterial.transactions
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{transaction.date}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {transaction.type === "in" ? (
                                <TrendingUp className="h-4 w-4 text-green-500" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-500" />
                              )}
                              <span className={transaction.type === "in" ? "text-green-600" : "text-red-600"}>
                                {transaction.type === "in" ? "Stock In" : "Stock Out"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {transaction.type === "in" ? "+" : "-"}
                            {transaction.quantity} {selectedMaterial.unit}
                          </TableCell>
                          <TableCell>{transaction.reason}</TableCell>
                          <TableCell>
                            {transaction.project && <div className="text-sm">{transaction.project}</div>}
                            {transaction.worker && <div className="text-xs text-gray-500">{transaction.worker}</div>}
                          </TableCell>
                          <TableCell className="text-xs text-gray-500">{transaction.reference}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Material Dialog */}
        <Dialog open={isEditingMaterial} onOpenChange={setIsEditingMaterial}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Material</DialogTitle>
              <DialogDescription>Update material details and inventory information</DialogDescription>
            </DialogHeader>
            {selectedMaterial && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-material-name">Material Name</Label>
                    <Input
                      id="edit-material-name"
                      value={selectedMaterial.name}
                      onChange={(e) => setSelectedMaterial({ ...selectedMaterial, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-material-category">Category</Label>
                    <Select
                      value={selectedMaterial.category}
                      onValueChange={(value) => setSelectedMaterial({ ...selectedMaterial, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-material-stock">Current Stock</Label>
                    <Input
                      id="edit-material-stock"
                      type="number"
                      value={selectedMaterial.currentStock}
                      onChange={(e) =>
                        setSelectedMaterial({ ...selectedMaterial, currentStock: Number.parseInt(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-material-min">Min Stock</Label>
                    <Input
                      id="edit-material-min"
                      type="number"
                      value={selectedMaterial.minStock}
                      onChange={(e) =>
                        setSelectedMaterial({ ...selectedMaterial, minStock: Number.parseInt(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-material-unit">Unit</Label>
                    <Select
                      value={selectedMaterial.unit}
                      onValueChange={(value) => setSelectedMaterial({ ...selectedMaterial, unit: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-material-location">Storage Location</Label>
                  <Input
                    id="edit-material-location"
                    value={selectedMaterial.location}
                    onChange={(e) => setSelectedMaterial({ ...selectedMaterial, location: e.target.value })}
                  />
                </div>
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditingMaterial(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Materials List Table */}
      <Card>
        <CardHeader>
          <CardTitle>Materials Inventory</CardTitle>
          <CardDescription>Complete list of all materials with current stock levels</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Min Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materialsWithTransactions.map((material) => (
                <TableRow key={material.id}>
                  <TableCell className="font-medium">{material.name}</TableCell>
                  <TableCell>{material.category}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {material.currentStock} {material.unit}
                      </span>
                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${
                            material.currentStock <= material.minStock * 0.5
                              ? "bg-red-500"
                              : material.currentStock <= material.minStock
                                ? "bg-yellow-500"
                                : "bg-green-500"
                          }`}
                          style={{
                            width: `${Math.min(100, (material.currentStock / (material.minStock * 2)) * 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {material.minStock} {material.unit}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(updateMaterialStatus(material))}>
                      {updateMaterialStatus(material)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{material.location}</TableCell>
                  <TableCell className="text-sm text-gray-600">{material.lastUpdated}</TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button variant="outline" size="sm" onClick={() => handleViewMaterial(material)}>
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleViewHistory(material)}>
                        <History className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEditMaterial(material)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
