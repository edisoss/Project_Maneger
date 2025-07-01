"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building2, Users, Package, FileText, TrendingUp, Activity } from "lucide-react"
import ProjectsTab from "./projects-tab"
import WorkersTab from "./workers-tab"
import MaterialsTab from "./materials-tab"
import DailyLogsTab from "./daily-logs-tab"
import RecentActivities, { type Activity as ActivityType } from "./recent-activities"
import {
  getProjects,
  getWorkers,
  getMaterials,
  getDailyLogs,
  getRoles,
  getSkills,
  getMaterialCategories,
  getMaterialLocations,
  getMaterialTransactions,
} from "@/lib/database"
import type {
  Project,
  Worker,
  Material,
  DailyLog,
  Role,
  Skill,
  MaterialCategory,
  MaterialLocation,
  MaterialTransaction,
} from "@/lib/database"

export default function DashboardContent() {
  const [projects, setProjects] = useState<Project[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [materialCategories, setMaterialCategories] = useState<MaterialCategory[]>([])
  const [materialLocations, setMaterialLocations] = useState<MaterialLocation[]>([])
  const [materialTransactions, setMaterialTransactions] = useState<MaterialTransaction[]>([])
  const [manualActivities, setManualActivities] = useState<ActivityType[]>([])
  const [activityCounter, setActivityCounter] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    loadData()
  }, [])

  const logActivity = (activity: Omit<ActivityType, "id" | "timestamp">) => {
    const newActivity: ActivityType = {
      ...activity,
      id: `manual-${Date.now()}-${activityCounter}`,
      timestamp: new Date().toISOString(),
    }
    setActivityCounter((prev) => prev + 1)
    setManualActivities((prev) => [newActivity, ...prev])
  }

  const loadData = async () => {
    try {
      setLoading(true)
      const [
        projectsData,
        workersData,
        materialsData,
        dailyLogsData,
        rolesData,
        skillsData,
        categoriesData,
        locationsData,
        transactionsData,
      ] = await Promise.all([
        getProjects(),
        getWorkers(),
        getMaterials(),
        getDailyLogs(),
        getRoles(),
        getSkills(),
        getMaterialCategories(),
        getMaterialLocations(),
        getMaterialTransactions(),
      ])

      setProjects(projectsData)
      setWorkers(workersData)
      setMaterials(materialsData)
      setDailyLogs(dailyLogsData)
      setRoles(rolesData)
      setSkills(skillsData)
      setMaterialCategories(categoriesData)
      setMaterialLocations(locationsData)
      setMaterialTransactions(transactionsData)
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate statistics
  const totalProjects = projects.length
  const activeProjects = projects.filter((p) => p.status === "Active").length
  const totalWorkers = workers.length
  const activeWorkers = workers.filter((w) => w.status === "Active").length
  const totalMaterials = materials.length
  const lowStockMaterials = materials.filter((m) => m.current_stock <= m.min_stock).length
  const totalLogs = dailyLogs.length
  const recentLogs = dailyLogs.filter((log) => {
    const logDate = new Date(log.date)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return logDate >= weekAgo
  }).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Construction Management Dashboard</h1>
          <p className="text-muted-foreground">Manage your construction projects, workers, and materials</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            Live Data
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="workers">Workers</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="daily-logs">Daily Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalProjects}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{activeProjects}</span> active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Workers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalWorkers}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{activeWorkers}</span> active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Materials</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalMaterials}</div>
                <p className="text-xs text-muted-foreground">
                  {lowStockMaterials > 0 ? (
                    <span className="text-red-600">{lowStockMaterials} low stock</span>
                  ) : (
                    <span className="text-green-600">All stocked</span>
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Daily Logs</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalLogs}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-blue-600">{recentLogs}</span> this week
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activities and Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activities
                </CardTitle>
                <CardDescription>Latest updates across your projects</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentActivities
                  manualActivities={manualActivities}
                  materialTransactions={materialTransactions}
                  materials={materials}
                  projects={projects}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center gap-2 bg-transparent"
                    onClick={() => setActiveTab("projects")}
                  >
                    <Building2 className="h-6 w-6" />
                    <span className="text-sm">New Project</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center gap-2 bg-transparent"
                    onClick={() => setActiveTab("daily-logs")}
                  >
                    <FileText className="h-6 w-6" />
                    <span className="text-sm">Add Log</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center gap-2 bg-transparent"
                    onClick={() => setActiveTab("workers")}
                  >
                    <Users className="h-6 w-6" />
                    <span className="text-sm">Add Worker</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center gap-2 bg-transparent"
                    onClick={() => setActiveTab("materials")}
                  >
                    <Package className="h-6 w-6" />
                    <span className="text-sm">Add Material</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="projects">
          <ProjectsTab projects={projects} setProjects={setProjects} logActivity={logActivity} />
        </TabsContent>

        <TabsContent value="workers">
          <WorkersTab
            workers={workers}
            setWorkers={setWorkers}
            roles={roles}
            setRoles={setRoles}
            skills={skills}
            setSkills={setSkills}
            logActivity={logActivity}
          />
        </TabsContent>

        <TabsContent value="materials">
          <MaterialsTab
            materials={materials}
            setMaterials={setMaterials}
            materialCategories={materialCategories}
            setMaterialCategories={setMaterialCategories}
            materialLocations={materialLocations}
            setMaterialLocations={setMaterialLocations}
            logActivity={logActivity}
          />
        </TabsContent>

        <TabsContent value="daily-logs">
          <DailyLogsTab
            dailyLogs={dailyLogs}
            setDailyLogs={setDailyLogs}
            projects={projects}
            workers={workers}
            materials={materials}
            setMaterials={setMaterials}
            logActivity={logActivity}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
