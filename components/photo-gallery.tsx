"use client"

import type React from "react"
import JSZip from "jszip"
import {
  Download,
  X,
  Camera,
  Upload,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ImageIcon,
  Calendar,
} from "lucide-react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { uploadPhotoToBlob, deletePhotoFromBlob } from "@/app/actions/blob-actions"

interface Photo {
  id: string
  url: string
  caption?: string
  type?: "before" | "after" | "progress" | "issue" | "completed"
  file_name: string
  file_size: number
  uploaded_by: string
  uploaded_at: string
  created_at: string
  folder_path?: string
}

interface PhotoGalleryProps {
  photos: Photo[]
  onPhotosChange: () => void
  entityType: "project" | "daily_log"
  entityId: string
  isAdmin: boolean
  addPhotoFn: (photo: any) => Promise<any | null>
  deletePhotoFn: (photoId: string) => Promise<void>
  projectName?: string
  logDate?: string
  logId?: string // Added logId prop to include in folder structure
  canUpload?: boolean
  canDelete?: boolean
}

export default function PhotoGallery({
  photos,
  entityType,
  entityId,
  projectName,
  logDate,
  logId,
  addPhotoFn,
  deletePhotoFn,
  onPhotosChange,
  canUpload = false,
  canDelete = false,
}: PhotoGalleryProps) {
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [uploadData, setUploadData] = useState({
    caption: "",
    type: "progress" as Photo["type"],
  })
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 })
  const [filterType, setFilterType] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"grid" | "folders">("folders")
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const photoTypes = [
    { value: "before", label: "Before", color: "bg-blue-500" },
    { value: "after", label: "After", color: "bg-green-500" },
    { value: "progress", label: "Progress", color: "bg-yellow-500" },
    { value: "issue", label: "Issue", color: "bg-red-500" },
    { value: "completed", label: "Completed", color: "bg-purple-500" },
  ]

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    const validFiles: File[] = []
    const urls: string[] = []

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file",
          description: `${file.name} is not an image file`,
          variant: "destructive",
        })
        continue
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 10MB`,
          variant: "destructive",
        })
        continue
      }

      validFiles.push(file)
      urls.push(URL.createObjectURL(file))
    }

    setSelectedFiles(validFiles)
    setPreviewUrls(urls)
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return

    setUploading(true)
    setUploadProgress({ current: 0, total: selectedFiles.length })

    try {
      let successCount = 0
      let failCount = 0

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        setUploadProgress({ current: i + 1, total: selectedFiles.length })

        try {
          console.log(`[v0] Uploading file ${i + 1}/${selectedFiles.length}: ${file.name}`)
          const formData = new FormData()
          formData.append("file", file)

          let folderPath: string | undefined
          if (entityType === "daily_log" && projectName && logDate && logId) {
            const sanitizedProjectName = projectName.replace(/[^a-zA-Z0-9-_]/g, "_")
            const formattedDate = new Date(logDate).toISOString().split("T")[0]
            folderPath = `${sanitizedProjectName}/${formattedDate}/Log_${logId}`
          } else if (entityType === "project" && projectName) {
            const sanitizedProjectName = projectName.replace(/[^a-zA-Z0-9-_]/g, "_")
            folderPath = sanitizedProjectName
          }

          if (folderPath) {
            formData.append("folderPath", folderPath)
          }

          const result = await uploadPhotoToBlob(formData)

          if (!result.success) {
            throw new Error(result.error)
          }

          const photoData = {
            url: result.url!,
            caption: uploadData.caption || undefined,
            type: uploadData.type,
            file_name: file.name,
            file_size: file.size,
            uploaded_by: "Current User",
            folder_path: result.folderPath,
          }

          const photo = await addPhotoFn(photoData)

          if (photo) {
            successCount++
          } else {
            failCount++
          }
        } catch (error) {
          console.error(`[v0] Error uploading ${file.name}:`, error)
          failCount++
        }
      }

      // Show results
      if (successCount > 0) {
        toast({
          title: "Upload complete",
          description: `${successCount} photo${successCount > 1 ? "s" : ""} uploaded successfully${failCount > 0 ? `, ${failCount} failed` : ""}`,
        })
      }

      if (failCount > 0 && successCount === 0) {
        toast({
          title: "Upload failed",
          description: `Failed to upload ${failCount} photo${failCount > 1 ? "s" : ""}`,
          variant: "destructive",
        })
      }

      // Reset form
      setShowUploadDialog(false)
      setUploadData({ caption: "", type: "progress" })
      setSelectedFiles([])
      setPreviewUrls([])
      setUploadProgress({ current: 0, total: 0 })
      onPhotosChange()
    } catch (error) {
      console.error("[v0] Upload error:", error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An error occurred during upload",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (photoId: string, photoUrl: string) => {
    if (!confirm("Are you sure you want to delete this photo?")) return

    try {
      const result = await deletePhotoFromBlob(photoUrl)

      if (!result.success) {
        throw new Error(result.error)
      }

      await deletePhotoFn(photoId)

      toast({
        title: "Success",
        description: "Photo deleted successfully",
      })
      onPhotosChange()
      if (showViewDialog) {
        setShowViewDialog(false)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete photo",
        variant: "destructive",
      })
    }
  }

  const openViewer = (photo: Photo, index: number) => {
    setSelectedPhoto(photo)
    setSelectedPhotoIndex(index)
    setShowViewDialog(true)
  }

  const navigatePhoto = (direction: "prev" | "next") => {
    const newIndex = direction === "prev" ? selectedPhotoIndex - 1 : selectedPhotoIndex + 1
    if (newIndex >= 0 && newIndex < filteredPhotos.length) {
      setSelectedPhotoIndex(newIndex)
      setSelectedPhoto(filteredPhotos[newIndex])
    }
  }

  const filteredPhotos = filterType === "all" ? photos : photos.filter((p) => p.type === filterType)

  const photosByDateAndLog = filteredPhotos.reduce(
    (acc, photo) => {
      const urlParts = photo.url.split("/")
      // Extract folder structure from URL
      // Expected format: .../ProjectName/Date/LogID/filename.jpg
      const dateFolder = urlParts[urlParts.length - 3] // Date
      const logFolder = urlParts[urlParts.length - 2] // LogID

      if (dateFolder && dateFolder.match(/^\d{4}-\d{2}-\d{2}/)) {
        if (!acc[dateFolder]) {
          acc[dateFolder] = {}
        }

        const logKey = logFolder && logFolder.startsWith("Log_") ? logFolder : "Other"

        if (!acc[dateFolder][logKey]) {
          acc[dateFolder][logKey] = []
        }
        acc[dateFolder][logKey].push(photo)
      } else {
        // Fallback for photos without proper structure
        if (!acc["Other"]) {
          acc["Other"] = {}
        }
        if (!acc["Other"]["Uncategorized"]) {
          acc["Other"]["Uncategorized"] = []
        }
        acc["Other"]["Uncategorized"].push(photo)
      }

      return acc
    },
    {} as Record<string, Record<string, Photo[]>>,
  )

  const dateFolders = Object.keys(photosByDateAndLog).sort().reverse()

  const toggleFolder = (folder: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folder)) {
      newExpanded.delete(folder)
    } else {
      newExpanded.add(folder)
    }
    setExpandedFolders(newExpanded)
  }

  const beforePhotos = photos.filter((p) => p.type === "before")
  const afterPhotos = photos.filter((p) => p.type === "after")

  const downloadLogAsZip = async (dateFolder: string, logFolder: string, logPhotos: Photo[]) => {
    try {
      const zip = new JSZip()
      const folder = zip.folder(`${dateFolder}_${logFolder}`)

      if (!folder) return

      // Fetch and add each photo to the zip
      for (const photo of logPhotos) {
        try {
          const response = await fetch(photo.url)
          const blob = await response.blob()
          const filename = photo.file_name || `photo_${photo.id}.jpg`
          folder.file(filename, blob)
        } catch (error) {
          console.error(`[v0] Error downloading photo ${photo.id}:`, error)
        }
      }

      // Generate and download the zip file
      const zipBlob = await zip.generateAsync({ type: "blob" })
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${dateFolder}_${logFolder}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Success",
        description: "Photos downloaded successfully",
      })
    } catch (error) {
      console.error("[v0] Error creating zip:", error)
      toast({
        title: "Error",
        description: "Failed to download photos",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium">Photos</h3>
          <Badge variant="secondary">{photos.length}</Badge>
        </div>
        <div className="flex gap-2">
          {entityType === "project" && (
            <Select value={viewMode} onValueChange={(value: "grid" | "folders") => setViewMode(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="folders">By Folders</SelectItem>
                <SelectItem value="grid">All Photos</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {photoTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canUpload && (
            <Button onClick={() => setShowUploadDialog(true)}>
              <Camera className="h-4 w-4 mr-2" />
              Add Photo
            </Button>
          )}
        </div>
      </div>

      {beforePhotos.length > 0 && afterPhotos.length > 0 && (
        <div className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-green-50">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Before/After Comparison
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600 mb-2">Before ({beforePhotos.length})</p>
              <div
                className="aspect-video relative overflow-hidden rounded-md border-2 border-blue-300 cursor-pointer"
                onClick={() => openViewer(beforePhotos[0], photos.indexOf(beforePhotos[0]))}
              >
                <img
                  src={beforePhotos[0].url || "/placeholder.svg"}
                  alt="Before"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-2">After ({afterPhotos.length})</p>
              <div
                className="aspect-video relative overflow-hidden rounded-md border-2 border-green-300 cursor-pointer"
                onClick={() => openViewer(afterPhotos[0], photos.indexOf(afterPhotos[0]))}
              >
                <img
                  src={afterPhotos[0].url || "/placeholder.svg"}
                  alt="After"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {filteredPhotos.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <Camera className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500">
            {filterType === "all" ? "No photos uploaded yet" : `No ${filterType} photos found`}
          </p>
          {canUpload && (
            <Button className="mt-4 bg-transparent" variant="outline" onClick={() => setShowUploadDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload First Photo
            </Button>
          )}
        </div>
      ) : viewMode === "folders" && entityType === "project" ? (
        <div className="space-y-4">
          {/* Date folder header */}
          {dateFolders.map((dateFolder) => {
            const logFolders = Object.keys(photosByDateAndLog[dateFolder])
            const isDateExpanded = expandedFolders.has(dateFolder)
            const totalPhotos = logFolders.reduce((sum, log) => sum + photosByDateAndLog[dateFolder][log].length, 0)

            return (
              <div key={dateFolder} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleFolder(dateFolder)}
                  className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <ChevronRight className={`h-4 w-4 transition-transform ${isDateExpanded ? "rotate-90" : ""}`} />
                    <Calendar className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium">{dateFolder}</p>
                      <p className="text-sm text-gray-500">
                        {logFolders.length} {logFolders.length === 1 ? "log" : "logs"} • {totalPhotos}{" "}
                        {totalPhotos === 1 ? "photo" : "photos"}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">{totalPhotos}</Badge>
                </button>

                {/* Log subfolders */}
                {isDateExpanded && (
                  <div className="bg-white border-t">
                    {logFolders.map((logFolder) => {
                      const logPhotos = photosByDateAndLog[dateFolder][logFolder]
                      const isLogExpanded = expandedFolders.has(`${dateFolder}/${logFolder}`)
                      const displayName = logFolder.startsWith("Log_") ? logFolder.replace("Log_", "Log #") : logFolder

                      return (
                        <div key={`${dateFolder}/${logFolder}`} className="border-b last:border-b-0">
                          <button
                            onClick={() => toggleFolder(`${dateFolder}/${logFolder}`)}
                            className="w-full px-6 py-3 bg-gray-25 hover:bg-gray-50 flex items-center justify-between text-left transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <ChevronRight
                                className={`h-4 w-4 transition-transform ${isLogExpanded ? "rotate-90" : ""}`}
                              />
                              <ImageIcon className="h-4 w-4 text-gray-500" />
                              <div>
                                <p className="font-medium text-sm">{displayName}</p>
                                <p className="text-xs text-gray-500">
                                  {logPhotos.length} {logPhotos.length === 1 ? "photo" : "photos"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  downloadLogAsZip(dateFolder, logFolder, logPhotos)
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Badge variant="outline" className="text-xs">
                                {logPhotos.length}
                              </Badge>
                            </div>
                          </button>

                          {isLogExpanded && (
                            <div className="p-4 bg-white">
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {logPhotos.map((photo) => {
                                  const typeConfig = photoTypes.find((t) => t.value === photo.type)
                                  const photoIndex = filteredPhotos.indexOf(photo)

                                  return (
                                    <div
                                      key={photo.id}
                                      className="relative group cursor-pointer rounded-lg overflow-hidden border hover:border-primary transition-all"
                                      onClick={() => setSelectedPhotoIndex(photoIndex)}
                                    >
                                      <img
                                        src={photo.url || "/placeholder.svg"}
                                        alt={photo.caption || "Photo"}
                                        className="w-full h-48 object-cover"
                                      />
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                                        <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </div>
                                      {typeConfig && (
                                        <Badge
                                          variant="secondary"
                                          className={`absolute top-2 left-2 text-xs ${typeConfig.color} text-white`}
                                        >
                                          {typeConfig.label}
                                        </Badge>
                                      )}
                                      {canDelete && (
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleDelete(photo.id, photo.url)
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPhotos.map((photo, index) => {
            const typeConfig = photoTypes.find((t) => t.value === photo.type)
            return (
              <div
                key={photo.id}
                className="group relative aspect-square overflow-hidden rounded-lg border cursor-pointer"
                onClick={() => openViewer(photo, index)}
              >
                <img
                  src={photo.url || "/placeholder.svg"}
                  alt={photo.caption || "Photo"}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    {typeConfig && <Badge className={`${typeConfig.color} text-white mb-1`}>{typeConfig.label}</Badge>}
                    {photo.caption && <p className="text-white text-xs line-clamp-2">{photo.caption}</p>}
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        openViewer(photo, index)
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {canDelete && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(photo.id, photo.url)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Photos</DialogTitle>
            <DialogDescription>
              Add photos to this {entityType === "daily_log" ? "daily log" : "project"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="photo-upload">Select Photos</Label>
              <Input
                id="photo-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum file size: 10MB per photo. You can select multiple photos.
              </p>
            </div>

            {previewUrls.length > 0 && (
              <div className="border rounded-lg p-4">
                <p className="text-sm font-medium mb-2">
                  Preview ({previewUrls.length} photo{previewUrls.length > 1 ? "s" : ""}):
                </p>
                <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url || "/placeholder.svg"}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded"
                      />
                      <button
                        onClick={() => {
                          const newFiles = selectedFiles.filter((_, i) => i !== index)
                          const newUrls = previewUrls.filter((_, i) => i !== index)
                          URL.revokeObjectURL(url)
                          setSelectedFiles(newFiles)
                          setPreviewUrls(newUrls)
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="photo-type">Photo Type (applies to all)</Label>
              <Select
                value={uploadData.type}
                onValueChange={(value) => setUploadData((prev) => ({ ...prev, type: value as Photo["type"] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {photoTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="caption">Caption (Optional, applies to all)</Label>
              <Textarea
                id="caption"
                placeholder="Add a description or notes about these photos"
                value={uploadData.caption}
                onChange={(e) => setUploadData((prev) => ({ ...prev, caption: e.target.value }))}
                rows={3}
              />
            </div>

            {uploading && uploadProgress.total > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>
                    {uploadProgress.current} of {uploadProgress.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowUploadDialog(false)} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={uploading || selectedFiles.length === 0}>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading {uploadProgress.current}/{uploadProgress.total}...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {selectedFiles.length} Photo{selectedFiles.length !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Photo Details</DialogTitle>
            <DialogDescription>
              Photo {selectedPhotoIndex + 1} of {filteredPhotos.length}
            </DialogDescription>
          </DialogHeader>
          {selectedPhoto && (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={selectedPhoto.url || "/placeholder.svg"}
                  alt={selectedPhoto.caption || "Photo"}
                  className="w-full max-h-[60vh] object-contain rounded-lg"
                />
                {filteredPhotos.length > 1 && (
                  <>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2"
                      onClick={() => navigatePhoto("prev")}
                      disabled={selectedPhotoIndex === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => navigatePhoto("next")}
                      disabled={selectedPhotoIndex === filteredPhotos.length - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <div className="mt-1">
                    {photoTypes.find((t) => t.value === selectedPhoto.type) && (
                      <Badge className={`${photoTypes.find((t) => t.value === selectedPhoto.type)?.color} text-white`}>
                        {photoTypes.find((t) => t.value === selectedPhoto.type)?.label}
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Uploaded</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(selectedPhoto.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {selectedPhoto.caption && (
                <div>
                  <Label className="text-sm font-medium">Caption</Label>
                  <p className="text-sm text-gray-600 mt-1">{selectedPhoto.caption}</p>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-gray-500">Uploaded by {selectedPhoto.uploaded_by}</div>
                {canDelete && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(selectedPhoto.id, selectedPhoto.url)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Photo
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
