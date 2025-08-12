import { useRef, useState } from "preact/hooks";
import convertPdfToPng from "./tool/convertPdfToPng";
import runOcrOnBlob from "./tool/runOcrOnBlog";

interface PageData {
  url: string;
  name: string;
  ocrText?: string;
  ocrStatus?: 'pending' | 'processing' | 'complete' | 'error';
}

export function App() {
  const [status, setStatus] = useState<string>("Select a PDF file to convert");
  const [pages, setPages] = useState<PageData[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    setStatus("Reading file...");
    setPages([]);

    try {
      const arrayBuffer = await file.arrayBuffer();
      setStatus("Converting PDF pages to PNG...");

      const pngBlobs = await convertPdfToPng(arrayBuffer, { scale: 1.5 });

      setStatus(`Conversion complete — ${pngBlobs.length} page(s) converted. Starting OCR...`);

      // Create initial page data with download links
      const initialPages = pngBlobs.map((blob, i) => {
        const url = URL.createObjectURL(blob);
        const name = `${file.name.replace(/\.pdf$/i, '')}_page_${i + 1}.png`;
        return { 
          url, 
          name, 
          ocrStatus: 'pending' as const 
        };
      });

      setPages(initialPages);

      // Run OCR on each blob
      for (let i = 0; i < pngBlobs.length; i++) {
        setPages(prev => 
          prev.map((page, index) => 
            index === i 
              ? { ...page, ocrStatus: 'processing' as const }
              : page
          )
        );

        try {
          const ocrText = await runOcrOnBlob(pngBlobs[i]);
          
          setPages(prev => 
            prev.map((page, index) => 
              index === i 
                ? { ...page, ocrText, ocrStatus: 'complete' as const }
                : page
            )
          );
        } catch (error) {
          setPages(prev => 
            prev.map((page, index) => 
              index === i 
                ? { ...page, ocrStatus: 'error' as const }
                : page
            )
          );
        }
      }

      setStatus(`Processing complete — ${pngBlobs.length} page(s) converted and OCR'd.`);

    } catch (err) {
      const error = err as Error;
      setStatus("Error: " + (error.message || String(error)));
      console.error(error);
    }
  };

  const getOcrStatusText = (status?: string) => {
    switch (status) {
      case 'pending': return 'OCR pending...';
      case 'processing': return 'Running OCR...';
      case 'complete': return '';
      case 'error': return 'OCR failed';
      default: return '';
    }
  };

  return (
    <div className="p-4">
      <h1>PDF to PNG Converter with OCR</h1>
      <input
        id="pdfInput"
        type="file"
        accept="application/pdf"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="mb-4"
      />

      <div id="status" className="font-bold mb-4">
        {status}
      </div>

      <div id="results">
        {pages.map((page, i) => (
          <div key={i} className="mb-6 p-4 border rounded">
            <div className="mb-2">
              <a
                href={page.url}
                download={page.name}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Download page {i + 1} PNG
              </a>
              <span className="ml-2 text-sm text-gray-600">
                {getOcrStatusText(page.ocrStatus)}
              </span>
            </div>
            
            {page.ocrText && (
              <div className="mt-3">
                <h3 className="font-medium text-gray-700 mb-2">Extracted Text:</h3>
                <div className="bg-gray-50 p-3 rounded border text-sm whitespace-pre-wrap">
                  {page.ocrText}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}