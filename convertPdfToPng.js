/**
 * convertPdfToPng(pdfArrayBuffer, options)
 * - pdfArrayBuffer: ArrayBuffer from PDF file
 * - options: { scale = 1.5 }
 *
 * Returns: Array of Blobs (PNG images), one per page
 */
async function convertPdfToPng(pdfData, options = {}) {
  const { scale = 1.5 } = options;

  if (typeof pdfjsLib === 'undefined') {
    throw new Error('PDF.js library not loaded');
  }

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';

  const pdf = await pdfjsLib.getDocument(pdfData).promise;
  const pngBlobs = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;

    // Convert canvas to PNG Blob
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/png')
    );

    pngBlobs.push(blob);

    // Cleanup canvas memory
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = 0;
    canvas.height = 0;
  }

  return pngBlobs;
}
