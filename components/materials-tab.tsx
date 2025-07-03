"use client"

import { useState, useEffect } from "react"
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
  Package,
  AlertTriangle,
  CheckCircle,
  Settings,
  Loader2,
  Search,
  History,
  Calendar,
  TrendingUp,
  TrendingDown,
  RotateCcw,
} from "lucide-react"
import {
  addMaterial,
  updateMaterial,
  deleteMaterial,
  getMaterialCategories,
  getMaterialLocations,
  addMaterialCategory,
  addMaterialLocation,
  deleteMaterialCategory,
  deleteMaterialLocation,
  getMaterialTransactions,
} from "@/lib/database"
import type { Material, MaterialCategory, MaterialLocation, MaterialTransaction } from "@/lib/database"
import { useToast } from "@/hooks/use-toast"
import type { Activity } from "./recent-activities"

interface MaterialsTabProps {
  materials: Material[]
  setMaterials: (materials: Material[]) => void
  materialCategories: MaterialCategory[]
  setMaterialCategories: (categories: MaterialCategory[]) => void
  materialLocations: MaterialLocation[]
  setMaterialLocations: (locations: MaterialLocation[]) => void
  logActivity: (activity: Omit<Activity, "id" | "timestamp">) => void
}

export default function MaterialsTab({
  materials = [],
  setMaterials = () => {},
  materialCategories = [],
  setMaterialCategories = () => {},
  materialLocations = [],
  setMaterialLocations = () => {},
  logActivity,
}: MaterialsTabProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showCategoriesDialog, setShowCategoriesDialog] = useState(false)
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [materialTransactions, setMaterialTransactions] = useState<MaterialTransaction[]>([])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const { toast } = useToast()

  // Categories and Locations state
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newLocationName, setNewLocationName] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    current_stock: 0,
    min_stock: 0,
    unit: "",
    location: "",
    status: "Active",
  })

  const unitOptions = ["pcs", "kg", "lbs", "m", "ft", "m²", "ft²", "m³", "ft³", "L", "gal", "tons", "bags", "boxes"]

  // Load categories and locations
  useEffect(() => {
    loadCategoriesAndLocations()
  }, [])

  const loadCategoriesAndLocations = async () => {
    try {
      setLoadingCategories(true)
      console.log("Loading categories and locations...")

      const [categoriesData, locationsData] = await Promise.all([getMaterialCategories(), getMaterialLocations()])

      console.log("Categories loaded:", categoriesData)
      console.log("Locations loaded:", locationsData)

      setMaterialCategories(categoriesData)
      setMaterialLocations(locationsData)

      // If no categories exist, add some default ones
      if (categoriesData.length === 0) {
        console.log("No categories found, you may need to add some default categories")
      }

      // If no locations exist, add some default ones
      if (locationsData.length === 0) {
        console.log("No locations found, you may need to add some default locations")
      }
    } catch (error) {
      console.error("Error loading categories and locations:", error)
      toast({
        title: "Error",
        description: "Failed to load categories and locations. Check console for details.",
        variant: "destructive",
      })
    } finally {
      setLoadingCategories(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: materialCategories[0]?.name || "",
      current_stock: 0,
      min_stock: 0,
      unit: "pcs",
      location: materialLocations[0]?.name || "",
      status: "Active",
    })
  }

  const handleAddMaterial = async () => {
    try {
      setSaving(true)

      if (!formData.name || !formData.category || !formData.unit || !formData.location) {
        toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" })
        return
      }

      const materialData = {
        ...formData,
        last_updated: new Date().toISOString(),
      }

      const newMaterial = await addMaterial(materialData)

      if (!newMaterial) {
        toast({ title: "Error", description: "Failed to add material. Please try again.", variant: "destructive" })
        return
      }

      logActivity({
        type: "material",
        title: "Material Added",
        description: `New material "${newMaterial.name}" was added to inventory.`,
        icon: Plus,
        variant: "default",
      })

      setMaterials([...materials, newMaterial])
      setShowAddDialog(false)
      resetForm()
      toast({ title: "Success", description: "Material added successfully!" })
    } catch (error) {
      console.error("Error adding material:", error)
      toast({ title: "Error", description: "Error adding material. Please try again.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (material: Material) => {
    setSelectedMaterial(material)
    setFormData({
      name: material.name,
      description: (material as any).description || "",
      category: material.category,
      current_stock: material.current_stock,
      min_stock: material.min_stock,
      unit: material.unit,
      location: material.location,
      status: material.status,
    })
    setShowEditDialog(true)
  }

  const handleUpdateMaterial = async () => {
    if (!selectedMaterial) return

    try {
      setSaving(true)

      if (!formData.name || !formData.category || !formData.unit || !formData.location) {
        toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" })
        return
      }

      const updatedMaterial = await updateMaterial(selectedMaterial.id, formData)

      if (!updatedMaterial) {
        toast({ title: "Error", description: "Failed to update material. Please try again.", variant: "destructive" })
        return
      }

      logActivity({
        type: "material",
        title: "Material Updated",
        description: `Material "${updatedMaterial.name}" was updated.`,
        icon: Edit,
        variant: "secondary",
      })

      setMaterials(materials.map((material) => (material.id === selectedMaterial.id ? updatedMaterial : material)))
      setShowEditDialog(false)
      setSelectedMaterial(null)
      resetForm()
      toast({ title: "Success", description: "Material updated successfully!" })
    } catch (error) {
      console.error("Error updating material:", error)
      toast({ title: "Error", description: "Error updating material. Please try again.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (material: Material) => {
    setSelectedMaterial(material)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!selectedMaterial) return

    try {
      setDeleting(true)
      const success = await deleteMaterial(selectedMaterial.id)

      if (!success) {
        toast({ title: "Error", description: "Failed to delete material. Please try again.", variant: "destructive" })
        return
      }

      logActivity({
        type: "material",
        title: "Material Deleted",
        description: `Material "${selectedMaterial.name}" was deleted from inventory.`,
        icon: Trash2,
        variant: "destructive",
      })

      setMaterials(materials.filter((material) => material.id !== selectedMaterial.id))
      setShowDeleteDialog(false)
      setSelectedMaterial(null)
      toast({ title: "Success", description: "Material deleted successfully!" })
    } catch (error) {
      console.error("Error deleting material:", error)
      toast({ title: "Error", description: "Error deleting material. Please try again.", variant: "destructive" })
    } finally {
      setDeleting(false)
    }
  }

  const handleViewHistory = async (material: Material) => {
    setSelectedMaterial(material)
    setLoadingHistory(true)
    setShowHistoryDialog(true)

    try {
      const transactions = await getMaterialTransactions(material.id)
      setMaterialTransactions(transactions)
    } catch (error) {
      console.error("Error fetching material history:", error)
      toast({ title: "Error", description: "Failed to load material history", variant: "destructive" })
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({ title: "Error", description: "Please enter a category name", variant: "destructive" })
      return
    }

    try {
      const newCategory = await addMaterialCategory(newCategoryName.trim())
      if (newCategory) {
        setMaterialCategories([...materialCategories, newCategory])
        setNewCategoryName("")
        toast({ title: "Success", description: "Category added successfully!" })
      }
    } catch (error) {
      console.error("Error adding category:", error)
      toast({ title: "Error", description: "Failed to add category", variant: "destructive" })
    }
  }

  const handleAddLocation = async () => {
    if (!newLocationName.trim()) {
      toast({ title: "Error", description: "Please enter a location name", variant: "destructive" })
      return
    }

    try {
      const newLocation = await addMaterialLocation(newLocationName.trim())
      if (newLocation) {
        setMaterialLocations([...materialLocations, newLocation])
        setNewLocationName("")
        toast({ title: "Success", description: "Location added successfully!" })
      }
    } catch (error) {
      console.error("Error adding location:", error)
      toast({ title: "Error", description: "Failed to add location", variant: "destructive" })
    }
  }

  const handleDeleteCategory = async (categoryId: number) => {
    // Check if category is in use
    const isInUse = materials.some(
      (material) => material.category === materialCategories.find((c) => c.id === categoryId)?.name,
    )
    if (isInUse) {
      toast({
        title: "Error",
        description: "Cannot delete category that is currently in use by materials",
        variant: "destructive",
      })
      return
    }

    try {
      const success = await deleteMaterialCategory(categoryId)
      if (success) {
        setMaterialCategories(materialCategories.filter((cat) => cat.id !== categoryId))
        toast({ title: "Success", description: "Category deleted successfully!" })
      }
    } catch (error) {
      console.error("Error deleting category:", error)
      toast({ title: "Error", description: "Failed to delete category", variant: "destructive" })
    }
  }

  const handleDeleteLocation = async (locationId: number) => {
    // Check if location is in use
    const isInUse = materials.some(
      (material) => material.location === materialLocations.find((l) => l.id === locationId)?.name,
    )
    if (isInUse) {
      toast({
        title: "Error",
        description: "Cannot delete location that is currently in use by materials",
        variant: "destructive",
      })
      return
    }

    try {
      const success = await deleteMaterialLocation(locationId)
      if (success) {
        setMaterialLocations(materialLocations.filter((loc) => loc.id !== locationId))
        toast({ title: "Success", description: "Location deleted successfully!" })
      }
    } catch (error) {
      console.error("Error deleting location:", error)
      toast({ title: "Error", description: "Failed to delete location", variant: "destructive" })
    }
  }

  const getStockStatus = (material: Material) => {
    if (material.current_stock <= 0) return "out-of-stock"
    if (material.current_stock <= material.min_stock) return "low-stock"
    return "in-stock"
  }

  const getStockBadge = (material: Material) => {
    const status = getStockStatus(material)
    switch (status) {
      case "out-of-stock":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Out of Stock
          </Badge>
        )
      case "low-stock":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Low Stock
          </Badge>
        )
      default:
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            In Stock
          </Badge>
        )
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "added":
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case "used":
        return <TrendingDown className="h-4 w-4 text-red-500" />
      case "adjusted":
        return <RotateCcw className="h-4 w-4 text-blue-500" />
      case "returned":
        return <RotateCcw className="h-4 w-4 text-yellow-500" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  // Filter materials
  const filteredMaterials = materials.filter((material) => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === "all" || material.category === filterCategory
    const matchesStatus = filterStatus === "all" || getStockStatus(material) === filterStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  // Calculate statistics
  const totalMaterials = materials.length
  const lowStockMaterials = materials.filter((m) => getStockStatus(m) === "low-stock").length
  const outOfStockMaterials = materials.filter((m) => getStockStatus(m) === "out-of-stock").length
  const activeMaterials = materials.filter((m) => m.status === "Active").length

  return (
    <div className="space-y-6 px-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Materials Management</h2>
          <p className="text-gray-600">Track and manage construction materials inventory</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCategoriesDialog(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Manage Categories & Locations
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
                Add Material
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Material</DialogTitle>
                <DialogDescription>Add a new material to your inventory</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                    <Label htmlFor="unit">Unit *</Label>
                    <Select
                      value={formData.unit}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, unit: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {unitOptions.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
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
                    placeholder="Enter material description (optional)"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                        {materialCategories.map((category) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
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
                        {materialLocations.map((location) => (
                          <SelectItem key={location.id} value={location.name}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="current_stock">Current Stock</Label>
                    <Input
                      id="current_stock"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.current_stock || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, current_stock: Number.parseFloat(e.target.value) || 0 }))
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="min_stock">Minimum Stock</Label>
                    <Input
                      id="min_stock"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.min_stock || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, min_stock: Number.parseFloat(e.target.value) || 0 }))
                      }
                    />
                  </div>
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
                      <SelectItem value="Discontinued">Discontinued</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleAddMaterial} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Material"
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
            <div className="text-2xl font-bold text-yellow-600">{lowStockMaterials}</div>
            <p className="text-xs text-muted-foreground">Items need restocking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outOfStockMaterials}</div>
            <p className="text-xs text-muted-foreground">Items unavailable</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Materials</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeMaterials}</div>
            <p className="text-xs text-muted-foreground">Currently in use</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Materials</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="filter-category">Category</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {materialCategories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="filter-status">Stock Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="in-stock">In Stock</SelectItem>
                  <SelectItem value="low-stock">Low Stock</SelectItem>
                  <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Materials Table */}
      <Card>
        <CardHeader>
          <CardTitle>Materials Inventory</CardTitle>
          <CardDescription>Manage your construction materials</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMaterials.map((material) => (
                <TableRow key={material.id}>
                  <TableCell>
                    <div className="font-medium">{material.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate text-sm text-gray-600">
                      {(material as any).description || "No description"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{material.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{material.location}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{material.current_stock}</span>
                      {getStockBadge(material)}
                    </div>
                    <div className="text-sm text-gray-500">Min: {material.min_stock}</div>
                  </TableCell>
                  <TableCell>{material.unit}</TableCell>
                  <TableCell>
                    <Badge variant={material.status === "Active" ? "default" : "secondary"}>{material.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewHistory(material)}>
                        <History className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(material)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(material)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredMaterials.length === 0 && (
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
            <DialogTitle>Material Usage History</DialogTitle>
            <DialogDescription>Complete transaction history for {selectedMaterial?.name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>Loading transaction history...</span>
              </div>
            ) : materialTransactions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Stock Change</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Created By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materialTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          {getTransactionIcon(transaction.transaction_type)}
                          {transaction.transaction_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={transaction.transaction_type === "used" ? "text-red-600" : "text-green-600"}>
                          {transaction.transaction_type === "used" ? "-" : "+"}
                          {transaction.quantity}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>
                            {transaction.previous_stock} → {transaction.new_stock}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {transaction.project && <Badge variant="secondary">{transaction.project}</Badge>}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={transaction.notes || ""}>
                          {transaction.notes}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">{transaction.created_by}</div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No transaction history found for this material.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Material</DialogTitle>
            <DialogDescription>Update material information</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="edit-unit">Unit *</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, unit: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitOptions.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
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
                placeholder="Enter material description (optional)"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                    {materialCategories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
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
                    {materialLocations.map((location) => (
                      <SelectItem key={location.id} value={location.name}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-current_stock">Current Stock</Label>
                <Input
                  id="edit-current_stock"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.current_stock || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, current_stock: Number.parseFloat(e.target.value) || 0 }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="edit-min_stock">Minimum Stock</Label>
                <Input
                  id="edit-min_stock"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.min_stock || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, min_stock: Number.parseFloat(e.target.value) || 0 }))
                  }
                />
              </div>
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
                  <SelectItem value="Discontinued">Discontinued</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleUpdateMaterial} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Material"
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
              This will permanently delete "{selectedMaterial?.name}" and all its data. This action cannot be undone.
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

      {/* Categories & Locations Management Dialog */}
      <Dialog open={showCategoriesDialog} onOpenChange={setShowCategoriesDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Categories & Locations</DialogTitle>
            <DialogDescription>Manage material categories and storage locations</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Categories Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Categories</h3>

              <div className="flex gap-2">
                <Input
                  placeholder="Enter category name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
                />
                <Button onClick={handleAddCategory} disabled={loadingCategories}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {loadingCategories ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-gray-500">Loading categories...</span>
                  </div>
                ) : materialCategories.length > 0 ? (
                  materialCategories.map((category) => (
                    <div key={category.id} className="flex justify-between items-center p-2 border rounded">
                      <span>{category.name}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
                        disabled={loadingCategories}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No categories found. Add your first category above.</p>
                )}
              </div>
            </div>

            {/* Locations Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Locations</h3>

              <div className="flex gap-2">
                <Input
                  placeholder="Enter location name"
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddLocation()}
                />
                <Button onClick={handleAddLocation} disabled={loadingCategories}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {loadingCategories ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-gray-500">Loading locations...</span>
                  </div>
                ) : materialLocations.length > 0 ? (
                  materialLocations.map((location) => (
                    <div key={location.id} className="flex justify-between items-center p-2 border rounded">
                      <span>{location.name}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteLocation(location.id)}
                        disabled={loadingCategories}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No locations found. Add your first location above.</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setShowCategoriesDialog(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
