import Tesseract from 'tesseract.js';

export interface DetectedTextLine {
  text: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const recognizeTextLines = async (
  source: HTMLImageElement,
  onProgress?: (status: string) => void
): Promise<DetectedTextLine[]> => {
  const worker = await Tesseract.createWorker('eng', undefined, {
    logger: (message) => {
      if (message.status) {
        const progress = Math.round(message.progress * 100);
        onProgress?.(`${message.status} ${progress}%`);
      }
    },
  });

  try {
    const result = await worker.recognize(source);
    const lines: DetectedTextLine[] = [];
    for (const block of result.data.blocks ?? []) {
      for (const paragraph of block.paragraphs) {
        for (const line of paragraph.lines) {
          const text = line.text.trim();
          if (!text || line.confidence < 35) continue;
          lines.push({
            text,
            confidence: line.confidence,
            x: line.bbox.x0,
            y: line.bbox.y0,
            width: line.bbox.x1 - line.bbox.x0,
            height: line.bbox.y1 - line.bbox.y0,
          });
        }
      }
    }
    return lines;
  } finally {
    await worker.terminate();
  }
};
