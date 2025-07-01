"use client"

import type React from "react"
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, Edit, Trash2, Loader2 } from "lucide-react"
import type { Project } from "@/lib/database"

/* ────────────────────────────────────────────────────────────────── */
/* 1. Generic row used inside View dialog                             */
/* ────────────────────────────────────────────────────────────────── */
export function DetailRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode | string | number
}) {
  return (
    <div className="space-y-1">
      <Label className="font-medium">{label}</Label>
      {typeof value === "string" || typeof value === "number" ? <p>{value}</p> : value}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────── */
/* 2. Statistics summary cards                                        */
/* ────────────────────────────────────────────────────────────────── */
export function StatCards({
  total,
  active,
  done,
  avgProg,
}: {
  total: number
  active: number
  done: number
  avgProg: number
}) {
  const items = [
    { title: "Total Projects", value: total },
    { title: "Active Projects", value: active, color: "text-blue-600" },
    { title: "Completed", value: done, color: "text-green-600" },
    { title: "Avg Progress", value: `${Math.round(avgProg)}%` },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {items.map(({ title, value, color }) => (
        <Card key={title}>
          <CardHeader>
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${color ?? ""}`}>{value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────── */
/* 3. Re-usable add / edit dialog body                                */
/* ────────────────────────────────────────────────────────────────── */
interface AddEditDialogProps {
  title: string
  description: string
  formData: {
    name: string
    description: string
    type: string
    status: string
    start_date: string
    end_date: string
    progress: number
  }
  setFormData: React.Dispatch<
    React.SetStateAction<{
      name: string
      description: string
      type: string
      status: string
      start_date: string
      end_date: string
      progress: number
    }>
  >
  statusOptions: string[]
  typeOptions: string[]
  onSubmit: () => void
  onCancel: () => void
  saving: boolean
}

export function AddEditDialog({
  title,
  description,
  formData,
  setFormData,
  statusOptions,
  typeOptions,
  onSubmit,
  onCancel,
  saving,
}: AddEditDialogProps) {
  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      {/* FORM FIELDS */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="proj-name">Project Name *</Label>
          <Input
            id="proj-name"
            placeholder="Enter project name"
            value={formData.name}
            onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
          />
        </div>

        <div>
          <Label htmlFor="proj-desc">Description *</Label>
          <Textarea
            id="proj-desc"
            rows={3}
            placeholder="Enter description"
            value={formData.description}
            onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="proj-type">Type *</Label>
            <Select value={formData.type} onValueChange={(v) => setFormData((p) => ({ ...p, type: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="proj-status">Status *</Label>
            <Select value={formData.status} onValueChange={(v) => setFormData((p) => ({ ...p, status: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="proj-start">Start Date *</Label>
            <Input
              id="proj-start"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData((p) => ({ ...p, start_date: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="proj-end">End Date *</Label>
            <Input
              id="proj-end"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData((p) => ({ ...p, end_date: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="proj-progress">Progress (%)</Label>
          <Input
            id="proj-progress"
            type="number"
            min={0}
            max={100}
            value={formData.progress}
            onChange={(e) => setFormData((p) => ({ ...p, progress: Number.parseInt(e.target.value) || 0 }))}
          />
        </div>
      </div>

      <DialogFooter className="pt-4">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…
            </>
          ) : (
            "Save"
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

/* ────────────────────────────────────────────────────────────────── */
/* 4. Table wrapper (list with actions)                               */
/* ────────────────────────────────────────────────────────────────── */
interface ProjectTableProps {
  projects: Project[]
  onView: (p: Project) => void
  onEdit: (p: Project) => void
  onDelete: (p: Project) => void
  getStatusColor: (s: string) => string
  getStatusIcon: (s: string) => React.ReactNode
}

export function ProjectTable({ projects, onView, onEdit, onDelete, getStatusColor, getStatusIcon }: ProjectTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project List</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>End</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-sm text-muted-foreground truncate max-w-xs">{p.description}</div>
                </TableCell>

                <TableCell>
                  <Badge variant={getStatusColor(p.status)} className="flex items-center gap-1 w-fit">
                    {getStatusIcon(p.status)}
                    {p.status}
                  </Badge>
                </TableCell>

                <TableCell>
                  <div className="space-y-1">
                    <Progress value={p.progress} className="w-20" />
                    <span className="text-xs text-gray-500">{p.progress}%</span>
                  </div>
                </TableCell>

                <TableCell>{p.type}</TableCell>
                <TableCell>{p.start_date}</TableCell>
                <TableCell>{p.end_date}</TableCell>

                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => onView(p)}>
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onEdit(p)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onDelete(p)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {projects.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No projects found. Add one to get started!</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
