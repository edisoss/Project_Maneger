"use client"

import { useState } from "react"
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileText, Download, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClientClient } from "@/lib/supabase-client"

interface QualityControlDocumentProps {
  projectId: string
  projectName: string
  onClose: () => void
}

export default function QualityControlDocument({ projectId, projectName, onClose }: QualityControlDocumentProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    object: projectName,
    contractor: 'S/A "Moduils Engineering"',
    date: new Date().toISOString().split("T")[0],
    inspectionNumber: "1",
    inspectionObject: "Kabeļu trepju izbūve",
    reportNumber: "EL-013",
    inspectionItems: [
      { number: "1.1", workerDate: "", workerSignature: "", supervisorDate: "", supervisorSignature: "", notes: "" },
      { number: "1.2", workerDate: "", workerSignature: "", supervisorDate: "", supervisorSignature: "", notes: "" },
      { number: "1.3", workerDate: "", workerSignature: "", supervisorDate: "", supervisorSignature: "", notes: "" },
      {
        number: "1.4",
        workerDate: "",
        workerSignature: "",
        supervisorDate: "",
        supervisorSignature: "",
        notes: "Izpildshēma Nr. TUK-EL-KT-S01-08",
      },
      {
        number: "1.5",
        workerDate: "",
        workerSignature: "",
        supervisorDate: "",
        supervisorSignature: "",
        notes: "Izpildshēma Nr. TUK-EL-KT-S01-08",
      },
    ],
    supervisorName: "Jānis Indrāns",
    supervisorDate: "",
    managerName: "Aleksandrs Kovaļovs",
    managerDate: "",
  })

  const handleSave = async () => {
    try {
      setSaving(true)
      const supabase = createClientClient()
      if (!supabase) return

      const documentData = {
        project_id: Number.parseInt(projectId),
        template_id: null,
        document_name: "Kvalitātes kontroles akts (KKA)",
        document_number: "EL-04",
        revision_number: "01",
        document_data: formData,
        created_by: "current_user",
      }

      const { data, error } = await supabase.from("generated_documents").insert([documentData]).select().single()

      if (error) throw error

      toast({
        title: "Success",
        description: "Quality control document saved successfully",
      })

      onClose()
    } catch (error) {
      console.error("Error saving document:", error)
      toast({
        title: "Error",
        description: "Failed to save document",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const buildDocumentHTML = () => {
    const inspectionDescriptions = [
      "Materiālu un iekārtu kvalitāti apliecinošā dokumentācija (BIS vidē)",
      "Materiālu kvalitātes (defektu) pārbaude, pēc materiālu izbūves (Vizuāli)",
      "Kabeļu trepju kvalitātes pārbaude (Vizuāli)",
      "Stiprinājumu uzstādīšana kabeļu trepēm pēc projekta",
      "Kabeļu trepju uzstādīšana pēc projekta",
    ]

    const rows = formData.inspectionItems
      .map(
        (item, idx) => `
        <tr>
          <td style="text-align:center;">1.${idx + 1}</td>
          <td>${inspectionDescriptions[idx] ?? ""}</td>
          <td style="text-align:center;">${item.workerDate ?? ""}</td>
          <td style="text-align:center;">${item.workerSignature ?? ""}</td>
          <td style="text-align:center;">${item.supervisorDate ?? ""}</td>
          <td style="text-align:center;">${item.supervisorSignature ?? ""}</td>
          <td style="text-align:center;">${item.notes ?? ""}</td>
        </tr>`,
      )
      .join("")

    return `<!DOCTYPE html>
<html lang="lv">
<head>
<meta charset="UTF-8" />
<title>KKA_${formData.object}_${formData.date}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; margin: 24px; color: #000; font-size: 12px; }
  .header { text-align: center; border: 1px solid #000; padding: 8px; }
  .header h1 { font-size: 16px; margin: 0; }
  .header h2 { font-size: 14px; margin: 2px 0; }
  .header p { margin: 2px 0; font-size: 11px; }
  .info { width: 100%; border-collapse: collapse; margin-top: 8px; }
  .info td { border: 1px solid #000; padding: 4px 6px; }
  table.items { width: 100%; border-collapse: collapse; margin-top: 12px; }
  table.items th, table.items td { border: 1px solid #000; padding: 5px; vertical-align: top; }
  table.items th { background: #e8e8e8; text-align: center; }
  .section { font-weight: bold; background: #f3f3f3; }
  .sig { width: 100%; border-collapse: collapse; margin-top: 20px; }
  .sig th, .sig td { border: 1px solid #000; padding: 6px; }
  .sig-title { font-weight: bold; text-align: center; margin-top: 24px; }
  @media print { body { margin: 0; padding: 12px; } }
</style>
</head>
<body>
  <div class="header">
    <h1>Kvalitātes kontroles akts (KKA)</h1>
    <h2>EL kabeļu trepju izbūve</h2>
    <p>ME Nr. EL-04 &nbsp;|&nbsp; Rev. 01</p>
  </div>

  <table class="info">
    <tr><td><strong>Objekts:</strong> ${formData.object}</td><td style="width:30%;"><strong>Datums:</strong> ${formData.date}</td></tr>
    <tr><td colspan="2"><strong>Izpildītājs:</strong> ${formData.contractor}</td></tr>
    <tr><td><strong>Pārbaudes Nr:</strong> ${formData.inspectionNumber}</td><td><strong>Pārbaudāmais objekts:</strong> ${formData.inspectionObject}</td></tr>
  </table>

  <table class="items">
    <thead>
      <tr>
        <th rowspan="2" style="width:6%;">N.P.K</th>
        <th rowspan="2" style="width:34%;">Pārbaudes veids</th>
        <th colspan="2">Darbuzņēmējs</th>
        <th colspan="2">PRO DEV Būvdarbu vadītājs</th>
        <th rowspan="2" style="width:16%;">Piezīmes</th>
      </tr>
      <tr>
        <th>Datums</th><th>Paraksts</th><th>Datums</th><th>Paraksts</th>
      </tr>
    </thead>
    <tbody>
      <tr><td class="section" colspan="7">1. Pārbaudes veicēja V.Uzvārds</td></tr>
      ${rows}
      <tr><td class="section" colspan="7">2. Akta pielikumi:</td></tr>
      <tr><td style="text-align:center;">2.1</td><td colspan="6">Izpildshēma: TUK-EL-KT-S01-08</td></tr>
    </tbody>
  </table>

  <div class="sig-title">Visi iepriekš minētie darbi ir pārbaudīti un tiek uzskatīti par atbilstošiem prasībām</div>
  <table class="sig">
    <tr>
      <th style="width:25%;">Vārds, uzvārds</th>
      <th>PRO DEV uzraudzošais būvdarbu vadītājs</th>
      <th>Būvdarbu vadītājs</th>
    </tr>
    <tr><td></td><td style="text-align:center;">${formData.supervisorName}</td><td style="text-align:center;">${formData.managerName}</td></tr>
    <tr><th>Datums</th><td style="text-align:center;">${formData.supervisorDate || ""}</td><td style="text-align:center;">${formData.managerDate || ""}</td></tr>
    <tr><th>Paraksts</th><td style="height:48px;"></td><td></td></tr>
  </table>
</body>
</html>`
  }

  const handleGeneratePDF = () => {
    try {
      const html = buildDocumentHTML()

      // Use a hidden iframe so the browser's native "Save as PDF" print dialog
      // is used. This avoids bundling jsPDF on the client (which breaks in preview)
      // and reliably produces a PDF that opens correctly.
      const iframe = document.createElement("iframe")
      iframe.style.position = "fixed"
      iframe.style.right = "0"
      iframe.style.bottom = "0"
      iframe.style.width = "0"
      iframe.style.height = "0"
      iframe.style.border = "0"
      document.body.appendChild(iframe)

      const iframeDoc = iframe.contentWindow?.document
      if (!iframeDoc) {
        throw new Error("Could not access print frame")
      }

      iframeDoc.open()
      iframeDoc.write(html)
      iframeDoc.close()

      // Wait for content to render before invoking print
      const printAndCleanup = () => {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
        // Remove the iframe after the print dialog has had time to open
        setTimeout(() => {
          document.body.removeChild(iframe)
        }, 1000)
      }

      if (iframe.contentWindow) {
        setTimeout(printAndCleanup, 300)
      }

      toast({
        title: "PDF ready",
        description: "Use your browser's print dialog to save as PDF.",
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      })
    }
  }

  return (
    <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Kvalitātes kontroles akts (KKA)
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-6">
        {/* Header Information */}
        <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
          <div className="col-span-2">
            <Label>Objekts: Katastrofu pārvaldības centrs</Label>
            <Input
              value={formData.object}
              onChange={(e) => setFormData({ ...formData, object: e.target.value })}
              placeholder="Project location"
            />
          </div>
          <div>
            <Label>Izpildītājs</Label>
            <Input
              value={formData.contractor}
              onChange={(e) => setFormData({ ...formData, contractor: e.target.value })}
            />
          </div>
          <div>
            <Label>Datums</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
          <div>
            <Label>Pārbaudes Nr</Label>
            <Input
              value={formData.inspectionNumber}
              onChange={(e) => setFormData({ ...formData, inspectionNumber: e.target.value })}
            />
          </div>
          <div>
            <Label>Pārbaudāmais objekts</Label>
            <Input
              value={formData.inspectionObject}
              onChange={(e) => setFormData({ ...formData, inspectionObject: e.target.value })}
            />
          </div>
        </div>

        {/* Inspection Items Table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted p-2 font-semibold text-center">Pārbaudes datums un paraksts</div>

          <div className="grid grid-cols-12 gap-2 p-2 bg-muted/30 font-semibold text-sm">
            <div className="col-span-1">N.P.K</div>
            <div className="col-span-4">Pārbaudes veids</div>
            <div className="col-span-3">Darbuzņēmējs</div>
            <div className="col-span-3">PRO DEV Būvdarbu vadītājs</div>
            <div className="col-span-1">Piezīmes</div>
          </div>

          <div className="p-2 space-y-2">
            <div className="font-semibold text-sm p-2 bg-muted/20">1. Pārbaudes veicēja V.Uzvārds</div>

            {[
              { num: "1.1", desc: "Materiālu un iekārtu kvalitāti apliecinošā dokumentācija (BIS vide)" },
              { num: "1.2", desc: "Materiālu kvalitātes (defektu) pārbaude, pēc materiālu izbūves (Vizuāli)" },
              { num: "1.3", desc: "Kabeļu trepju kvalitātes pārbaude (Vizuāli)" },
              { num: "1.4", desc: "Stiprinājumu uzstādīšana kabeļu trečēm pēc projekta" },
              { num: "1.5", desc: "Kabeļu trepju uzstādīšana pēc projekta" },
            ].map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-start border-b pb-2">
                <div className="col-span-1 text-sm font-medium pt-2">{item.num}</div>
                <div className="col-span-4 text-sm pt-2">{item.desc}</div>
                <div className="col-span-3 space-y-1">
                  <Input
                    type="date"
                    placeholder="Datums"
                    className="h-8 text-xs"
                    value={formData.inspectionItems[idx].workerDate}
                    onChange={(e) => {
                      const items = [...formData.inspectionItems]
                      items[idx].workerDate = e.target.value
                      setFormData({ ...formData, inspectionItems: items })
                    }}
                  />
                  <Input
                    placeholder="Paraksts"
                    className="h-8 text-xs"
                    value={formData.inspectionItems[idx].workerSignature}
                    onChange={(e) => {
                      const items = [...formData.inspectionItems]
                      items[idx].workerSignature = e.target.value
                      setFormData({ ...formData, inspectionItems: items })
                    }}
                  />
                </div>
                <div className="col-span-3 space-y-1">
                  <Input
                    type="date"
                    placeholder="Datums"
                    className="h-8 text-xs"
                    value={formData.inspectionItems[idx].supervisorDate}
                    onChange={(e) => {
                      const items = [...formData.inspectionItems]
                      items[idx].supervisorDate = e.target.value
                      setFormData({ ...formData, inspectionItems: items })
                    }}
                  />
                  <Input
                    placeholder="Paraksts"
                    className="h-8 text-xs"
                    value={formData.inspectionItems[idx].supervisorSignature}
                    onChange={(e) => {
                      const items = [...formData.inspectionItems]
                      items[idx].supervisorSignature = e.target.value
                      setFormData({ ...formData, inspectionItems: items })
                    }}
                  />
                </div>
                <div className="col-span-1">
                  <Input
                    placeholder="Notes"
                    className="h-8 text-xs"
                    value={formData.inspectionItems[idx].notes}
                    onChange={(e) => {
                      const items = [...formData.inspectionItems]
                      items[idx].notes = e.target.value
                      setFormData({ ...formData, inspectionItems: items })
                    }}
                  />
                </div>
              </div>
            ))}

            <div className="font-semibold text-sm p-2 bg-muted/20 mt-4">2. Akta pielikumi:</div>
            <div className="text-sm p-2">2.1 Izpildshēma: TUK-EL-KT-S01-08</div>
          </div>
        </div>

        {/* Signatures Section */}
        <div className="border rounded-lg p-4 space-y-4">
          <div className="font-semibold">
            Visi iepriekš minētie darbi ir pārbaudīti un tiek uzskatīti par atbilstošiem prasībām
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">Vārds, uzvārds</Label>
            </div>
            <div>
              <Label className="text-xs">PRO DEV uzraudzošais būvdarbu vadītājs</Label>
              <Input
                value={formData.supervisorName}
                onChange={(e) => setFormData({ ...formData, supervisorName: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Būvdarbu vadītājs</Label>
              <Input
                value={formData.managerName}
                onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">Datums</Label>
            </div>
            <div>
              <Input
                type="date"
                value={formData.supervisorDate}
                onChange={(e) => setFormData({ ...formData, supervisorDate: e.target.value })}
              />
            </div>
            <div>
              <Input
                type="date"
                value={formData.managerDate}
                onChange={(e) => setFormData({ ...formData, managerDate: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">Paraksts</Label>
            </div>
            <div className="h-12 border-t border-gray-400"></div>
            <div className="h-12 border-t border-gray-400"></div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handleGeneratePDF}>
            <Download className="h-4 w-4 mr-2" />
            Generate PDF
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Document"
            )}
          </Button>
        </div>
      </div>
    </DialogContent>
  )
}
