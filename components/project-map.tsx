"use client"

import dynamic from "next/dynamic"
import type { Project } from "@/lib/database"

const ProjectMapClient = dynamic(() => import("./project-map-client"), {
  ssr: false,
  loading: () => <div className="h-[500px] bg-gray-100 rounded-lg animate-pulse" />,
})

interface ProjectMapProps {
  projects: Project[]
}

export default function ProjectMap({ projects }: ProjectMapProps) {
  return <ProjectMapClient projects={projects} />
}
