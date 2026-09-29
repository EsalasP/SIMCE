import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

/** Captura un elemento HTML y lo descarga como PDF A4 paginado con 12mm de margen. */
export async function descargarPdf(element: HTMLElement, filename: string) {
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
  })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()   // 210mm
  const pageH = pdf.internal.pageSize.getHeight()  // 297mm
  const margin = 12                                 // mm all sides
  const contentW = pageW - margin * 2              // 186mm
  const contentH = pageH - margin * 2              // 273mm

  // canvas.width is 2× real px due to scale:2
  const ratio = contentW / (canvas.width / 2)
  const totalH = (canvas.height / 2) * ratio

  let page = 0
  let remaining = totalH

  while (remaining > 0) {
    if (page > 0) pdf.addPage()
    pdf.addImage(imgData, 'PNG', margin, margin - page * contentH, contentW, totalH)

    // Mask content that bleeds outside the margin area (prevents row duplication at page breaks)
    pdf.setFillColor(255, 255, 255)
    pdf.rect(0, 0, pageW, margin, 'F')                  // top strip
    pdf.rect(0, pageH - margin, pageW, margin + 1, 'F') // bottom strip
    pdf.rect(0, 0, margin, pageH, 'F')                  // left strip
    pdf.rect(pageW - margin, 0, margin + 1, pageH, 'F') // right strip

    page++
    remaining -= contentH
  }

  pdf.save(filename)
}
