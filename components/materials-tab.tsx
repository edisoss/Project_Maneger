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
import { Plus, Edit, Trash2, Package, AlertTriangle, CheckCircle, Settings, Loader2, Search, History, Calendar, RotateCcw, Eye, RefreshCw, PackageOpen, PackagePlus, User, FileText, Building, ArrowRight } from 'lucide-react'
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
import { MaterialPDFExport } from "./material-pdf-export"

interface MaterialsTabProps {
  materials: Material[]
  setMaterials: (materials: Material[]) => void
  materialCategories: MaterialCategory[]
  setMaterialCategories: (categories: MaterialCategory[]) => void
  materialLocations: MaterialLocation[]
  setMaterialLocations: (locations: MaterialLocation[]) => void
  logActivity: (activity: Omit<Activity, "id" | "timestamp">) => void
  isAdmin: boolean
}

export default function MaterialsTab({
  materials = [],
  setMaterials = () => {},
  materialCategories = [],
  setMaterialCategories = () => {},
  materialLocations = [],
  setMaterialLocations = () => {},
  logActivity,
  isAdmin,
}: MaterialsTabProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showCategoriesDialog, setShowCategoriesDialog] = useState(false)
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
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

  const [showTopUpDialog, setShowTopUpDialog] = useState(false)
  const [topUpQuantity, setTopUpQuantity] = useState(0)

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

      // If no categories exist, show a helpful message
      if (categoriesData.length === 0) {
        console.log("No categories found - you may need to run the SQL script to create default categories")
        toast({
          title: "No Categories Found",
          description: "Please run the SQL script to create default material categories.",
          variant: "destructive",
        })
      }

      // If no locations exist, show a helpful message
      if (locationsData.length === 0) {
        console.log("No locations found - you may need to run the SQL script to create default locations")
        toast({
          title: "No Locations Found",
          description: "Please run the SQL script to create default material locations.",
          variant: "destructive",
        })
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
    if (!isAdmin) {
      toast({ title: "Access Denied", description: "Only administrators can add materials", variant: "destructive" })
      return
    }

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

      // Log activity immediately after successful creation
      console.log("Logging activity for new material:", newMaterial.name)
      logActivity({
        type: "material",
        title: "Material Added",
        description: `New material "${newMaterial.name}" was added to inventory with ${newMaterial.current_stock} ${newMaterial.unit}.`,
        icon: "Plus",
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

  const handleView = (material: Material) => {
    setSelectedMaterial(material)
    setShowViewDialog(true)
  }

  const handleUpdateMaterial = async () => {
    if (!isAdmin) {
      toast({ title: "Access Denied", description: "Only administrators can edit materials", variant: "destructive" })
      return
    }

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

      // Log activity immediately after successful update
      console.log("Logging activity for updated material:", updatedMaterial.name)
      logActivity({
        type: "material",
        title: "Material Updated",
        description: `Material "${updatedMaterial.name}" was updated. Current stock: ${updatedMaterial.current_stock} ${updatedMaterial.unit}.`,
        icon: "Edit",
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
    if (!isAdmin) {
      toast({ title: "Access Denied", description: "Only administrators can delete materials", variant: "destructive" })
      return
    }
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

      // Log activity immediately after successful deletion
      console.log("Logging activity for deleted material:", selectedMaterial.name)
      logActivity({
        type: "material",
        title: "Material Deleted",
        description: `Material "${selectedMaterial.name}" was permanently deleted from inventory.`,
        icon: "Trash2",
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
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only administrators can manage categories",
        variant: "destructive",
      })
      return
    }

    if (!newCategoryName.trim()) {
      toast({ title: "Error", description: "Please enter a category name", variant: "destructive" })
      return
    }

    try {
      console.log("Adding new category:", newCategoryName.trim())
      const newCategory = await addMaterialCategory(newCategoryName.trim())
      if (newCategory) {
        console.log("Category added successfully:", newCategory)
        setMaterialCategories([...materialCategories, newCategory])
        setNewCategoryName("")
        toast({ title: "Success", description: "Category added successfully!" })

        // Log activity for category creation
        logActivity({
          type: "material",
          title: "Category Added",
          description: `New material category "${newCategory.name}" was created.`,
          icon: "Plus",
          variant: "default",
        })
      }
    } catch (error) {
      console.error("Error adding category:", error)
      toast({
        title: "Error",
        description: `Failed to add category: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      })
    }
  }

  const handleAddLocation = async () => {
    if (!isAdmin) {
      toast({ title: "Access Denied", description: "Only administrators can manage locations", variant: "destructive" })
      return
    }

    if (!newLocationName.trim()) {
      toast({ title: "Error", description: "Please enter a location name", variant: "destructive" })
      return
    }

    try {
      console.log("Adding new location:", newLocationName.trim())
      const newLocation = await addMaterialLocation(newLocationName.trim())
      if (newLocation) {
        console.log("Location added successfully:", newLocation)
        setMaterialLocations([...materialLocations, newLocation])
        setNewLocationName("")
        toast({ title: "Success", description: "Location added successfully!" })

        // Log activity for location creation
        logActivity({
          type: "material",
          title: "Location Added",
          description: `New material location "${newLocation.name}" was created.`,
          icon: "Plus",
          variant: "default",
        })
      }
    } catch (error) {
      console.error("Error adding location:", error)
      toast({
        title: "Error",
        description: `Failed to add location: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      })
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only administrators can manage categories",
        variant: "destructive",
      })
      return
    }

    // Check if category is in use
    const categoryToDelete = materialCategories.find((c) => c.id === categoryId)
    if (!categoryToDelete) return

    const isInUse = materials.some((material) => material.category === categoryToDelete.name)
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

        // Log activity for category deletion
        logActivity({
          type: "material",
          title: "Category Deleted",
          description: `Material category "${categoryToDelete.name}" was deleted.`,
          icon: "Trash2",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting category:", error)
      toast({ title: "Error", description: "Failed to delete category", variant: "destructive" })
    }
  }

  const handleDeleteLocation = async (locationId: string) => {
    if (!isAdmin) {
      toast({ title: "Access Denied", description: "Only administrators can manage locations", variant: "destructive" })
      return
    }

    // Check if location is in use
    const locationToDelete = materialLocations.find((l) => l.id === locationId)
    if (!locationToDelete) return

    const isInUse = materials.some((material) => material.location === locationToDelete.name)
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

        // Log activity for location deletion
        logActivity({
          type: "material",
          title: "Location Deleted",
          description: `Material location "${locationToDelete.name}" was deleted.`,
          icon: "Trash2",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting location:", error)
      toast({ title: "Error", description: "Failed to delete location", variant: "destructive" })
    }
  }

  const getStockStatus = (material: Material) => {
    if (material.current_stock <= 0) {
      return { status: "Out of Stock", variant: "destructive" as const, icon: AlertTriangle }
    } else if (material.current_stock <= material.min_stock) {
      return { status: "Low Stock", variant: "outline" as const, icon: AlertTriangle }
    } else {
      return { status: "In Stock", variant: "default" as const, icon: CheckCircle }
    }
  }

  // Get transaction type details for better visual representation
  const getTransactionTypeDetails = (transaction: MaterialTransaction) => {
    const type = transaction.transaction_type

    switch (type) {
      case "added":
        return {
          label: "Stock Added",
          icon: PackagePlus,
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          badgeVariant: "default" as const,
          description: "Material added to inventory",
        }
      case "used":
        return {
          label: "Material Issued",
          icon: PackageOpen,
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          badgeVariant: "destructive" as const,
          description: "Material issued for work",
        }
      case "returned":
        return {
          label: "Material Returned",
          icon: RefreshCw,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          badgeVariant: "secondary" as const,
          description: "Material returned to inventory",
        }
      case "adjusted":
        return {
          label: "Stock Adjusted",
          icon: RotateCcw,
          color: "text-orange-600",
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200",
          badgeVariant: "outline" as const,
          description: "Manual stock adjustment",
        }
      default:
        return {
          label: "Unknown",
          icon: Package,
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          badgeVariant: "outline" as const,
          description: "Unknown transaction type",
        }
    }
  }

  const handleTopUp = (material: Material) => {
    setSelectedMaterial(material)
    setTopUpQuantity(0)
    setShowTopUpDialog(true)
  }

  const handleConfirmTopUp = async () => {
    if (!selectedMaterial || topUpQuantity <= 0) {
      toast({ title: "Error", description: "Please enter a valid quantity", variant: "destructive" })
      return
    }

    if (!isAdmin) {
      toast({ title: "Access Denied", description: "Only administrators can top up materials", variant: "destructive" })
      return
    }

    try {
      setSaving(true)

      const newStock = selectedMaterial.current_stock + topUpQuantity
      const updatedMaterial = await updateMaterial(selectedMaterial.id, { current_stock: newStock })

      if (!updatedMaterial) {
        toast({ title: "Error", description: "Failed to top up material", variant: "destructive" })
        return
      }

      // Log activity for top-up
      logActivity({
        type: "material",
        title: "Material Topped Up",
        description: `${topUpQuantity} ${selectedMaterial.unit} added to "${selectedMaterial.name}". New stock: ${newStock} ${selectedMaterial.unit}`,
        icon: "Plus",
        variant: "default",
      })

      setMaterials(materials.map((material) => (material.id === selectedMaterial.id ? updatedMaterial : material)))
      setShowTopUpDialog(false)
      setSelectedMaterial(null)
      setTopUpQuantity(0)
      toast({ title: "Success", description: "Material topped up successfully!" })
    } catch (error) {
      console.error("Error topping up material:", error)
      toast({ title: "Error", description: "Error topping up material", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  // Filter materials based on search and filters
  const filteredMaterials = materials.filter((material) => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === "all" || material.category === filterCategory
    const stockStatus = getStockStatus(material)
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "in-stock" && stockStatus.status === "In Stock") ||
      (filterStatus === "low-stock" && stockStatus.status === "Low Stock") ||
      (filterStatus === "out-of-stock" && stockStatus.status === "Out of Stock")

    return matchesSearch && matchesCategory && matchesStatus
  })

  // Calculate statistics
  const totalMaterials = materials.length
  const lowStockMaterials = materials.filter((m) => m.current_stock <= m.min_stock && m.current_stock > 0).length
  const outOfStockMaterials = materials.filter((m) => m.current_stock <= 0).length
  const totalCategories = materialCategories.length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Materials Management</h2>
          <p className="text-gray-600">
            Track and manage your construction materials inventory
            {!isAdmin && " (View Only)"}
          </p>
        </div>
        <div className="flex gap-2">
          <MaterialPDFExport materials={materials} projects={[]} />
          {isAdmin && (
            <Button variant="outline" onClick={() => setShowCategoriesDialog(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Manage Categories
            </Button>
          )}
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
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Enter material description"
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="current_stock">Current Stock *</Label>
                      <Input
                        id="current_stock"
                        type="number"
                        min="0"
                        value={formData.current_stock}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, current_stock: Number.parseFloat(e.target.value) || 0 }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="min_stock">Minimum Stock *</Label>
                      <Input
                        id="min_stock"
                        type="number"
                        min="0"
                        value={formData.min_stock}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, min_stock: Number.parseFloat(e.target.value) || 0 }))
                        }
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
          )}
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
            <p className="text-xs text-muted-foreground">Need restocking</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outOfStockMaterials}</div>
            <p className="text-xs text-muted-foreground">Urgent attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Package className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{totalCategories}</div>
            <p className="text-xs text-muted-foreground">Material types</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Material Inventory</CardTitle>
          <CardDescription>
            {isAdmin ? "Manage your construction materials" : "View your construction materials"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search materials..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
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
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="in-stock">In Stock</SelectItem>
                <SelectItem value="low-stock">Low Stock</SelectItem>
                <SelectItem value="out-of-stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Min Stock</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMaterials.map((material) => {
                const stockStatus = getStockStatus(material)
                const StockIcon = stockStatus.icon
                return (
                  <TableRow key={material.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{material.name}</div>
                        <div className="text-sm text-gray-500">{(material as any).description || "No description"}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{material.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {material.current_stock} {material.unit}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {material.min_stock} {material.unit}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{material.location}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={stockStatus.variant} className="flex items-center gap-1 w-fit">
                        <StockIcon className="h-3 w-3" />
                        {stockStatus.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {isAdmin && (
                          <Button variant="outline" size="sm" onClick={() => handleTopUp(material)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => handleView(material)}>
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleViewHistory(material)}>
                          <History className="h-3 w-3" />
                        </Button>
                        {isAdmin && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => handleEdit(material)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete(material)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          {filteredMaterials.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {materials.length === 0
                  ? isAdmin
                    ? "No materials found. Add your first material to get started!"
                    : "No materials available to view."
                  : "No materials match your current filters."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Material Details</DialogTitle>
            <DialogDescription>View material information</DialogDescription>
          </DialogHeader>
          {selectedMaterial && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Material Name</Label>
                  <p className="text-sm text-gray-600">{selectedMaterial.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Category</Label>
                  <div className="mt-1">
                    <Badge variant="outline">{selectedMaterial.category}</Badge>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm text-gray-600">
                  {(selectedMaterial as any).description || "No description provided"}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Current Stock</Label>
                  <p className="text-sm text-gray-600">
                    {selectedMaterial.current_stock} {selectedMaterial.unit}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Minimum Stock</Label>
                  <p className="text-sm text-gray-600">
                    {selectedMaterial.min_stock} {selectedMaterial.unit}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Unit</Label>
                  <p className="text-sm text-gray-600">{selectedMaterial.unit}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Location</Label>
                <p className="text-sm text-gray-600">{selectedMaterial.location}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <div className="mt-1">
                  {(() => {
                    const stockStatus = getStockStatus(selectedMaterial)
                    const StockIcon = stockStatus.icon
                    return (
                      <Badge variant={stockStatus.variant} className="flex items-center gap-1 w-fit">
                        <StockIcon className="h-3 w-3" />
                        {stockStatus.status}
                      </Badge>
                    )
                  })()}
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={() => setShowViewDialog(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {isAdmin && (
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
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Enter material description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-current_stock">Current Stock *</Label>
                  <Input
                    id="edit-current_stock"
                    type="number"
                    min="0"
                    value={formData.current_stock}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, current_stock: Number.parseFloat(e.target.value) || 0 }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-min_stock">Minimum Stock *</Label>
                  <Input
                    id="edit-min_stock"
                    type="number"
                    min="0"
                    value={formData.min_stock}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, min_stock: Number.parseFloat(e.target.value) || 0 }))
                    }
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
      )}

      {/* Delete Confirmation Dialog */}
      {isAdmin && (
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
      )}

      {/* Material History Dialog - Enhanced with Visual Indicators */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Material Transaction History
            </DialogTitle>
            <DialogDescription>
              Complete transaction history for <strong>{selectedMaterial?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {loadingHistory ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : materialTransactions.length > 0 ? (
              <div className="space-y-3">
                {materialTransactions.map((transaction) => {
                  const typeDetails = getTransactionTypeDetails(transaction)
                  const TypeIcon = typeDetails.icon

                  return (
                    <div
                      key={transaction.id}
                      className={`p-4 rounded-lg border-l-4 ${typeDetails.bgColor} ${typeDetails.borderColor} transition-all hover:shadow-sm`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {/* Transaction Type Icon and Badge */}
                          <div className="flex flex-col items-center gap-2">
                            <div
                              className={`p-2 rounded-full ${typeDetails.bgColor} border ${typeDetails.borderColor}`}
                            >
                              <TypeIcon className={`h-4 w-4 ${typeDetails.color}`} />
                            </div>
                            <Badge variant={typeDetails.badgeVariant} className="text-xs">
                              {typeDetails.label}
                            </Badge>
                          </div>

                          {/* Transaction Details */}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className={`font-medium ${typeDetails.color}`}>{typeDetails.label}</h4>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Calendar className="h-3 w-3" />
                                {new Date(transaction.created_at).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </div>

                            {/* Quantity Change */}
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">Quantity:</span>
                                <span className={`font-semibold ${typeDetails.color}`}>
                                  {transaction.transaction_type === "added"
                                    ? "+"
                                    : transaction.transaction_type === "used"
                                      ? "-"
                                      : transaction.transaction_type === "returned"
                                        ? "+"
                                        : "±"}
                                  {transaction.quantity} {selectedMaterial?.unit}
                                </span>
                              </div>

                              {/* Stock Change Indicator */}
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-500">Stock:</span>
                                <span className="font-mono">
                                  {transaction.previous_stock}
                                  <ArrowRight className="h-3 w-3 inline mx-1" />
                                  {transaction.new_stock} {selectedMaterial?.unit}
                                </span>
                              </div>
                            </div>

                            {/* Additional Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              {transaction.project && (
                                <div className="flex items-center gap-2">
                                  <Building className="h-3 w-3 text-gray-400" />
                                  <span className="text-gray-600">Project:</span>
                                  <span className="font-medium">{transaction.project}</span>
                                </div>
                              )}

                              {transaction.created_by && (
                                <div className="flex items-center gap-2">
                                  <User className="h-3 w-3 text-gray-400" />
                                  <span className="text-gray-600">By:</span>
                                  <span className="font-medium">{transaction.created_by}</span>
                                </div>
                              )}
                            </div>

                            {/* Notes */}
                            {transaction.notes && (
                              <div className="flex items-start gap-2 mt-2">
                                <FileText className="h-3 w-3 text-gray-400 mt-0.5" />
                                <div>
                                  <span className="text-gray-600 text-sm">Notes:</span>
                                  <p className="text-sm text-gray-700 mt-1">{transaction.notes}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No transaction history available</p>
                <p className="text-gray-400 text-sm">
                  Transactions will appear here once materials are used or restocked.
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setShowHistoryDialog(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Categories & Locations Dialog */}
      {isAdmin && (
        <Dialog open={showCategoriesDialog} onOpenChange={setShowCategoriesDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Manage Categories & Locations</DialogTitle>
              <DialogDescription>Add or remove material categories and storage locations</DialogDescription>
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
                  {materialCategories.map((category) => (
                    <div key={category.id} className="flex justify-between items-center p-2 border rounded">
                      <span>{category.name}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
                        disabled={category.is_default}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {materialCategories.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No categories added yet</p>
                  )}
                </div>
              </div>

              {/* Locations Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Storage Locations</h3>

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
                  {materialLocations.map((location) => (
                    <div key={location.id} className="flex justify-between items-center p-2 border rounded">
                      <span>{location.name}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteLocation(location.id)}
                        disabled={location.is_default}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {materialLocations.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No locations added yet</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setShowCategoriesDialog(false)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Top Up Dialog */}
      {isAdmin && (
        <Dialog open={showTopUpDialog} onOpenChange={setShowTopUpDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Top Up Material</DialogTitle>
              <DialogDescription>Add stock to {selectedMaterial?.name}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Current Stock</Label>
                <p className="text-sm text-gray-600">
                  {selectedMaterial?.current_stock} {selectedMaterial?.unit}
                </p>
              </div>
              <div>
                <Label htmlFor="topup-quantity">Quantity to Add *</Label>
                <Input
                  id="topup-quantity"
                  type="number"
                  min="1"
                  value={topUpQuantity}
                  onChange={(e) => setTopUpQuantity(Number.parseFloat(e.target.value) || 0)}
                  placeholder="Enter quantity to add"
                />
              </div>
              {topUpQuantity > 0 && selectedMaterial && (
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm text-green-800">
                    New stock will be:{" "}
                    <strong>
                      {selectedMaterial.current_stock + topUpQuantity} {selectedMaterial.unit}
                    </strong>
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowTopUpDialog(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleConfirmTopUp} disabled={saving || topUpQuantity <= 0}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Stock"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
