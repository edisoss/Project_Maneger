"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  DialogFooter,
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
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Building2, Users, Package, FileText, Settings, LogOut, Shield, ActivityIcon, BarChart3, Loader2, UserPlus, Crown, Edit, Trash2, Eye, Briefcase, Plus } from 'lucide-react'
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
  updateProfile,
  deleteProfile,
  getActivities,
  addActivity,
  verifyAndFixCreatorInfo,
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
  Activity,
} from "@/lib/database"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from 'next/navigation'
import type { User } from "@supabase/supabase-js"

// Import tab components
import ProjectsTab from "./projects-tab"
import WorkersTab from "./workers-tab"
import MaterialsManagement from "./materials-management"
import DailyLogsTab from "./daily-logs-tab"
import RecentActivities from "./recent-activities"

interface DashboardContentProps {
  user: User
}

export default function DashboardContent({ user }: DashboardContentProps) {
  // State for all data
  const [projects, setProjects] = useState<Project[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [materialCategories, setMaterialCategories] = useState<MaterialCategory[]>([])
  const [materialLocations, setMaterialLocations] = useState<MaterialLocation[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false) // Default to false, check from profile
  const [userProfile, setUserProfile] = useState<Profile | null>(null)

  // State for active tab management
  const [activeTab, setActiveTab] = useState("overview")

  // User management states
  const [showAddUserDialog, setShowAddUserDialog] = useState(false)
  const [showEditUserDialog, setShowEditUserDialog] = useState(false)
  const [showDeleteUserDialog, setShowDeleteUserDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [newUserData, setNewUserData] = useState({
    email: "",
    full_name: "",
    role: "user",
    password: "",
  })
  const [editUserData, setEditUserData] = useState({
    email: "",
    full_name: "",
    role: "user",
    password: "",
  })
  const [creatingUser, setCreatingUser] = useState(false)
  const [updatingUser, setUpdatingUser] = useState(false)
  const [deletingUser, setDeletingUser] = useState(false)

  const { toast } = useToast()
  const router = useRouter()

  // Load all data on component mount
  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    try {
      setLoading(true)
      console.log("Loading all data...")
      console.log("Current user:", { id: user.id, email: user.email })

      // Verify creator info for debugging
      await verifyAndFixCreatorInfo()

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
        activitiesData,
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
        getActivities(),
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
        activities: activitiesData.length,
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
      setActivities(activitiesData)

      // Debug: Log all profiles to see what we have
      console.log(
        "All profiles:",
        profilesData.map((p) => ({ id: p.id, email: p.email, role: p.role, is_admin: p.is_admin })),
      )

      // Check if current user is admin - try multiple matching strategies
      let currentUserProfile = null

      // Strategy 1: Match by email (most reliable)
      if (user.email) {
        currentUserProfile = profilesData.find((p) => p.email?.toLowerCase() === user.email?.toLowerCase())
        console.log("Email match attempt:", { userEmail: user.email, found: !!currentUserProfile })
      }

      // Strategy 2: Match by auth user ID (if profile.id matches auth.users.id)
      if (!currentUserProfile && user.id) {
        currentUserProfile = profilesData.find((p) => p.id === user.id)
        console.log("ID match attempt:", { userId: user.id, found: !!currentUserProfile })
      }

      if (currentUserProfile) {
        setUserProfile(currentUserProfile)
        const adminStatus = currentUserProfile.is_admin === true || currentUserProfile.role === "admin"
        setIsAdmin(adminStatus)
        console.log("User profile found:", {
          id: currentUserProfile.id,
          email: currentUserProfile.email,
          role: currentUserProfile.role,
          is_admin: currentUserProfile.is_admin,
          computed_admin_status: adminStatus,
        })
      } else {
        // If no profile found, check if this is the first user (should be admin)
        const shouldBeAdmin = profilesData.length === 0
        setIsAdmin(shouldBeAdmin)
        console.log(
          "No user profile found. Profiles count:",
          profilesData.length,
          "Setting admin status to:",
          shouldBeAdmin,
        )

        if (profilesData.length > 0) {
          // There are profiles but current user is not found - this might be an issue
          console.warn(
            "User not found in profiles table but profiles exist. This user might need to be added to the profiles table.",
          )
          toast({
            title: "Profile Not Found",
            description: "Your user profile was not found. Please contact an administrator to set up your account.",
            variant: "destructive",
          })
        }
      }

      // Add low stock alerts to activities if any (only for admins)
      if (isAdmin) {
        const lowStockMaterials = materialsData.filter((m) => m.current_stock <= m.min_stock)
        if (lowStockMaterials.length > 0) {
          for (const material of lowStockMaterials.slice(0, 3)) {
            await logActivity({
              type: "material",
              title: "Low Stock Alert",
              description: `${material.name} is running low (${material.current_stock} ${material.unit} remaining)`,
              icon: "AlertTriangle",
              variant: "destructive",
            })
          }
        }
      }
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

  const reloadMaterials = async () => {
    try {
      console.log("Reloading materials data...")
      const materialsData = await getMaterials()
      setMaterials(materialsData)
      console.log("Materials reloaded successfully:", materialsData.length)
    } catch (error) {
      console.error("Error reloading materials:", error)
    }
  }

  const reloadActivities = async () => {
    try {
      console.log("Reloading activities data...")
      const activitiesData = await getActivities()
      setActivities(activitiesData)
      console.log("Activities reloaded successfully:", activitiesData.length)
    } catch (error) {
      console.error("Error reloading activities:", error)
    }
  }

  const logActivity = async (activity: {
    type: "project" | "worker" | "material" | "daily_log" | "user" | "system"
    title: string
    description: string
    icon: string
    variant?: "default" | "secondary" | "destructive" | "outline"
    reference_type?: string
    reference_id?: string
  }) => {
    try {
      console.log("Logging activity:", activity)

      // Save to database - use user.id instead of user.email
      const savedActivity = await addActivity({
        ...activity,
        created_by: user.id || null, // Use UUID instead of email
      })

      if (savedActivity) {
        // Update local state immediately for better UX
        setActivities((prev) => [savedActivity, ...prev.slice(0, 19)]) // Keep only 20 most recent
        console.log("Activity logged successfully:", savedActivity.id)
      } else {
        console.error("Failed to save activity to database")
      }
    } catch (error) {
      console.error("Error logging activity:", error)
    }
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
      if (!newUserData.email || !newUserData.full_name || !newUserData.password) {
        toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" })
        return
      }

      const newProfile = await addProfile({
        email: newUserData.email,
        full_name: newUserData.full_name,
        role: newUserData.role,
        password: newUserData.password,
        is_admin: newUserData.role === "admin",
      })

      if (newProfile) {
        setProfiles([newProfile, ...profiles]) // Add to beginning for immediate display
        setShowAddUserDialog(false)
        setNewUserData({ email: "", full_name: "", role: "user", password: "" })
        toast({ title: "Success", description: "User created successfully!" })

        // Log activity to database
        await logActivity({
          type: "user",
          title: "User Created",
          description: `New user ${newUserData.full_name} was created`,
          icon: "UserPlus",
          variant: "default",
          reference_type: "profile",
          reference_id: newProfile.id,
        })
      }
    } catch (error) {
      console.error("Error creating user:", error)
      toast({ title: "Error", description: "Failed to create user", variant: "destructive" })
    } finally {
      setCreatingUser(false)
    }
  }

  const handleEditUser = (profile: Profile) => {
    setSelectedUser(profile)
    setEditUserData({
      email: profile.email,
      full_name: profile.full_name,
      role: profile.role,
      password: "", // Don't pre-fill password
    })
    setShowEditUserDialog(true)
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return

    try {
      setUpdatingUser(true)
      if (!editUserData.email || !editUserData.full_name) {
        toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" })
        return
      }

      const updatedProfile = await updateProfile(selectedUser.id, {
        email: editUserData.email,
        full_name: editUserData.full_name,
        role: editUserData.role,
        password: editUserData.password || undefined, // Only send password if provided
        is_admin: editUserData.role === "admin",
      })

      if (updatedProfile) {
        setProfiles(profiles.map((p) => (p.id === selectedUser.id ? updatedProfile : p)))
        setShowEditUserDialog(false)
        setSelectedUser(null)
        toast({ title: "Success", description: "User updated successfully!" })

        // Log activity to database
        await logActivity({
          type: "user",
          title: "User Updated",
          description: `User ${editUserData.full_name} was updated`,
          icon: "Edit",
          variant: "default",
          reference_type: "profile",
          reference_id: updatedProfile.id,
        })
      }
    } catch (error) {
      console.error("Error updating user:", error)
      toast({ title: "Error", description: "Failed to update user", variant: "destructive" })
    } finally {
      setUpdatingUser(false)
    }
  }

  const handleDeleteUser = (profile: Profile) => {
    setSelectedUser(profile)
    setShowDeleteUserDialog(true)
  }

  const confirmDeleteUser = async () => {
    if (!selectedUser) return

    try {
      setDeletingUser(true)
      const success = await deleteProfile(selectedUser.id)

      if (success) {
        setProfiles(profiles.filter((p) => p.id !== selectedUser.id))
        setShowDeleteUserDialog(false)

        // Log activity to database
        await logActivity({
          type: "user",
          title: "User Deleted",
          description: `User ${selectedUser.full_name} was deleted`,
          icon: "Trash2",
          variant: "destructive",
          reference_type: "profile",
          reference_id: selectedUser.id,
        })

        setSelectedUser(null)
        toast({ title: "Success", description: "User deleted successfully!" })
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({ title: "Error", description: "Failed to delete user", variant: "destructive" })
    } finally {
      setDeletingUser(false)
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

  // Get user role for permission checks
  const userRole = userProfile?.role || "user"
  const canAddDailyLogs = isAdmin || userRole === "manager"

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
                  <p className="text-sm text-gray-500">
                    Project Management Dashboard {!isAdmin && !canAddDailyLogs && "(View Only)"}
                    {canAddDailyLogs && !isAdmin && "(Manager Access)"}
                    {userProfile && (
                      <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">{userProfile.full_name}</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" className="bg-white/50 hover:bg-white/80" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Log Out
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full bg-white/50 hover:bg-white/80">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                        {userProfile?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none flex items-center">
                        {userProfile?.full_name || user.email}
                        {isAdmin && <Crown className="h-3 w-3 ml-2 text-yellow-500" />}
                        {!isAdmin && userRole === "manager" && <Briefcase className="h-3 w-3 ml-2 text-blue-500" />}
                        {!isAdmin && userRole !== "manager" && <Eye className="h-3 w-3 ml-2 text-gray-500" />}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">{userProfile?.email || user.email}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {isAdmin ? "Administrator" : userRole === "manager" ? "Manager" : "User (View Only)"}
                      </p>
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
        <Tabs defaultValue="overview" className="space-y-6" value={activeTab} onValueChange={setActiveTab}>
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
                    <h2 className="text-3xl font-bold">
                      Welcome back{userProfile ? `, ${userProfile.full_name.split(" ")[0]}` : ""}!
                    </h2>
                    <p className="text-blue-100 text-lg">
                      Here's what's happening with your construction projects today.
                      {!isAdmin && !canAddDailyLogs && " (View Only Mode)"}
                      {canAddDailyLogs && !isAdmin && " (Manager Access)"}
                    </p>
                  </div>
                  <div className="hidden md:block">
                    <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center">
                      {isAdmin ? (
                        <Building2 className="w-12 h-12 text-white" />
                      ) : canAddDailyLogs ? (
                        <Briefcase className="w-12 h-12 text-white" />
                      ) : (
                        <Eye className="w-12 h-12 text-white" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full"></div>
              <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full"></div>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card
                className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-200 cursor-pointer"
                onClick={() => setActiveTab("projects")}
              >
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

              <Card
                className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-200 cursor-pointer"
                onClick={() => setActiveTab("workers")}
              >
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

              <Card
                className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-200 cursor-pointer"
                onClick={() => setActiveTab("materials")}
              >
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

              <Card
                className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-200 cursor-pointer"
                onClick={() => setActiveTab("daily-logs")}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-700">Total Logs</CardTitle>
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-900">{dailyLogs.length}</div>
                  <p className="text-xs text-purple-600 mt-1">{thisWeekLogs} this week</p>
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
                  <CardDescription>Latest updates from your construction projects (live data)</CardDescription>
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
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">System Users ({profiles.length})</h4>
                        <Button
                          onClick={() => setShowAddUserDialog(true)}
                          size="sm"
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        >
                          <UserPlus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      </div>

                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {profiles.map((profile) => (
                          <div
                            key={profile.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <Avatar className="h-6 w-6 flex-shrink-0">
                                <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                                  {profile.full_name?.charAt(0) || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{profile.full_name}</p>
                                <div className="flex items-center space-x-2">
                                  <p className="text-xs text-gray-500 truncate">{profile.email}</p>
                                  <Badge
                                    variant={
                                      profile.is_admin
                                        ? "default"
                                        : profile.role === "manager"
                                          ? "secondary"
                                          : "outline"
                                    }
                                    className="text-xs flex-shrink-0"
                                  >
                                    {profile.is_admin ? "Admin" : profile.role === "manager" ? "Manager" : profile.role}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-1 flex-shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditUser(profile)}
                                className="h-7 w-7 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteUser(profile)}
                                className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:border-red-300"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Manager Access Notice */}
              {!isAdmin && canAddDailyLogs && (
                <Card className="bg-white/60 backdrop-blur-sm border-gray-200 hover:shadow-lg transition-all duration-200">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Briefcase className="h-5 w-5 mr-2 text-blue-600" />
                      Manager Access
                      <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
                        Manager
                      </Badge>
                    </CardTitle>
                    <CardDescription>Your current access level and permissions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <Briefcase className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-blue-900">Manager</p>
                          <p className="text-xs text-blue-700">Can add daily logs</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-blue-300 text-blue-700">
                        Active
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">What you can do:</h4>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-center">
                          <Eye className="h-4 w-4 mr-2 text-green-500" />
                          View all projects and their details
                        </li>
                        <li className="flex items-center">
                          <Eye className="h-4 w-4 mr-2 text-green-500" />
                          View worker information and schedules
                        </li>
                        <li className="flex items-center">
                          <Eye className="h-4 w-4 mr-2 text-green-500" />
                          View material inventory and usage
                        </li>
                        <li className="flex items-center">
                          <Plus className="h-4 w-4 mr-2 text-blue-500" />
                          Add daily logs and track work progress
                        </li>
                      </ul>

                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-500">Contact your administrator for additional permissions.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* View Only Notice for Standard Users */}
              {!isAdmin && !canAddDailyLogs && (
                <Card className="bg-white/60 backdrop-blur-sm border-gray-200 hover:shadow-lg transition-all duration-200">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Eye className="h-5 w-5 mr-2 text-gray-600" />
                      View Only Access
                      <Badge variant="secondary" className="ml-2 bg-gray-100 text-gray-800">
                        User
                      </Badge>
                    </CardTitle>
                    <CardDescription>Your current access level and permissions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                          <Eye className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Standard User</p>
                          <p className="text-xs text-gray-700">View-only permissions</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-gray-300 text-gray-700">
                        Active
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">What you can do:</h4>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-center">
                          <Eye className="h-4 w-4 mr-2 text-green-500" />
                          View all projects and their details
                        </li>
                        <li className="flex items-center">
                          <Eye className="h-4 w-4 mr-2 text-green-500" />
                          View worker information and schedules
                        </li>
                        <li className="flex items-center">
                          <Eye className="h-4 w-4 mr-2 text-green-500" />
                          View material inventory and usage
                        </li>
                        <li className="flex items-center">
                          <Eye className="h-4 w-4 mr-2 text-green-500" />
                          View daily logs and reports
                        </li>
                      </ul>

                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          Contact your administrator to request additional permissions.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="projects">
            <ProjectsTab projects={projects} setProjects={setProjects} logActivity={logActivity} isAdmin={isAdmin} />
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
              isAdmin={isAdmin}
            />
          </TabsContent>

          <TabsContent value="materials">
            <MaterialsManagement />
          </TabsContent>

          <TabsContent value="daily-logs">
            <DailyLogsTab
              dailyLogs={dailyLogs}
              setDailyLogs={setDailyLogs}
              projects={projects}
              workers={workers}
              materials={materials}
              reloadMaterials={reloadMaterials}
              logActivity={logActivity}
              isAdmin={isAdmin}
              userRole={userRole}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Add User Dialog */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new user account with appropriate permissions</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new_email">Email Address *</Label>
              <Input
                id="new_email"
                type="email"
                placeholder="user@example.com"
                value={newUserData.email}
                onChange={(e) => setNewUserData((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="new_full_name">Full Name *</Label>
              <Input
                id="new_full_name"
                type="text"
                placeholder="Enter full name"
                value={newUserData.full_name}
                onChange={(e) => setNewUserData((prev) => ({ ...prev, full_name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="new_password">Password *</Label>
              <Input
                id="new_password"
                type="password"
                placeholder="Enter password (min 6 characters)"
                value={newUserData.password}
                onChange={(e) => setNewUserData((prev) => ({ ...prev, password: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="new_role">Role</Label>
              <Select
                value={newUserData.role}
                onValueChange={(value) => setNewUserData((prev) => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User (View Only)</SelectItem>
                  <SelectItem value="manager">Manager (Can Add Daily Logs)</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="admin">Admin (Full Access)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information and permissions</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_email">Email Address *</Label>
              <Input
                id="edit_email"
                type="email"
                placeholder="user@example.com"
                value={editUserData.email}
                onChange={(e) => setEditUserData((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit_full_name">Full Name *</Label>
              <Input
                id="edit_full_name"
                type="text"
                placeholder="Enter full name"
                value={editUserData.full_name}
                onChange={(e) => setEditUserData((prev) => ({ ...prev, full_name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit_password">Password (leave blank to keep current)</Label>
              <Input
                id="edit_password"
                type="password"
                placeholder="Enter new password"
                value={editUserData.password}
                onChange={(e) => setEditUserData((prev) => ({ ...prev, password: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit_role">Role</Label>
              <Select
                value={editUserData.role}
                onValueChange={(value) => setEditUserData((prev) => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User (View Only)</SelectItem>
                  <SelectItem value="manager">Manager (Can Add Daily Logs)</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="admin">Admin (Full Access)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditUserDialog(false)} disabled={updatingUser}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser} disabled={updatingUser}>
              {updatingUser ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update User"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <AlertDialog open={showDeleteUserDialog} onOpenChange={setShowDeleteUserDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedUser?.full_name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingUser}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUser}
              disabled={deletingUser}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingUser ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete User"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
