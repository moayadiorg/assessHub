import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export interface PDFExportOptions {
  filename?: string
  orientation?: 'portrait' | 'landscape'
  format?: 'a4' | 'letter'
}

/**
 * Exports an HTML element to a PDF file with automatic multi-page support.
 * Captures the element as a high-quality canvas and splits it across multiple pages if needed.
 *
 * @param elementId - The DOM element ID to capture and export
 * @param options - PDF generation options (filename, orientation, format)
 * @throws Error if element is not found
 */
export async function exportToPDF(
  elementId: string,
  options: PDFExportOptions = {}
): Promise<void> {
  const {
    filename = 'assessment-results.pdf',
    orientation = 'portrait',
    format = 'a4',
  } = options

  const element = document.getElementById(elementId)
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`)
  }

  // Capture the element as canvas with high quality settings
  const canvas = await html2canvas(element, {
    scale: 2, // Higher quality - 2x resolution
    useCORS: true, // Enable cross-origin images
    logging: false, // Disable debug logging
    backgroundColor: '#ffffff',
  } as any)

  const imgData = canvas.toDataURL('image/png')

  // Create PDF with specified settings
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format,
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 10

  // Calculate image dimensions to fit page with margins
  const imgWidth = pageWidth - margin * 2
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  // Handle multi-page PDFs for long content
  let heightLeft = imgHeight
  let position = margin

  // Add first page
  pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
  heightLeft -= pageHeight - margin * 2

  // Add additional pages if content overflows
  while (heightLeft > 0) {
    position = heightLeft - imgHeight + margin
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
    heightLeft -= pageHeight - margin * 2
  }

  // Save the PDF
  pdf.save(filename)
}

/**
 * Generates a PDF as a Blob for programmatic use (e.g., uploading, emailing).
 * Note: This creates a single-page PDF. For multi-page support, use exportToPDF.
 *
 * @param elementId - The DOM element ID to capture
 * @param options - PDF generation options (orientation, format)
 * @returns A Blob containing the PDF data
 * @throws Error if element is not found
 */
export async function generatePDFBlob(
  elementId: string,
  options: PDFExportOptions = {}
): Promise<Blob> {
  const { orientation = 'portrait', format = 'a4' } = options

  const element = document.getElementById(elementId)
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`)
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  } as any)

  const imgData = canvas.toDataURL('image/png')

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format,
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const margin = 10
  const imgWidth = pageWidth - margin * 2
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight)

  return pdf.output('blob')
}
