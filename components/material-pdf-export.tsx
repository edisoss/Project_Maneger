"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
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
  FileText,
  Download,
  Calendar,
  Package,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Eye,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Material, Project } from "@/lib/database"
import { generateMaterialReport, type MaterialReportData } from "@/lib/material-report-generator"
import { generatePDFFromHTML, formatDate, formatDateTime, formatCurrency } from "@/lib/pdf-utils"

interface MaterialPDFExportProps {
  materials: Material[]
  projects: Project[]
}

export function MaterialPDFExport({ materials, projects }: MaterialPDFExportProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([])
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setMonth(date.getMonth() - 1)
    return date.toISOString().split("T")[0]
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0])
  const [reportType, setReportType] = useState<"summary" | "detailed" | "usage-analysis">("summary")
  const [includeTransactionDetails, setIncludeTransactionDetails] = useState(true)
  const [groupByProject, setGroupByProject] = useState(false)
  const [includeCharts, setIncludeCharts] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [reportData, setReportData] = useState<MaterialReportData | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const { toast } = useToast()

  const handleMaterialSelection = (materialId: string, checked: boolean) => {
    if (checked) {
      setSelectedMaterials([...selectedMaterials, materialId])
    } else {
      setSelectedMaterials(selectedMaterials.filter((id) => id !== materialId))
    }
  }

  const handleSelectAll = () => {
    setSelectedMaterials(materials.map((m) => m.id))
  }

  const handleClearAll = () => {
    setSelectedMaterials([])
  }

  const generateReport = async () => {
    try {
      setGenerating(true)

      if (!startDate || !endDate) {
        toast({
          title: "Error",
          description: "Please select both start and end dates",
          variant: "destructive",
        })
        return
      }

      const start = new Date(startDate)
      const end = new Date(endDate)

      if (start >= end) {
        toast({
          title: "Error",
          description: "Start date must be before end date",
          variant: "destructive",
        })
        return
      }

      const data = await generateMaterialReport(materials, projects, selectedMaterials, start, end, reportType)

      setReportData(data)
      setShowPreview(true)

      toast({
        title: "Success",
        description: "Report generated successfully!",
      })
    } catch (error) {
      console.error("Error generating report:", error)
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  const exportToPDF = async () => {
    if (!reportData) return

    try {
      setGenerating(true)

      const reportElement = document.getElementById("material-report-preview")
      if (!reportElement) {
        throw new Error("Report preview element not found")
      }

      const filename = `material-report-${reportType}-${startDate}-to-${endDate}.pdf`

      await generatePDFFromHTML(reportElement, {
        filename,
        format: "a4",
        orientation: "portrait",
        quality: 1,
      })

      toast({
        title: "Success",
        description: "PDF exported successfully!",
      })
    } catch (error) {
      console.error("Error exporting PDF:", error)
      toast({
        title: "Error",
        description: "Failed to export PDF. Please try again.",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  const getStockStatusBadge = (status: string) => {
    switch (status) {
      case "In Stock":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        )
      case "Low Stock":
        return (
          <Badge variant="outline" className="border-yellow-300 text-yellow-700">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        )
      case "Out of Stock":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const ReportPreview = ({ data }: { data: MaterialReportData }) => (
    <div id="material-report-preview" className="bg-white p-8 max-w-4xl mx-auto">
      {/* Report Header */}
      <div className="text-center mb-8 border-b pb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{data.reportTitle}</h1>
        <p className="text-lg text-gray-600 mb-4">
          {formatDate(data.dateRange.startDate)} - {formatDate(data.dateRange.endDate)}
        </p>
        <p className="text-sm text-gray-500">Generated on {formatDateTime(data.generatedAt)}</p>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <Package className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-blue-900">{data.totalMaterials}</div>
          <div className="text-sm text-blue-700">Total Materials</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <Activity className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-900">{data.totalTransactions}</div>
          <div className="text-sm text-green-700">Transactions</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-purple-900">{formatCurrency(data.totalValue)}</div>
          <div className="text-sm text-purple-700">Estimated Value</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg text-center">
          <Calendar className="h-8 w-8 text-orange-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-orange-900">{data.reportPeriodDays}</div>
          <div className="text-sm text-orange-700">Report Period (Days)</div>
        </div>
      </div>

      {/* Usage Summary */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Usage Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-red-50 p-3 rounded border-l-4 border-red-400">
            <div className="flex items-center">
              <TrendingDown className="h-5 w-5 text-red-600 mr-2" />
              <div>
                <div className="font-semibold text-red-900">{data.summary.totalUsed}</div>
                <div className="text-sm text-red-700">Total Used</div>
              </div>
            </div>
          </div>
          <div className="bg-green-50 p-3 rounded border-l-4 border-green-400">
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <div className="font-semibold text-green-900">{data.summary.totalAdded}</div>
                <div className="text-sm text-green-700">Total Added</div>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
              <div>
                <div className="font-semibold text-yellow-900">{data.summary.lowStockCount}</div>
                <div className="text-sm text-yellow-700">Low Stock</div>
              </div>
            </div>
          </div>
          <div className="bg-red-50 p-3 rounded border-l-4 border-red-400">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <div>
                <div className="font-semibold text-red-900">{data.summary.outOfStockCount}</div>
                <div className="text-sm text-red-700">Out of Stock</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Material Usage Table */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Material Usage Details</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-2 text-left">Material</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Category</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Current Stock</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Used</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Added</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Net Usage</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Status</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Est. Value</th>
              </tr>
            </thead>
            <tbody>
              {data.materials.map((material) => (
                <tr key={material.materialId} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">
                    <div>
                      <div className="font-medium">{material.materialName}</div>
                      <div className="text-sm text-gray-500">{material.location}</div>
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">{material.category}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {material.currentStock} {material.unit}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right text-red-600">
                    {material.totalUsed} {material.unit}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right text-green-600">
                    {material.totalAdded} {material.unit}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {material.netUsage} {material.unit}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        material.stockStatus === "In Stock"
                          ? "bg-green-100 text-green-800"
                          : material.stockStatus === "Low Stock"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {material.stockStatus}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {formatCurrency(material.estimatedValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Usage Analysis (for usage-analysis report type) */}
      {reportType === "usage-analysis" && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Usage Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.materials.map((material) => (
              <div key={material.materialId} className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">{material.materialName}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Average Daily Usage:</span>
                    <span className="font-medium">
                      {material.averageUsagePerDay.toFixed(2)} {material.unit}/day
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Transactions:</span>
                    <span className="font-medium">{material.transactionCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Transaction:</span>
                    <span className="font-medium">
                      {material.lastTransactionDate ? formatDate(material.lastTransactionDate) : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stock Status:</span>
                    <span
                      className={`font-medium ${
                        material.stockStatus === "In Stock"
                          ? "text-green-600"
                          : material.stockStatus === "Low Stock"
                            ? "text-yellow-600"
                            : "text-red-600"
                      }`}
                    >
                      {material.stockStatus}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction Details (for detailed report type) */}
      {reportType === "detailed" && includeTransactionDetails && data.transactions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Transaction Details</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">Date</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Material</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Type</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Quantity</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Project</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Notes</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((transaction) => {
                    const material = data.materials.find((m) => m.materialId === transaction.material_id)
                    return (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-2">{formatDate(transaction.created_at)}</td>
                        <td className="border border-gray-300 px-4 py-2">{material?.materialName || "Unknown"}</td>
                        <td className="border border-gray-300 px-4 py-2">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              transaction.transaction_type === "used"
                                ? "bg-red-100 text-red-800"
                                : transaction.transaction_type === "added"
                                  ? "bg-green-100 text-green-800"
                                  : transaction.transaction_type === "returned"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {transaction.transaction_type}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-right">
                          {transaction.transaction_type === "used" ? "-" : "+"}
                          {transaction.quantity} {material?.unit || ""}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">{transaction.project || "N/A"}</td>
                        <td className="border border-gray-300 px-4 py-2">{transaction.notes || "N/A"}</td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report Footer */}
      <div className="text-center text-sm text-gray-500 border-t pt-4">
        <p>This report was generated automatically by the Construction Management System</p>
        <p>Generated on {formatDateTime(data.generatedAt)}</p>
      </div>
    </div>
  )

  return (
    <>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Export Material Report</DialogTitle>
            <DialogDescription>Generate a comprehensive PDF report of material usage and inventory</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Report Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="end-date">End Date</Label>
                <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            <div>
              <Label htmlFor="report-type">Report Type</Label>
              <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Summary Report</SelectItem>
                  <SelectItem value="detailed">Detailed Report</SelectItem>
                  <SelectItem value="usage-analysis">Usage Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Material Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Select Materials</Label>
                <div className="space-x-2">
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleClearAll}>
                    Clear All
                  </Button>
                </div>
              </div>
              <ScrollArea className="h-48 border rounded p-4">
                <div className="space-y-2">
                  {materials.map((material) => (
                    <div key={material.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={material.id}
                        checked={selectedMaterials.includes(material.id)}
                        onCheckedChange={(checked) => handleMaterialSelection(material.id, checked as boolean)}
                      />
                      <Label htmlFor={material.id} className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <span>{material.name}</span>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {material.category}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {material.current_stock} {material.unit}
                            </span>
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <p className="text-sm text-gray-500 mt-2">
                {selectedMaterials.length === 0
                  ? "All materials will be included"
                  : `${selectedMaterials.length} materials selected`}
              </p>
            </div>

            {/* Report Options */}
            <div className="space-y-3">
              <Label>Report Options</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-transactions"
                    checked={includeTransactionDetails}
                    onCheckedChange={setIncludeTransactionDetails}
                  />
                  <Label htmlFor="include-transactions">Include transaction details</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="group-by-project" checked={groupByProject} onCheckedChange={setGroupByProject} />
                  <Label htmlFor="group-by-project">Group by project</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="include-charts" checked={includeCharts} onCheckedChange={setIncludeCharts} />
                  <Label htmlFor="include-charts">Include charts and visualizations</Label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button onClick={generateReport} disabled={generating}>
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Report Preview</DialogTitle>
            <DialogDescription>Review your report before exporting to PDF</DialogDescription>
          </DialogHeader>

          {reportData && <ReportPreview data={reportData} />}

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close Preview
            </Button>
            <Button onClick={exportToPDF} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
