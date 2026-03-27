import html2canvas from 'html2canvas';
import { PDFDocument } from 'pdf-lib';

/**
 * Generate a PDF from a DOM element using html2canvas at 2× scale.
 *
 * The element is rendered to a canvas, then embedded into an A4 landscape
 * PDF page via pdf-lib. Returns the PDF as a `Uint8Array`.
 *
 * @param {HTMLElement} element - The element to capture (e.g. cert-template page div)
 * @returns {Promise<Uint8Array>} Raw PDF bytes
 *
 * @example
 * const bytes = await generatePdf(tpl.shadowRoot.querySelector('.cert-template__page'));
 * const blob = new Blob([bytes], { type: 'application/pdf' });
 * const url = URL.createObjectURL(blob);
 */
export async function generatePdf(element) {
  const canvas = await html2canvas(element, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');

  const pdfDoc = await PDFDocument.create();
  // A4 landscape in points (1mm ≈ 2.835pt)
  const pageWidth = 841.89;
  const pageHeight = 595.28;
  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  const img = await pdfDoc.embedPng(imgData);
  page.drawImage(img, { x: 0, y: 0, width: pageWidth, height: pageHeight });

  return pdfDoc.save();
}

/**
 * Trigger a browser download for a PDF byte array.
 *
 * @param {Uint8Array} bytes - PDF bytes from `generatePdf`
 * @param {string} [filename='certificate.pdf'] - Download filename
 */
export function downloadPdf(bytes, filename = 'certificate.pdf') {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
