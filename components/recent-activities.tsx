"use client"

import type React from "react"

import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Package, TrendingUp, TrendingDown, RotateCcw, Calendar, Clock } from "lucide-react"
import type { MaterialTransaction, Material, Project } from "@/lib/database"

export interface Activity {
  id: string
  type: "project" | "worker" | "material" | "daily_log" | "material_transaction"
  title: string
  description: string
  timestamp: string
  icon: React.ComponentType<{ className?: string }>
  variant: "default" | "secondary" | "destructive" | "outline"
}

interface RecentActivitiesProps {
  manualActivities?: Activity[]
  materialTransactions?: MaterialTransaction[]
  materials?: Material[]
  projects?: Project[]
}

export default function RecentActivities({
  manualActivities = [],
  materialTransactions = [],
  materials = [],
  projects = [],
}: RecentActivitiesProps) {
  // Convert material transactions to activities
  const transactionActivities: Activity[] = materialTransactions.slice(0, 10).map((transaction) => {
    const material = materials.find((m) => m.id === transaction.material_id)
    const materialName = material?.name || `Material ID ${transaction.material_id}`

    let icon = Package
    let variant: Activity["variant"] = "outline"
    let title = "Material Transaction"
    let description = `${materialName}: ${transaction.transaction_type}`

    switch (transaction.transaction_type) {
      case "added":
        icon = TrendingUp
        variant = "default"
        title = "Material Added"
        description = `${materialName}: +${transaction.quantity} added to inventory`
        break
      case "used":
        icon = TrendingDown
        variant = "secondary"
        title = "Material Used"
        description = `${materialName}: -${transaction.quantity} used in project`
        break
      case "adjusted":
        icon = RotateCcw
        variant = "outline"
        title = "Stock Adjusted"
        description = `${materialName}: stock adjusted by ${transaction.quantity}`
        break
      case "returned":
        icon = RotateCcw
        variant = "outline"
        title = "Material Returned"
        description = `${materialName}: +${transaction.quantity} returned to inventory`
        break
    }

    return {
      id: `transaction-${transaction.id}`,
      type: "material_transaction" as const,
      title,
      description,
      timestamp: transaction.created_at,
      icon,
      variant,
    }
  })

  // Combine and sort all activities
  const allActivities = [...manualActivities, ...transactionActivities]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 15)

  const getTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`

    return time.toLocaleDateString()
  }

  if (allActivities.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p className="text-gray-500">No recent activities</p>
        <p className="text-sm text-gray-400">Activities will appear here as you use the system</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-80">
      <div className="space-y-3">
        {allActivities.map((activity) => {
          const IconComponent = activity.icon
          return (
            <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
              <div className="flex-shrink-0">
                <div
                  className={`p-2 rounded-full ${
                    activity.variant === "default"
                      ? "bg-primary/10 text-primary"
                      : activity.variant === "secondary"
                        ? "bg-secondary/10 text-secondary-foreground"
                        : activity.variant === "destructive"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-muted text-muted-foreground"
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium truncate">{activity.title}</h4>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {getTimeAgo(activity.timestamp)}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{activity.description}</p>
                <Badge variant={activity.variant} className="mt-2 text-xs">
                  {activity.type.replace("_", " ")}
                </Badge>
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}
