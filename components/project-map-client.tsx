"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import type { Project } from "@/lib/database"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"

// Fix for default marker icon
const createIcon = () => {
  return L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  })
}

interface ProjectMapClientProps {
  projects: Project[]
}

export default function ProjectMapClient({ projects = [] }: ProjectMapClientProps) {
  const [mounted, setMounted] = useState(false)
  const [customIcon, setCustomIcon] = useState<L.Icon | null>(null)

  useEffect(() => {
    setMounted(true)
    setCustomIcon(createIcon())

    setTimeout(() => {
      window.dispatchEvent(new Event("resize"))
    }, 100)
  }, [])

  if (!mounted || !customIcon) return <div className="h-[500px] bg-gray-100 rounded-lg animate-pulse" />

  // Filter projects with valid coordinates
  const validProjects = Array.isArray(projects)
    ? projects.filter((p) => p.latitude && p.longitude && !isNaN(p.latitude) && !isNaN(p.longitude))
    : []

  if (validProjects.length === 0) {
    return (
      <div className="h-[500px] bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
        No projects with valid coordinates to display.
      </div>
    )
  }

  // Calculate center
  const centerLat = validProjects.reduce((sum, p) => sum + (p.latitude || 0), 0) / validProjects.length
  const centerLng = validProjects.reduce((sum, p) => sum + (p.longitude || 0), 0) / validProjects.length

  return (
    <div className="h-[500px] rounded-lg overflow-hidden border shadow-sm z-0 relative">
      <MapContainer center={[centerLat, centerLng]} zoom={10} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validProjects.map((project) => (
          <Marker key={project.id} position={[project.latitude!, project.longitude!]} icon={customIcon}>
            <Popup>
              <div className="p-1">
                <h3 className="font-bold text-sm mb-1">{project.name}</h3>
                <p className="text-xs text-gray-600 mb-2">{project.location}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    {project.status}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() =>
                      window.open(
                        `https://www.google.com/maps/search/?api=1&query=${project.latitude},${project.longitude}`,
                        "_blank",
                      )
                    }
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
