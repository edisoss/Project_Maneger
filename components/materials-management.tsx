"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import {
  Package,
  Warehouse,
  ArrowRightLeft,
  Search,
  Building2,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Boxes,
  AlertCircle,
  Database,
  Loader2,
  Edit,
  Trash2,
  History,
  Plus,
  Minus,
} from "lucide-react"
import {
  getMaterialsByProject,
  getProjects,
  transferMaterial,
  updateMaterial,
  deleteMaterial,
  getMaterialTransactions,
  getMaterialTransfers,
  addMaterialTransaction,
  type Material,
  type Project,
  type MaterialTransaction,
  type MaterialTransfer,
} from "@/lib/database"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function MaterialsManagement() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string>("storage")
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [transferDialogOpen, setTransferDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [quantityDialogOpen, setQuantityDialogOpen] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [transferDestination, setTransferDestination] = useState<string>("")
  const [transferNotes, setTransferNotes] = useState("")
  const [transferQuantity, setTransferQuantity] = useState<number>(0)
  const [migrationError, setMigrationError] = useState(false)
  const [runningMigration, setRunningMigration] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Material>>({})
  const [quantityAdjustment, setQuantityAdjustment] = useState<number>(0)
  const [quantityNotes, setQuantityNotes] = useState("")
  const [materialHistory, setMaterialHistory] = useState<{
    transactions: MaterialTransaction[]
    transfers: MaterialTransfer[]
  }>({ transactions: [], transfers: [] })
  const [loadingHistory, setLoadingHistory] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    if (projects.length > 0 || selectedLocation === "storage") {
      loadMaterials()
    }
  }, [selectedLocation, projects])

  async function loadProjects() {
    setLoading(true)
    try {
      const projectsData = await getProjects()
      setProjects(projectsData)
    } catch (error) {
      console.error("Error loading projects:", error)
      toast({
        title: "Error",
        description: "Failed to load projects data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function loadMaterials() {
    setLoading(true)
    setMigrationError(false)
    try {
      console.log("[v0] Loading materials for location:", selectedLocation)
      let materialsData: Material[]
      if (selectedLocation === "storage") {
        console.log("[v0] Querying materials with project_id = NULL")
        materialsData = await getMaterialsByProject(null)
      } else {
        console.log("[v0] Querying materials for project:", selectedLocation)
        materialsData = await getMaterialsByProject(selectedLocation)
      }
      console.log("[v0] Materials loaded:", materialsData.length, materialsData)
      setMaterials(materialsData)
    } catch (error) {
      console.error("[v0] Error loading materials:", error)
      if (error instanceof Error && error.message.includes("project_id does not exist")) {
        setMigrationError(true)
        setMaterials([])
      } else {
        toast({
          title: "Error",
          description: "Failed to load materials data",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  async function runMigration() {
    setRunningMigration(true)
    try {
      const response = await fetch("/api/run-migration", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Migration Successful",
          description: "Database schema has been updated. Refreshing materials...",
        })
        setMigrationError(false)
        await loadMaterials()
      } else {
        toast({
          title: "Migration Failed",
          description: data.error || "An error occurred during migration",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Migration error:", error)
      toast({
        title: "Migration Failed",
        description: "Could not connect to the server",
        variant: "destructive",
      })
    } finally {
      setRunningMigration(false)
    }
  }

  const filteredMaterials = materials.filter(
    (material) =>
      material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  function handleTransferClick(material: Material) {
    setSelectedMaterial(material)
    setTransferDestination("")
    setTransferNotes("")
    setTransferQuantity(material.current_stock)
    setTransferDialogOpen(true)
  }

  async function handleTransfer() {
    if (!selectedMaterial) return

    if (transferQuantity <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Transfer quantity must be greater than 0",
        variant: "destructive",
      })
      return
    }

    if (transferQuantity > selectedMaterial.current_stock) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${selectedMaterial.current_stock} ${selectedMaterial.unit} available`,
        variant: "destructive",
      })
      return
    }

    const toProjectId = transferDestination === "storage" ? null : transferDestination
    const fromProjectId = selectedMaterial.project_id

    try {
      const success = await transferMaterial({
        material_id: selectedMaterial.id,
        from_project_id: fromProjectId,
        to_project_id: toProjectId,
        quantity: transferQuantity,
        notes: transferNotes,
      })

      if (success) {
        toast({
          title: "Success",
          description: `${transferQuantity} ${selectedMaterial.unit} transferred successfully`,
        })
        setTransferDialogOpen(false)
        loadMaterials()
      } else {
        toast({
          title: "Error",
          description: "Failed to transfer material",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Transfer error:", error)
      toast({
        title: "Error",
        description: "An error occurred during transfer",
        variant: "destructive",
      })
    }
  }

  function handleEditClick(material: Material) {
    setSelectedMaterial(material)
    setEditForm({
      name: material.name,
      category: material.category,
      description: material.description,
      unit: material.unit,
      min_stock: material.min_stock,
      location: material.location,
    })
    setEditDialogOpen(true)
  }

  async function handleEditSave() {
    if (!selectedMaterial) return

    try {
      const updated = await updateMaterial(selectedMaterial.id, editForm)
      if (updated) {
        toast({
          title: "Success",
          description: "Material updated successfully",
        })
        setEditDialogOpen(false)
        loadMaterials()
      } else {
        toast({
          title: "Error",
          description: "Failed to update material",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Edit error:", error)
      toast({
        title: "Error",
        description: "An error occurred while updating",
        variant: "destructive",
      })
    }
  }

  async function handleDelete(material: Material) {
    if (!confirm(`Are you sure you want to delete ${material.name}? This action cannot be undone.`)) {
      return
    }

    try {
      const success = await deleteMaterial(material.id)
      if (success) {
        toast({
          title: "Success",
          description: "Material deleted successfully",
        })
        loadMaterials()
      } else {
        toast({
          title: "Error",
          description: "Failed to delete material",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Delete error:", error)
      toast({
        title: "Error",
        description: "An error occurred while deleting",
        variant: "destructive",
      })
    }
  }

  function handleQuantityClick(material: Material) {
    setSelectedMaterial(material)
    setQuantityAdjustment(0)
    setQuantityNotes("")
    setQuantityDialogOpen(true)
  }

  async function handleQuantityAdjustment() {
    if (!selectedMaterial) return

    if (quantityAdjustment === 0) {
      toast({
        title: "Invalid Adjustment",
        description: "Adjustment cannot be zero",
        variant: "destructive",
      })
      return
    }

    const newStock = selectedMaterial.current_stock + quantityAdjustment

    if (newStock < 0) {
      toast({
        title: "Invalid Stock",
        description: "Stock cannot be negative",
        variant: "destructive",
      })
      return
    }

    try {
      const updated = await updateMaterial(selectedMaterial.id, {
        current_stock: newStock,
      })

      if (updated) {
        // Record the transaction
        await addMaterialTransaction({
          material_id: selectedMaterial.id,
          transaction_type: quantityAdjustment > 0 ? "added" : "adjusted",
          quantity: Math.abs(quantityAdjustment),
          previous_stock: selectedMaterial.current_stock,
          new_stock: newStock,
          reference_type: "manual_adjustment",
          notes: quantityNotes || `Manual ${quantityAdjustment > 0 ? "addition" : "adjustment"}`,
          created_by: "admin@company.com",
        })

        toast({
          title: "Success",
          description: `Stock ${quantityAdjustment > 0 ? "increased" : "decreased"} by ${Math.abs(quantityAdjustment)} ${selectedMaterial.unit}`,
        })
        setQuantityDialogOpen(false)
        loadMaterials()
      } else {
        toast({
          title: "Error",
          description: "Failed to adjust quantity",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Quantity adjustment error:", error)
      toast({
        title: "Error",
        description: "An error occurred while adjusting quantity",
        variant: "destructive",
      })
    }
  }

  async function handleHistoryClick(material: Material) {
    setSelectedMaterial(material)
    setHistoryDialogOpen(true)
    setLoadingHistory(true)

    try {
      const [transactions, transfers] = await Promise.all([
        getMaterialTransactions(material.id),
        getMaterialTransfers(material.id),
      ])

      setMaterialHistory({ transactions, transfers })
    } catch (error) {
      console.error("Error loading history:", error)
      toast({
        title: "Error",
        description: "Failed to load material history",
        variant: "destructive",
      })
    } finally {
      setLoadingHistory(false)
    }
  }

  function getStockStatus(material: Material) {
    if (material.current_stock === 0) {
      return { icon: AlertTriangle, color: "text-red-500", label: "Out of Stock", variant: "destructive" as const }
    } else if (material.current_stock <= material.min_stock) {
      return { icon: TrendingDown, color: "text-orange-500", label: "Low Stock", variant: "secondary" as const }
    } else {
      return { icon: CheckCircle2, color: "text-green-500", label: "In Stock", variant: "default" as const }
    }
  }

  const selectedLocationName =
    selectedLocation === "storage"
      ? "Central Storage"
      : projects.find((p) => p.id === selectedLocation)?.name || "Unknown Location"

  if (migrationError) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Database Migration Required</AlertTitle>
          <AlertDescription>
            The materials table needs to be updated to support project-based inventory tracking. Click the button below
            to run the migration automatically.
          </AlertDescription>
        </Alert>
        <Card>
          <CardHeader>
            <CardTitle>Run Database Migration</CardTitle>
            <CardDescription>
              This will add the project_id column to your materials table and create the material_transfers tracking
              table. All existing materials will be moved to Central Storage.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={runMigration} disabled={runningMigration} size="lg">
              {runningMigration ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Migration...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Run Database Migration
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <Boxes className="h-6 w-6 mr-3 text-blue-600" />
            Material Inventory Management
          </CardTitle>
          <CardDescription className="text-base">
            Select a location to view and manage materials. Start with Storage to see unassigned materials.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="location" className="text-base font-medium mb-2 block">
              Select Location
            </Label>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger id="location" className="w-full h-12 text-base bg-white">
                <SelectValue>
                  <div className="flex items-center">
                    {selectedLocation === "storage" ? (
                      <>
                        <Warehouse className="mr-3 h-5 w-5 text-blue-600" />
                        <span className="font-medium">Central Storage</span>
                      </>
                    ) : (
                      <>
                        <Building2 className="mr-3 h-5 w-5 text-indigo-600" />
                        <span className="font-medium">{selectedLocationName}</span>
                      </>
                    )}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="storage">
                  <div className="flex items-center py-1">
                    <Warehouse className="mr-3 h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-medium">Central Storage</div>
                      <div className="text-xs text-muted-foreground">Materials not assigned to any project</div>
                    </div>
                  </div>
                </SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex items-center py-1">
                      <Building2 className="mr-3 h-5 w-5 text-indigo-600" />
                      <div>
                        <div className="font-medium">{project.name}</div>
                        <div className="text-xs text-muted-foreground">{project.type}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-blue-200">
            <div className="flex items-center space-x-3">
              {selectedLocation === "storage" ? (
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Warehouse className="h-6 w-6 text-white" />
                </div>
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-lg">{selectedLocationName}</h3>
                <p className="text-sm text-muted-foreground">
                  {materials.length} material{materials.length !== 1 ? "s" : ""} at this location
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="text-base px-4 py-2">
              {materials.length} Items
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search materials by name or category..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Materials Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground animate-pulse" />
            <p className="mt-2 text-sm text-muted-foreground">Loading materials...</p>
          </div>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No materials found</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? "Try adjusting your search"
                : selectedLocation === "storage"
                  ? "No materials in storage. Materials are either assigned to projects or haven't been added yet."
                  : "No materials assigned to this project. Transfer materials from storage to get started."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMaterials.map((material) => {
            const status = getStockStatus(material)
            const StatusIcon = status.icon

            return (
              <Card key={material.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base">{material.name}</CardTitle>
                      <CardDescription>{material.category}</CardDescription>
                    </div>
                    <StatusIcon className={`h-5 w-5 ${status.color}`} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Stock</span>
                    <span className="text-lg font-bold">
                      {material.current_stock} {material.unit}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={status.variant}>{status.label}</Badge>
                    {material.project_id && (
                      <Badge variant="outline">
                        <Building2 className="mr-1 h-3 w-3" />
                        Assigned
                      </Badge>
                    )}
                    {!material.project_id && (
                      <Badge variant="outline">
                        <Warehouse className="mr-1 h-3 w-3" />
                        Storage
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditClick(material)}>
                      <Edit className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleQuantityClick(material)}>
                      <Plus className="mr-1 h-3 w-3" />
                      Adjust
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleHistoryClick(material)}>
                      <History className="mr-1 h-3 w-3" />
                      History
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleTransferClick(material)}>
                      <ArrowRightLeft className="mr-1 h-3 w-3" />
                      Transfer
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="col-span-2 text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                      onClick={() => handleDelete(material)}
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Delete Material
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Transfer Dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Transfer Material</DialogTitle>
            <DialogDescription>Move {selectedMaterial?.name} to a different project or storage</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Location</Label>
              <div className="flex items-center gap-2 rounded-lg border p-3">
                {selectedMaterial?.project_id ? (
                  <>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {projects.find((p) => p.id === selectedMaterial.project_id)?.name || "Unknown Project"}
                    </span>
                  </>
                ) : (
                  <>
                    <Warehouse className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Central Storage</span>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination">Transfer To</Label>
              <Select value={transferDestination} onValueChange={setTransferDestination}>
                <SelectTrigger id="destination">
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="storage">
                    <div className="flex items-center">
                      <Warehouse className="mr-2 h-4 w-4" />
                      Central Storage
                    </div>
                  </SelectItem>
                  {projects
                    .filter((p) => p.id !== selectedMaterial?.project_id)
                    .map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        <div className="flex items-center">
                          <Building2 className="mr-2 h-4 w-4" />
                          {project.name}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity to Transfer</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={selectedMaterial?.current_stock || 0}
                value={transferQuantity}
                onChange={(e) => setTransferQuantity(Math.max(0, Number.parseInt(e.target.value) || 0))}
                placeholder="Enter quantity"
              />
              <p className="text-xs text-muted-foreground">
                Available: {selectedMaterial?.current_stock || 0} {selectedMaterial?.unit}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add transfer notes..."
                value={transferNotes}
                onChange={(e) => setTransferNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={
                !transferDestination ||
                transferQuantity <= 0 ||
                transferQuantity > (selectedMaterial?.current_stock || 0)
              }
            >
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Transfer Material
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Material</DialogTitle>
            <DialogDescription>Update material details</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editForm.name || ""}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Input
                id="edit-category"
                value={editForm.category || ""}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description || ""}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-unit">Unit</Label>
                <Input
                  id="edit-unit"
                  value={editForm.unit || ""}
                  onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-min-stock">Min Stock</Label>
                <Input
                  id="edit-min-stock"
                  type="number"
                  value={editForm.min_stock || 0}
                  onChange={(e) => setEditForm({ ...editForm, min_stock: Number.parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={editForm.location || ""}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSave}>
              <Edit className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={quantityDialogOpen} onOpenChange={setQuantityDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adjust Quantity</DialogTitle>
            <DialogDescription>Add or remove stock for {selectedMaterial?.name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <span className="text-sm font-medium">Current Stock:</span>
              <span className="text-lg font-bold">
                {selectedMaterial?.current_stock} {selectedMaterial?.unit}
              </span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adjustment">Adjustment Amount</Label>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => setQuantityAdjustment((prev) => prev - 1)}>
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  id="adjustment"
                  type="number"
                  value={quantityAdjustment}
                  onChange={(e) => setQuantityAdjustment(Number.parseInt(e.target.value) || 0)}
                  className="text-center"
                />
                <Button variant="outline" size="icon" onClick={() => setQuantityAdjustment((prev) => prev + 1)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                New stock: {(selectedMaterial?.current_stock || 0) + quantityAdjustment} {selectedMaterial?.unit}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="qty-notes">Notes</Label>
              <Textarea
                id="qty-notes"
                placeholder="Reason for adjustment..."
                value={quantityNotes}
                onChange={(e) => setQuantityNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setQuantityDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleQuantityAdjustment} disabled={quantityAdjustment === 0}>
              {quantityAdjustment > 0 ? (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Stock
                </>
              ) : (
                <>
                  <Minus className="mr-2 h-4 w-4" />
                  Remove Stock
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Material History</DialogTitle>
            <DialogDescription>
              Complete transaction and transfer history for {selectedMaterial?.name}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="transactions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="transfers">Transfers</TabsTrigger>
            </TabsList>

            <TabsContent value="transactions" className="space-y-4 max-h-[400px] overflow-y-auto">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : materialHistory.transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No transactions found</p>
                </div>
              ) : (
                materialHistory.transactions.map((transaction) => (
                  <Card key={transaction.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                transaction.transaction_type === "added"
                                  ? "default"
                                  : transaction.transaction_type === "used"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {transaction.transaction_type}
                            </Badge>
                            <span className="font-medium">{transaction.quantity} units</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {transaction.previous_stock} → {transaction.new_stock}
                          </p>
                          {transaction.notes && <p className="text-sm">{transaction.notes}</p>}
                          {transaction.project && (
                            <p className="text-xs text-muted-foreground">{transaction.project}</p>
                          )}
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleDateString()}
                          <br />
                          {new Date(transaction.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="transfers" className="space-y-4 max-h-[400px] overflow-y-auto">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : materialHistory.transfers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ArrowRightLeft className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No transfers found</p>
                </div>
              ) : (
                materialHistory.transfers.map((transfer) => (
                  <Card key={transfer.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{transfer.transfer_type}</Badge>
                            <span className="font-medium">{transfer.quantity} units</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">
                              {transfer.from_project_id
                                ? projects.find((p) => p.id === transfer.from_project_id)?.name || "Unknown"
                                : "Storage"}
                            </span>
                            <ArrowRightLeft className="h-3 w-3" />
                            <span className="text-muted-foreground">
                              {transfer.to_project_id
                                ? projects.find((p) => p.id === transfer.to_project_id)?.name || "Unknown"
                                : "Storage"}
                            </span>
                          </div>
                          {transfer.notes && <p className="text-sm">{transfer.notes}</p>}
                          {transfer.transferred_by && (
                            <p className="text-xs text-muted-foreground">By: {transfer.transferred_by}</p>
                          )}
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          {new Date(transfer.transferred_at).toLocaleDateString()}
                          <br />
                          {new Date(transfer.transferred_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setHistoryDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
