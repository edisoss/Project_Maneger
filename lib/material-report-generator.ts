import type { Material, MaterialTransaction, Project } from "./database"
import { getMaterialTransactions } from "./database"

export interface MaterialUsageSummary {
  materialId: string
  materialName: string
  category: string
  unit: string
  currentStock: number
  minStock: number
  location: string
  totalUsed: number
  totalAdded: number
  totalReturned: number
  totalAdjusted: number
  netUsage: number
  transactionCount: number
  averageUsagePerDay: number
  stockStatus: "In Stock" | "Low Stock" | "Out of Stock"
  estimatedValue: number
  lastTransactionDate?: string
  usageByProject: Record<string, number>
}

export interface MaterialReportData {
  reportTitle: string
  dateRange: {
    startDate: string
    endDate: string
  }
  generatedAt: string
  totalMaterials: number
  totalTransactions: number
  totalValue: number
  reportPeriodDays: number
  materials: MaterialUsageSummary[]
  transactions: MaterialTransaction[]
  summary: {
    totalUsed: number
    totalAdded: number
    totalReturned: number
    totalAdjusted: number
    lowStockCount: number
    outOfStockCount: number
    mostUsedMaterial: string
    leastUsedMaterial: string
  }
}

export const generateMaterialReport = async (
  materials: Material[],
  projects: Project[],
  selectedMaterialIds: string[],
  startDate: Date,
  endDate: Date,
  reportType: "summary" | "detailed" | "usage-analysis" = "summary",
): Promise<MaterialReportData> => {
  // Filter materials based on selection
  const filteredMaterials =
    selectedMaterialIds.length > 0 ? materials.filter((m) => selectedMaterialIds.includes(m.id)) : materials

  // Get all transactions for the selected materials within date range
  const allTransactions: MaterialTransaction[] = []

  for (const material of filteredMaterials) {
    try {
      const transactions = await getMaterialTransactions(material.id)
      const filteredTransactions = transactions.filter((t) => {
        const transactionDate = new Date(t.created_at)
        return transactionDate >= startDate && transactionDate <= endDate
      })
      allTransactions.push(...filteredTransactions)
    } catch (error) {
      console.error(`Error fetching transactions for material ${material.id}:`, error)
    }
  }

  // Calculate usage summaries
  const materialSummaries: MaterialUsageSummary[] = filteredMaterials.map((material) => {
    const materialTransactions = allTransactions.filter((t) => t.material_id === material.id)

    const totalUsed = materialTransactions
      .filter((t) => t.transaction_type === "used")
      .reduce((sum, t) => sum + t.quantity, 0)

    const usageByProject: Record<string, number> = {}
    materialTransactions
      .filter((t) => t.transaction_type === "used")
      .forEach((t) => {
        // Clean up project name if it starts with "Project: "
        const rawProjectName = t.project || "Unknown Project"
        const projectName = rawProjectName.startsWith("Project: ") ? rawProjectName.substring(9) : rawProjectName

        usageByProject[projectName] = (usageByProject[projectName] || 0) + t.quantity
      })

    const totalAdded = materialTransactions
      .filter((t) => t.transaction_type === "added")
      .reduce((sum, t) => sum + t.quantity, 0)

    const totalReturned = materialTransactions
      .filter((t) => t.transaction_type === "returned")
      .reduce((sum, t) => sum + t.quantity, 0)

    const totalAdjusted = materialTransactions
      .filter((t) => t.transaction_type === "adjusted")
      .reduce((sum, t) => sum + Math.abs(t.quantity), 0)

    const netUsage = totalUsed - totalReturned
    const reportPeriodDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
    const averageUsagePerDay = netUsage / reportPeriodDays

    const stockStatus =
      material.current_stock <= 0
        ? "Out of Stock"
        : material.current_stock <= material.min_stock
          ? "Low Stock"
          : "In Stock"

    const lastTransaction = materialTransactions.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0]

    return {
      materialId: material.id,
      materialName: material.name,
      category: material.category,
      unit: material.unit,
      currentStock: material.current_stock,
      minStock: material.min_stock,
      location: material.location,
      totalUsed,
      totalAdded,
      totalReturned,
      totalAdjusted,
      netUsage,
      transactionCount: materialTransactions.length,
      averageUsagePerDay,
      stockStatus: stockStatus as "In Stock" | "Low Stock" | "Out of Stock",
      estimatedValue: material.current_stock * 10, // Placeholder - would need actual pricing data
      lastTransactionDate: lastTransaction?.created_at,
      usageByProject,
    }
  })

  // Calculate overall summary
  const totalUsed = materialSummaries.reduce((sum, m) => sum + m.totalUsed, 0)
  const totalAdded = materialSummaries.reduce((sum, m) => sum + m.totalAdded, 0)
  const totalReturned = materialSummaries.reduce((sum, m) => sum + m.totalReturned, 0)
  const totalAdjusted = materialSummaries.reduce((sum, m) => sum + m.totalAdjusted, 0)
  const lowStockCount = materialSummaries.filter((m) => m.stockStatus === "Low Stock").length
  const outOfStockCount = materialSummaries.filter((m) => m.stockStatus === "Out of Stock").length

  const mostUsedMaterial =
    materialSummaries.reduce(
      (prev, current) => (prev.totalUsed > current.totalUsed ? prev : current),
      materialSummaries[0],
    )?.materialName || "N/A"

  const leastUsedMaterial =
    materialSummaries.reduce(
      (prev, current) => (prev.totalUsed < current.totalUsed ? prev : current),
      materialSummaries[0],
    )?.materialName || "N/A"

  const reportPeriodDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))

  return {
    reportTitle: `Material ${reportType === "summary" ? "Summary" : reportType === "detailed" ? "Detailed" : "Usage Analysis"} Report`,
    dateRange: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
    generatedAt: new Date().toISOString(),
    totalMaterials: filteredMaterials.length,
    totalTransactions: allTransactions.length,
    totalValue: materialSummaries.reduce((sum, m) => sum + m.estimatedValue, 0),
    reportPeriodDays,
    materials: materialSummaries,
    transactions: reportType === "detailed" ? allTransactions : [],
    summary: {
      totalUsed,
      totalAdded,
      totalReturned,
      totalAdjusted,
      lowStockCount,
      outOfStockCount,
      mostUsedMaterial,
      leastUsedMaterial,
    },
  }
}

export const generateUsageSummary = (reportData: MaterialReportData): string => {
  const { materials, summary, reportPeriodDays } = reportData

  let summaryText = `Material Usage Summary (${reportPeriodDays} days):\n\n`

  summaryText += `• Total Materials Tracked: ${materials.length}\n`
  summaryText += `• Total Usage: ${summary.totalUsed} units\n`
  summaryText += `• Total Added: ${summary.totalAdded} units\n`
  summaryText += `• Total Returned: ${summary.totalReturned} units\n`
  summaryText += `• Materials with Low Stock: ${summary.lowStockCount}\n`
  summaryText += `• Materials Out of Stock: ${summary.outOfStockCount}\n`
  summaryText += `• Most Used Material: ${summary.mostUsedMaterial}\n`
  summaryText += `• Least Used Material: ${summary.leastUsedMaterial}\n`

  return summaryText
}
