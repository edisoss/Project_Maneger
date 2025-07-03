"use client"

import { Badge } from "@/components/ui/badge"
import {
  Clock,
  Building2,
  Users,
  Package,
  FileText,
  UserPlus,
  AlertTriangle,
  Edit,
  Trash2,
  Settings,
} from "lucide-react"
import type { Activity } from "@/lib/database"

interface RecentActivitiesProps {
  activities?: Activity[]
}

export default function RecentActivities({ activities = [] }: RecentActivitiesProps) {
  const getTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const getActivityIcon = (iconName: string) => {
    const iconMap = {
      Building2,
      Users,
      Package,
      FileText,
      UserPlus,
      AlertTriangle,
      Edit,
      Trash2,
      Settings,
      Clock,
    }

    const IconComponent = iconMap[iconName as keyof typeof iconMap] || Clock
    return <IconComponent className="h-4 w-4" />
  }

  const getActivityBadge = (type: string) => {
    switch (type) {
      case "project":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Project
          </Badge>
        )
      case "worker":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Worker
          </Badge>
        )
      case "material":
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            Material
          </Badge>
        )
      case "daily_log":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            Daily Log
          </Badge>
        )
      case "user":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            User
          </Badge>
        )
      case "system":
        return (
          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
            System
          </Badge>
        )
      default:
        return <Badge variant="outline">Activity</Badge>
    }
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Clock className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No recent activities</h3>
        <p className="text-gray-500 text-sm">
          Activities will appear here as you work with projects, workers, and materials.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
          <div
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              activity.variant === "destructive"
                ? "bg-red-100 text-red-600"
                : activity.variant === "secondary"
                  ? "bg-gray-100 text-gray-600"
                  : "bg-blue-100 text-blue-600"
            }`}
          >
            {getActivityIcon(activity.icon)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-gray-900">{activity.title}</p>
              {getActivityBadge(activity.type)}
            </div>
            <p className="text-sm text-gray-600 mb-1">{activity.description}</p>
            <p className="text-xs text-gray-400">{getTimeAgo(activity.created_at)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
