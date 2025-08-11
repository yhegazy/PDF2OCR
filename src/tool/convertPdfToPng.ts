interface ConvertPdfToPngOptions {
  scale?: number;
}

declare global {
  interface Window {
    pdfjsLib?: typeof import('pdfjs-dist');
  }
}


export default async function convertPdfToPng(
  pdfData: ArrayBuffer | Uint8Array | Blob | string,
  options: ConvertPdfToPngOptions = {}
): Promise<Blob[]> {
  const { scale = 1.5 } = options;

  // Get pdfjsLib from window or try to import it
  const pdfjsLib = window.pdfjsLib;
  if (!pdfjsLib) {
    throw new Error('PDF.js library not loaded');
  }

  const getDocument = (pdfjsLib as any)['getDocument'] ?? (pdfjsLib as any).default?.getDocument;
  if (!getDocument) {
    throw new Error('PDF.js getDocument method not found');
  }
  const pdf = await getDocument(pdfData).promise;
  const pngBlobs: Blob[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    await page.render({ canvasContext: ctx, viewport }).promise;

    // Convert canvas to PNG Blob with proper typing
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/png');
    });

    if (!blob) {
      throw new Error('Failed to convert canvas to blob');
    }

    pngBlobs.push(blob);

    // Cleanup canvas memory
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = 0;
    canvas.height = 0;
  }

  return pngBlobs;
}