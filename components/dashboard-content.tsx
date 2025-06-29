"use client"

import { useState } from "react"
import type { User } from "@supabase/supabase-js"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, Users, ClipboardList, Package, LogOut } from "lucide-react"
import { createClientClient } from "@/lib/supabase-client"
import ProjectsTab from "@/components/projects-tab"
import WorkersTab from "@/components/workers-tab"
import DailyLogsTab from "@/components/daily-logs-tab"
import MaterialsTab from "@/components/materials-tab"

interface DashboardContentProps {
  user: User
}

export default function DashboardContent({ user }: DashboardContentProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [sharedMaterials, setSharedMaterials] = useState([
    {
      id: 1,
      name: "Cat6 Network Cable",
      category: "Network Cabling",
      currentStock: 500,
      minStock: 100,
      unit: "meters",
      location: "Warehouse A - Shelf 3",
      lastUpdated: "2024-01-20",
      status: "In Stock",
    },
    {
      id: 2,
      name: "Security Cameras (IP)",
      category: "Security Systems",
      currentStock: 15,
      minStock: 20,
      unit: "pieces",
      location: "Warehouse B - Section 2",
      lastUpdated: "2024-01-19",
      status: "Low Stock",
    },
    {
      id: 3,
      name: "BMS Control Panels",
      category: "BMS",
      currentStock: 8,
      minStock: 5,
      unit: "pieces",
      location: "Warehouse A - Secure Storage",
      lastUpdated: "2024-01-18",
      status: "In Stock",
    },
    {
      id: 4,
      name: "RJ45 Connectors",
      category: "Network Cabling",
      currentStock: 50,
      minStock: 50,
      unit: "pieces",
      location: "Warehouse A - Shelf 1",
      lastUpdated: "2024-01-20",
      status: "In Stock",
    },
    {
      id: 5,
      name: "Temperature Sensors",
      category: "BMS",
      currentStock: 25,
      minStock: 10,
      unit: "pieces",
      location: "Warehouse B - Section 1",
      lastUpdated: "2024-01-17",
      status: "In Stock",
    },
    {
      id: 6,
      name: "Cable Conduit",
      category: "Network Cabling",
      currentStock: 200,
      minStock: 50,
      unit: "meters",
      location: "Warehouse A - Shelf 2",
      lastUpdated: "2024-01-19",
      status: "In Stock",
    },
    {
      id: 7,
      name: "Wall Plates",
      category: "Network Cabling",
      currentStock: 50,
      minStock: 20,
      unit: "pieces",
      location: "Warehouse A - Shelf 1",
      lastUpdated: "2024-01-18",
      status: "In Stock",
    },
    {
      id: 8,
      name: "Mounting Brackets",
      category: "Security Systems",
      currentStock: 30,
      minStock: 15,
      unit: "pieces",
      location: "Warehouse B - Section 2",
      lastUpdated: "2024-01-17",
      status: "In Stock",
    },
  ])

  const handleSignOut = async () => {
    try {
      const supabase = createClientClient()
      if (supabase) {
        await supabase.auth.signOut()
      }
      window.location.href = "/"
    } catch (error) {
      console.error("Sign out error:", error)
      window.location.href = "/"
    }
  }

  // Mock data - in real app, this would come from your database
  const stats = {
    activeProjects: 8,
    totalWorkers: 24,
    todayLogs: 12,
    pendingMaterials: 5,
  }

  const recentProjects = [
    { id: 1, name: "Office Building Security System", status: "In Progress", progress: 75 },
    { id: 2, name: "Hospital BMS Installation", status: "Planning", progress: 25 },
    { id: 3, name: "School Network Cabling", status: "Completed", progress: 100 },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">ConstructPro</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {user?.email || "User"}</span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="workers">Workers</TabsTrigger>
            <TabsTrigger value="daily-logs">Daily Logs</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeProjects}</div>
                  <p className="text-xs text-muted-foreground">+2 from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Workers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalWorkers}</div>
                  <p className="text-xs text-muted-foreground">+3 from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Logs</CardTitle>
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.todayLogs}</div>
                  <p className="text-xs text-muted-foreground">Updated 2 hours ago</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Materials</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pendingMaterials}</div>
                  <p className="text-xs text-muted-foreground">Needs attention</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Projects */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Projects</CardTitle>
                <CardDescription>Overview of your current construction projects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentProjects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{project.name}</h3>
                        <div className="flex items-center mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2 mr-4">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${project.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{project.progress}%</span>
                        </div>
                      </div>
                      <Badge
                        variant={
                          project.status === "Completed"
                            ? "default"
                            : project.status === "In Progress"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {project.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects">
            <ProjectsTab />
          </TabsContent>

          <TabsContent value="workers">
            <WorkersTab />
          </TabsContent>

          <TabsContent value="daily-logs">
            <DailyLogsTab materials={sharedMaterials} setMaterials={setSharedMaterials} />
          </TabsContent>

          <TabsContent value="materials">
            <MaterialsTab materials={sharedMaterials} setMaterials={setSharedMaterials} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
