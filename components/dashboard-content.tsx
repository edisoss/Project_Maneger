"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Building2,
  Users,
  Package,
  FileText,
  Settings,
  LogOut,
  AlertTriangle,
  Shield,
  ActivityIcon,
  BarChart3,
  Loader2,
  UserPlus,
  Crown,
} from "lucide-react"
import { createClientClient } from "@/lib/supabase-client"
import {
  getProjects,
  getWorkers,
  getMaterials,
  getDailyLogs,
  getRoles,
  getSkills,
  getMaterialCategories,
  getMaterialLocations,
  getProfiles,
  addProfile,
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
  Profile,
} from "@/lib/database"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"

import ProjectsTab from "./projects-tab"
import WorkersTab from "./workers-tab"
import MaterialsTab from "./materials-tab"
import DailyLogsTab from "./daily-logs-tab"
import RecentActivities from "./recent-activities"

interface DashboardContentProps {
  user: User
}

export default function DashboardContent({ user }: DashboardContentProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [materialCategories, setMaterialCategories] = useState<MaterialCategory[]>([])
  const [materialLocations, setMaterialLocations] = useState<MaterialLocation[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(true) // Default to true for first user
  const [showAddUserDialog, setShowAddUserDialog] = useState(false)
  const [newUserData, setNewUserData] = useState({
    email: "",
    full_name: "",
    role: "user",
  })
  const [creatingUser, setCreatingUser] = useState(false)

  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    try {
      setLoading(true)
      console.log("Loading all data...")

      const [
        projectsData,
        workersData,
        materialsData,
        dailyLogsData,
        rolesData,
        skillsData,
        categoriesData,
        locationsData,
        profilesData,
      ] = await Promise.all([
        getProjects(),
        getWorkers(),
        getMaterials(),
        getDailyLogs(),
        getRoles(),
        getSkills(),
        getMaterialCategories(),
        getMaterialLocations(),
        getProfiles(),
      ])

      console.log("Data loaded:", {
        projects: projectsData.length,
        workers: workersData.length,
        materials: materialsData.length,
        dailyLogs: dailyLogsData.length,
        roles: rolesData.length,
        skills: skillsData.length,
        categories: categoriesData.length,
        locations: locationsData.length,
        profiles: profilesData.length,
      })

      setProjects(projectsData)
      setWorkers(workersData)
      setMaterials(materialsData)
      setDailyLogs(dailyLogsData)
      setRoles(rolesData)
      setSkills(skillsData)
      setMaterialCategories(categoriesData)
      setMaterialLocations(locationsData)
      setProfiles(profilesData)

      // Generate activities from loaded data
      generateActivities(projectsData, workersData, materialsData, dailyLogsData)
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please refresh the page.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const generateActivities = (
    projectsData: Project[],
    workersData: Worker[],
    materialsData: Material[],
    dailyLogsData: DailyLog[],
  ) => {
    const newActivities: any[] = []

    // Add recent projects
    projectsData.slice(0, 2).forEach((project, index) => {
      newActivities.push({
        id: `project-${project.id}`,
        type: "project",
        title: "Project Created",
        description: `${project.name} project was created`,
        timestamp: new Date(Date.now() - index * 2 * 60 * 60 * 1000).toISOString(),
        icon: Building2,
        variant: "default",
      })
    })

    // Add recent workers
    workersData.slice(0, 2).forEach((worker, index) => {
      newActivities.push({
        id: `worker-${worker.id}`,
        type: "worker",
        title: "Worker Added",
        description: `${worker.name} joined as ${worker.role}`,
        timestamp: new Date(Date.now() - (index + 2) * 2 * 60 * 60 * 1000).toISOString(),
        icon: Users,
        variant: "default",
      })
    })

    // Add material alerts
    materialsData
      .filter((material) => material.current_stock <= material.min_stock)
      .slice(0, 2)
      .forEach((material, index) => {
        newActivities.push({
          id: `material-${material.id}`,
          type: "material",
          title: "Low Stock Alert",
          description: `${material.name} is running low (${material.current_stock} ${material.unit} remaining)`,
          timestamp: new Date(Date.now() - (index + 4) * 2 * 60 * 60 * 1000).toISOString(),
          icon: AlertTriangle,
          variant: "destructive",
        })
      })

    // Add recent daily logs
    dailyLogsData.slice(0, 2).forEach((log, index) => {
      newActivities.push({
        id: `log-${log.id}`,
        type: "daily_log",
        title: "Daily Log Submitted",
        description: `${log.title} - ${log.status}`,
        timestamp: new Date(Date.now() - (index + 6) * 2 * 60 * 60 * 1000).toISOString(),
        icon: FileText,
        variant: "secondary",
      })
    })

    setActivities(newActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()))
  }

  const logActivity = (activity: any) => {
    const newActivity: any = {
      ...activity,
      id: `activity-${Date.now()}`,
      timestamp: new Date().toISOString(),
    }
    setActivities((prev) => [newActivity, ...prev.slice(0, 9)]) // Keep only 10 most recent
  }

  const handleSignOut = async () => {
    const supabase = createClientClient()
    if (supabase) {
      await supabase.auth.signOut()
    }
    router.push("/")
  }

  const handleAddUser = async () => {
    try {
      setCreatingUser(true)
      if (!newUserData.email || !newUserData.full_name) {
        toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" })
        return
      }

      const newProfile = await addProfile({
        email: newUserData.email,
        full_name: newUserData.full_name,
        role: newUserData.role,
        is_admin: newUserData.role === "admin",
      })

      if (newProfile) {
        setProfiles([...profiles, newProfile])
        setShowAddUserDialog(false)
        setNewUserData({ email: "", full_name: "", role: "user" })
        toast({ title: "Success", description: "User created successfully!" })

        logActivity({
          type: "user",
          title: "User Created",
          description: `New user ${newUserData.full_name} was created`,
          icon: UserPlus,
          variant: "default",
        })
      }
    } catch (error) {
      console.error("Error creating user:", error)
      toast({ title: "Error", description: "Failed to create user", variant: "destructive" })
    } finally {
      setCreatingUser(false)
    }
  }

  // Calculate overview statistics
  const totalProjects = projects.length
  const activeProjects = projects.filter((p) => p.status === "Active").length
  const totalWorkers = workers.length
  const activeWorkers = workers.filter((w) => w.status === "Active").length
  const totalMaterials = materials.length
  const lowStockMaterials = materials.filter((m) => m.current_stock <= m.min_stock).length
  const thisWeekLogs = dailyLogs.filter((log) => {
    const logDate = new Date(log.date)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return logDate >= weekAgo
  }).length

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <Building2 className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">Loading Dashboard</h3>
            <p className="text-gray-600">Setting up your construction management system...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Construction Manager
                  </h1>
                  <p className="text-sm text-gray-500">Project Management Dashboard</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {isAdmin && (
                <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="bg-white/50 hover:bg-white/80">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New User</DialogTitle>
                      <DialogDescription>Create a new user account for the system</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="user@example.com"
                          value={newUserData.email}
                          onChange={(e) => setNewUserData((prev) => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="full_name">Full Name *</Label>
                        <Input
                          id="full_name"
                          placeholder="Enter full name"
                          value={newUserData.full_name}
                          onChange={(e) => setNewUserData((prev) => ({ ...prev, full_name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="role">Role</Label>
                        <Select
                          value={newUserData.role}
                          onValueChange={(value) => setNewUserData((prev) => ({ ...prev, role: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowAddUserDialog(false)} disabled={creatingUser}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddUser} disabled={creatingUser}>
                        {creatingUser ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create User"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full bg-white/50 hover:bg-white/80">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                        {user.email?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none flex items-center">
                        {user.email}
                        {isAdmin && <Crown className="h-3 w-3 ml-2 text-yellow-500" />}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">{isAdmin ? "Administrator" : "User"}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/60 backdrop-blur-sm border border-gray-200 rounded-xl p-1">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all duration-200"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="projects"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all duration-200"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Projects
            </TabsTrigger>
            <TabsTrigger
              value="workers"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all duration-200"
            >
              <Users className="h-4 w-4 mr-2" />
              Workers
            </TabsTrigger>
            <TabsTrigger
              value="materials"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all duration-200"
            >
              <Package className="h-4 w-4 mr-2" />
              Materials
            </TabsTrigger>
            <TabsTrigger
              value="daily-logs"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all duration-200"
            >
              <FileText className="h-4 w-4 mr-2" />
              Daily Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold">Welcome back!</h2>
                    <p className="text-blue-100 text-lg">
                      Here's what's happening with your construction projects today.
                    </p>
                  </div>
                  <div className="hidden md:block">
                    <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center">
                      <Building2 className="w-12 h-12 text-white" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full"></div>
              <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full"></div>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700">Total Projects</CardTitle>
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-900">{totalProjects}</div>
                  <p className="text-xs text-blue-600 mt-1">{activeProjects} active projects</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-700">Team Members</CardTitle>
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-900">{totalWorkers}</div>
                  <p className="text-xs text-green-600 mt-1">{activeWorkers} active workers</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-orange-700">Materials</CardTitle>
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                    <Package className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-900">{totalMaterials}</div>
                  <p className="text-xs text-orange-600 mt-1">{lowStockMaterials} low stock alerts</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-700">This Week</CardTitle>
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-900">{thisWeekLogs}</div>
                  <p className="text-xs text-purple-600 mt-1">daily logs submitted</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Activities */}
              <Card className="lg:col-span-2 bg-white/60 backdrop-blur-sm border-gray-200 hover:shadow-lg transition-all duration-200">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ActivityIcon className="h-5 w-5 mr-2 text-blue-600" />
                    Recent Activities
                  </CardTitle>
                  <CardDescription>Latest updates from your construction projects</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <RecentActivities activities={activities} />
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* User Management (Admin Only) */}
              {isAdmin && (
                <Card className="bg-white/60 backdrop-blur-sm border-gray-200 hover:shadow-lg transition-all duration-200">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="h-5 w-5 mr-2 text-amber-600" />
                      User Management
                      <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-800">
                        Admin
                      </Badge>
                    </CardTitle>
                    <CardDescription>Manage system users and permissions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                          <Crown className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-amber-900">Admin Access</p>
                          <p className="text-xs text-amber-700">Full system permissions</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-amber-300 text-amber-700">
                        Active
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900">System Users ({profiles.length})</h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {profiles.slice(0, 3).map((profile) => (
                          <div key={profile.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                                  {profile.full_name?.charAt(0) || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{profile.full_name}</p>
                                <p className="text-xs text-gray-500">{profile.email}</p>
                              </div>
                            </div>
                            <Badge variant={profile.is_admin ? "default" : "secondary"} className="text-xs">
                              {profile.is_admin ? "Admin" : "User"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={() => setShowAddUserDialog(true)}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add New User
                    </Button>
                  </CardContent>
                </Card>
              )}
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
              logActivity={logActivity}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
