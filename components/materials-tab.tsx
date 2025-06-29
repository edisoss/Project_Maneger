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
import {
  Plus,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  History,
  Calendar,
  User,
  FileText,
} from "lucide-react"
import { addMaterial, updateMaterial, deleteMaterial, getMaterialTransactions } from "@/lib/database"
import type { Material, MaterialTransaction } from "@/lib/database"

interface MaterialsTabProps {
  materials: Material[]
  setMaterials: (materials: Material[]) => void
}

export default function MaterialsTab({ materials, setMaterials }: MaterialsTabProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [materialTransactions, setMaterialTransactions] = useState<MaterialTransaction[]>([])
  const [saving, setSaving] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    current_stock: 0,
    min_stock: 0,
    unit: "",
    location: "",
  })

  const categories = [
    "Network",
    "Security",
    "BMS",
    "HVAC",
    "Fire Safety",
    "Electrical",
    "Concrete",
    "Steel",
    "Tools",
    "Other",
  ]
  const units = ["pieces", "meters", "feet", "kg", "lbs", "liters", "gallons", "boxes", "rolls", "bags"]
  const locations = ["Warehouse A", "Warehouse B", "Site Storage", "Office", "Vehicle", "Tool Shed"]

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      current_stock: 0,
      min_stock: 0,
      unit: "",
      location: "",
    })
  }

  const loadMaterialHistory = async (material: Material) => {
    setLoadingHistory(true)
    try {
      const transactions = await getMaterialTransactions(material.id)
      setMaterialTransactions(transactions)
      setSelectedMaterial(material)
      setShowHistoryDialog(true)
    } catch (error) {
      console.error("Error loading material history:", error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleSubmit = async () => {
    try {
      setSaving(true)

      if (!formData.name || !formData.category || !formData.unit || !formData.location) {
        alert("Please fill in all required fields")
        return
      }

      const materialData = {
        ...formData,
        status:
          formData.current_stock <= formData.min_stock
            ? formData.current_stock === 0
              ? "Out of Stock"
              : "Low Stock"
            : "In Stock",
        last_updated: new Date().toISOString().split("T")[0],
      }

      const newMaterial = await addMaterial(materialData)
      if (!newMaterial) {
        alert("Failed to add material. Please try again.")
        return
      }

      setMaterials([...materials, newMaterial])
      setShowAddDialog(false)
      resetForm()
    } catch (error) {
      console.error("Error adding material:", error)
      alert("Error adding material. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (material: Material) => {
    setEditingMaterial(material)
    setFormData({
      name: material.name,
      category: material.category,
      current_stock: material.current_stock,
      min_stock: material.min_stock,
      unit: material.unit,
      location: material.location,
    })
    setShowEditDialog(true)
  }

  const handleEditSubmit = async () => {
    if (!editingMaterial) return

    try {
      setSaving(true)

      if (!formData.name || !formData.category || !formData.unit || !formData.location) {
        alert("Please fill in all required fields")
        return
      }

      const updates = {
        ...formData,
        status:
          formData.current_stock <= formData.min_stock
            ? formData.current_stock === 0
              ? "Out of Stock"
              : "Low Stock"
            : "In Stock",
        last_updated: new Date().toISOString().split("T")[0],
      }

      const updatedMaterial = await updateMaterial(editingMaterial.id, updates)
      if (!updatedMaterial) {
        alert("Failed to update material. Please try again.")
        return
      }

      setMaterials(materials.map((m) => (m.id === editingMaterial.id ? updatedMaterial : m)))
      setShowEditDialog(false)
      setEditingMaterial(null)
      resetForm()
    } catch (error) {
      console.error("Error updating material:", error)
      alert("Error updating material. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (materialId: number) => {
    if (!confirm("Are you sure you want to delete this material?")) return

    try {
      const success = await deleteMaterial(materialId)
      if (!success) {
        alert("Failed to delete material. Please try again.")
        return
      }

      setMaterials(materials.filter((m) => m.id !== materialId))
    } catch (error) {
      console.error("Error deleting material:", error)
      alert("Error deleting material. Please try again.")
    }
  }

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case "added":
        return "bg-green-100 text-green-800"
      case "used":
        return "bg-red-100 text-red-800"
      case "adjusted":
        return "bg-blue-100 text-blue-800"
      case "returned":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "added":
        return "+"
      case "used":
        return "-"
      case "adjusted":
        return "±"
      case "returned":
        return "↩"
      default:
        return "?"
    }
  }

  // Calculate statistics
  const totalMaterials = materials.length
  const lowStockCount = materials.filter((m) => m.status === "Low Stock").length
  const outOfStockCount = materials.filter((m) => m.status === "Out of Stock").length
  const totalValue = materials.reduce((sum, m) => sum + m.current_stock * 10, 0) // Assuming $10 per unit for demo

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Materials Management</h2>
          <p className="text-gray-600">Track inventory, stock levels, and material usage history</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Material
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Material</DialogTitle>
              <DialogDescription>Add a new material to your inventory</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Material Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter material name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="current_stock">Current Stock</Label>
                  <Input
                    id="current_stock"
                    type="number"
                    min="0"
                    value={formData.current_stock}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, current_stock: Number.parseInt(e.target.value) || 0 }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="min_stock">Min Stock</Label>
                  <Input
                    id="min_stock"
                    type="number"
                    min="0"
                    value={formData.min_stock}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, min_stock: Number.parseInt(e.target.value) || 0 }))
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="unit">Unit *</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, unit: value }))}
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

              <div>
                <Label htmlFor="location">Location *</Label>
                <Select
                  value={formData.location}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, location: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? "Adding..." : "Add Material"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Materials</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMaterials}</div>
            <p className="text-xs text-muted-foreground">Items in inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowStockCount}</div>
            <p className="text-xs text-muted-foreground">Need reordering</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outOfStockCount}</div>
            <p className="text-xs text-muted-foreground">Urgent attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Estimated inventory value</p>
          </CardContent>
        </Card>
      </div>

      {/* Materials Table */}
      <Card>
        <CardHeader>
          <CardTitle>Materials Inventory</CardTitle>
          <CardDescription>Complete list of materials and their current stock levels</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Min Stock</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((material) => (
                <TableRow key={material.id}>
                  <TableCell>
                    <div className="font-medium">{material.name}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{material.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <BarChart3 className="h-4 w-4 mr-2 text-gray-400" />
                      {material.current_stock} {material.unit}
                    </div>
                  </TableCell>
                  <TableCell>
                    {material.min_stock} {material.unit}
                  </TableCell>
                  <TableCell>{material.location}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        material.status === "Out of Stock"
                          ? "destructive"
                          : material.status === "Low Stock"
                            ? "secondary"
                            : "default"
                      }
                    >
                      {material.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{material.last_updated}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadMaterialHistory(material)}
                        disabled={loadingHistory}
                      >
                        <History className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(material)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(material.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {materials.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No materials found. Add your first material to get started!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Material History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Material Usage History: {selectedMaterial?.name}
            </DialogTitle>
            <DialogDescription>
              Complete transaction history showing when this material was added, used, or adjusted
            </DialogDescription>
          </DialogHeader>

          {selectedMaterial && (
            <div className="space-y-4">
              {/* Material Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Current Stock</Label>
                  <p className="text-lg font-bold">
                    {selectedMaterial.current_stock} {selectedMaterial.unit}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Category</Label>
                  <p className="text-lg">{selectedMaterial.category}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Location</Label>
                  <p className="text-lg">{selectedMaterial.location}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <Badge
                    variant={
                      selectedMaterial.status === "Out of Stock"
                        ? "destructive"
                        : selectedMaterial.status === "Low Stock"
                          ? "secondary"
                          : "default"
                    }
                  >
                    {selectedMaterial.status}
                  </Badge>
                </div>
              </div>

              {/* Transaction History */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Transaction History</h4>
                {materialTransactions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No transaction history found for this material.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {materialTransactions.map((transaction) => (
                      <div key={transaction.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${getTransactionTypeColor(transaction.transaction_type)}`}
                            >
                              {getTransactionIcon(transaction.transaction_type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-medium capitalize">{transaction.transaction_type}</span>
                                <Badge variant="outline" className="text-xs">
                                  {transaction.quantity} {selectedMaterial.unit}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                <div className="flex items-center space-x-4">
                                  <span>
                                    Stock: {transaction.previous_stock} → {transaction.new_stock}
                                  </span>
                                  {transaction.project && (
                                    <span className="flex items-center">
                                      <FileText className="h-3 w-3 mr-1" />
                                      {transaction.project}
                                    </span>
                                  )}
                                </div>
                                {transaction.notes && <p className="text-gray-500">{transaction.notes}</p>}
                                <div className="flex items-center space-x-4 text-xs text-gray-400">
                                  <span className="flex items-center">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {new Date(transaction.created_at).toLocaleDateString()}
                                  </span>
                                  <span className="flex items-center">
                                    <User className="h-3 w-3 mr-1" />
                                    {transaction.created_by || "System"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Material</DialogTitle>
            <DialogDescription>Update material information and stock levels</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Material Name *</Label>
              <Input
                id="edit-name"
                placeholder="Enter material name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="edit-category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-current_stock">Current Stock</Label>
                <Input
                  id="edit-current_stock"
                  type="number"
                  min="0"
                  value={formData.current_stock}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, current_stock: Number.parseInt(e.target.value) || 0 }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-min_stock">Min Stock</Label>
                <Input
                  id="edit-min_stock"
                  type="number"
                  min="0"
                  value={formData.min_stock}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, min_stock: Number.parseInt(e.target.value) || 0 }))
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-unit">Unit *</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, unit: value }))}
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

            <div>
              <Label htmlFor="edit-location">Location *</Label>
              <Select
                value={formData.location}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, location: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={saving}>
              {saving ? "Updating..." : "Update Material"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
