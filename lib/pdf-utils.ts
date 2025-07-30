import jsPDF from "jspdf"
import html2canvas from "html2canvas"

export interface PDFOptions {
  filename?: string
  format?: "a4" | "letter"
  orientation?: "portrait" | "landscape"
  margin?: number
  quality?: number
}

export async function generatePDFFromHTML(element: HTMLElement, options: PDFOptions = {}): Promise<void> {
  const { filename = "report.pdf", format = "a4", orientation = "portrait", margin = 10, quality = 1 } = options

  try {
    // Convert HTML element to canvas
    const canvas = await html2canvas(element, {
      scale: quality,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
    })

    const imgData = canvas.toDataURL("image/png")

    // Create PDF
    const pdf = new jsPDF({
      orientation,
      unit: "mm",
      format,
    })

    // Calculate dimensions
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = pdfWidth - margin * 2
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    let heightLeft = imgHeight
    let position = margin

    // Add first page
    pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight)
    heightLeft -= pdfHeight - margin * 2

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight + margin
      pdf.addPage()
      pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight)
      heightLeft -= pdfHeight - margin * 2
    }

    // Save the PDF
    pdf.save(filename)
  } catch (error) {
    console.error("Error generating PDF:", error)
    throw new Error("Failed to generate PDF")
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
