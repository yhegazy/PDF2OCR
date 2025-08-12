import { useRef, useState } from "preact/hooks";
import convertPdfToPng from "./tool/convertPdfToPng";

export function App() {
  const [status, setStatus] = useState<string>("Select a PDF file to convert");
  const [downloadLinks, setDownloadLinks] = useState<{url: string, name: string}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    setStatus("Reading file...");
    setDownloadLinks([]);

    try {
      const arrayBuffer = await file.arrayBuffer();
      setStatus("Converting PDF pages to PNG...");

      const pngBlobs = await convertPdfToPng(arrayBuffer, { scale: 1.5 });

      setStatus(`Conversion complete — ${pngBlobs.length} page(s) converted.`);

      const newLinks = pngBlobs.map((blob, i) => {
        const url = URL.createObjectURL(blob);
        const name = `${file.name.replace(/\.pdf$/i, '')}_page_${i + 1}.png`;
        return { url, name };
      });

      setDownloadLinks(newLinks);

    } catch (err) {
      const error = err as Error;
      setStatus("Error: " + (error.message || String(error)));
      console.error(error);
    }
  };

  return (
    <div className="p-4">
      <h1>PDF to PNG Converter</h1>
      <input
        id="pdfInput"
        type="file"
        accept="application/pdf"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="mb-4"
      />

      <div id="status" className="font-bold mb-2">
        {status}
      </div>

      <div id="downloads">
        {downloadLinks.map((link, i) => (
          <a
            key={i}
            href={link.url}
            download={link.name}
            className="block mt-2 text-blue-600 hover:text-blue-800"
          >
            Download page {i + 1} PNG
          </a>
        ))}
      </div>
    </div>
  );
}