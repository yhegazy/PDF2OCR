import { createWorker } from 'tesseract.js';

const runOcrOnBlob = async (blob: Blob): Promise<string> => {
  try {
    const worker = await createWorker({});

    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');

    const { data: { text } } = await worker.recognize(blob);
    
    await worker.terminate();
    
    return text;
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Failed to perform OCR on image');
  }
};

export default runOcrOnBlob;