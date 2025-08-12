interface ConvertPdfToPngOptions {
  scale?: number;
}

export default async function convertPdfToPng(
  pdfData: ArrayBuffer | Uint8Array,
  options: ConvertPdfToPngOptions = {}
): Promise<Blob[]> {
  const { scale = 1.5 } = options;

  // Check if pdfjsLib is available on window
  const pdfjsLib = (window as any).pdfjsLib;
  if (!pdfjsLib) {
    throw new Error('PDF.js library not loaded. Please include PDF.js in your project.');
  }

  const pdf = await pdfjsLib.getDocument(pdfData).promise;
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

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/png');
    });

    if (!blob) {
      throw new Error('Failed to convert canvas to blob');
    }

    pngBlobs.push(blob);
  }

  return pngBlobs;
}