"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Database } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function MigrationButton() {
  const [isRunning, setIsRunning] = useState(false)
  const { toast } = useToast()

  const runMigration = async () => {
    setIsRunning(true)
    try {
      const response = await fetch("/api/run-migration", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Migration Successful",
          description: "Database schema has been updated. Please refresh the page.",
        })
      } else {
        toast({
          title: "Migration Failed",
          description: data.error || "An error occurred during migration",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Migration Failed",
        description: "Could not connect to the server",
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Button onClick={runMigration} disabled={isRunning}>
      {isRunning ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Running Migration...
        </>
      ) : (
        <>
          <Database className="mr-2 h-4 w-4" />
          Run Database Migration
        </>
      )}
    </Button>
  )
}
