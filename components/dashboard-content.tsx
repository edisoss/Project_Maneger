"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Building2,
  Users,
  Package,
  FileText,
  Calendar,
  TrendingUp,
  AlertTriangle,
  LogOut,
  User,
  Loader2,
} from "lucide-react"
import { createClientClient } from "@/lib/supabase-client"
import { useRouter } from "next/navigation"
import type { User as SupabaseUser } from "@supabase/supabase-js"

import ProjectsTab from "./projects-tab"
import WorkersTab from "./workers-tab"
import MaterialsTab from "./materials-tab"
import DailyLogsTab from "./daily-logs-tab"
import { getMaterials, getDailyLogs, getProjects, getWorkers } from "@/lib/database"
import type { Material, DailyLog, Project, Worker } from "@/lib/database"

interface DashboardContentProps {
  user: SupabaseUser
}

export default function DashboardContent({ user }: DashboardContentProps) {
  const router = useRouter()
  const supabase = createClientClient()

  // State for all data
  const [materials, setMaterials] = useState<Material[]>([])
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load all data on component mount
  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [materialsData, logsData, projectsData, workersData] = await Promise.all([
        getMaterials(),
        getDailyLogs(),
        getProjects(),
        getWorkers(),
      ])

      setMaterials(materialsData)
      setDailyLogs(logsData)
      setProjects(projectsData)
      setWorkers(workersData)
    } catch (err) {
      console.error("Error loading data:", err)
      setError("Failed to load data. Please refresh the page.")
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut()
      }
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
      router.push("/")
    }
  }

  // Calculate dashboard stats
  const totalProjects = projects.length
  const activeProjects = projects.filter((p) => p.status === "In Progress").length
  const totalWorkers = workers.length
  const activeWorkers = workers.filter((w) => w.status === "Active").length
  const totalMaterials = materials.length
  const lowStockMaterials = materials.filter((m) => m.status === "Low Stock" || m.status === "Out of Stock").length
  const totalLogs = dailyLogs.length
  const todayLogs = dailyLogs.filter((log) => log.date === new Date().toISOString().split("T")[0]).length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadAllData}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600" />
              <h1 className="ml-2 text-xl font-semibold text-gray-900">ConstructPro</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome back!</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder-user.jpg" alt="User" />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuItem className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.email}</p>
                      <p className="text-xs leading-none text-muted-foreground">Project Manager</p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="workers">Workers</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="logs">Daily Logs</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
              <p className="text-gray-600">Monitor your construction projects and resources</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalProjects}</div>
                  <p className="text-xs text-muted-foreground">{activeProjects} active projects</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Workers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalWorkers}</div>
                  <p className="text-xs text-muted-foreground">{activeWorkers} currently active</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Materials</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalMaterials}</div>
                  <p className="text-xs text-muted-foreground">{lowStockMaterials} need attention</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Daily Logs</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalLogs}</div>
                  <p className="text-xs text-muted-foreground">{todayLogs} logged today</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity and Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Daily Logs */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>Latest daily work logs</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dailyLogs.slice(0, 3).map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{log.project}</p>
                        <p className="text-xs text-gray-600">
                          {log.date} • {log.workers_present.length} workers
                        </p>
                      </div>
                      <Badge variant="default">{log.status}</Badge>
                    </div>
                  ))}
                  {dailyLogs.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No daily logs yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Material Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Material Alerts
                  </CardTitle>
                  <CardDescription>Items requiring attention</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {materials
                    .filter((m) => m.status === "Low Stock" || m.status === "Out of Stock")
                    .slice(0, 3)
                    .map((material) => (
                      <div key={material.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{material.name}</p>
                          <p className="text-xs text-gray-600">
                            {material.current_stock} {material.unit} remaining
                          </p>
                        </div>
                        <Badge variant={material.status === "Out of Stock" ? "destructive" : "secondary"}>
                          {material.status}
                        </Badge>
                      </div>
                    ))}
                  {materials.filter((m) => m.status === "Low Stock" || m.status === "Out of Stock").length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No material alerts at this time</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button variant="outline" className="h-20 flex-col bg-transparent">
                    <FileText className="h-6 w-6 mb-2" />
                    <span className="text-sm">Add Daily Log</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col bg-transparent">
                    <Package className="h-6 w-6 mb-2" />
                    <span className="text-sm">Update Stock</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col bg-transparent">
                    <Users className="h-6 w-6 mb-2" />
                    <span className="text-sm">Manage Workers</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col bg-transparent">
                    <TrendingUp className="h-6 w-6 mb-2" />
                    <span className="text-sm">View Reports</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects">
            <ProjectsTab projects={projects} setProjects={setProjects} />
          </TabsContent>

          {/* Workers Tab */}
          <TabsContent value="workers">
            <WorkersTab workers={workers} setWorkers={setWorkers} />
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials">
            <MaterialsTab materials={materials} setMaterials={setMaterials} />
          </TabsContent>

          {/* Daily Logs Tab */}
          <TabsContent value="logs">
            <DailyLogsTab
              materials={materials}
              setMaterials={setMaterials}
              dailyLogs={dailyLogs}
              setDailyLogs={setDailyLogs}
              workers={workers}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
