/**
 * Downloads and extracts text from a PDF URL
 */
export async function extractTextFromPDF(pdfUrl: string): Promise<string> {
  try {
    console.log('[PDF Utils] Fetching PDF from URL:', pdfUrl);

    // Fetch the PDF file
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      console.error('[PDF Utils] Failed to fetch PDF:', response.status, response.statusText);
      throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
    }

    console.log('[PDF Utils] PDF fetched successfully, content-type:', response.headers.get('content-type'));

    // Get the PDF as array buffer
    const arrayBuffer = await response.arrayBuffer();
    console.log('[PDF Utils] ArrayBuffer created, size:', arrayBuffer.byteLength, 'bytes');

    try {
      // Try using pdf-parse first (simpler API)
      console.log('[PDF Utils] Attempting to use pdf-parse...');
      const pdfParse = require('pdf-parse');
      const buffer = Buffer.from(arrayBuffer);

      console.log('[PDF Utils] Parsing PDF document with pdf-parse...');
      const data = await pdfParse(buffer, {
        max: 0, // Parse all pages
        version: 'v2.0.550' // Use stable version
      });

      console.log('[PDF Utils] PDF parsed successfully');
      console.log('[PDF Utils] Number of pages:', data.numpages);
      console.log('[PDF Utils] Text length:', data.text.length);

      if (!data.text || data.text.length < 50) {
        console.warn('[PDF Utils] Extracted text is very short or empty');
        console.log('[PDF Utils] First 500 chars of text:', data.text.substring(0, 500));
      }

      return data.text;
    } catch (pdfParseError) {
      console.warn('[PDF Utils] pdf-parse failed, falling back to alternative method:', pdfParseError);

      // Fallback: Use pdfjs-dist for extraction
      console.log('[PDF Utils] Using pdfjs-dist as fallback...');
      const pdfjsLib = await import('pdfjs-dist');

      // Set worker to avoid issues
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      console.log('[PDF Utils] PDF loaded with pdfjs-dist, pages:', pdf.numPages);

      let fullText = '';

      // Extract text from each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }

      console.log('[PDF Utils] Text extraction complete with pdfjs-dist, length:', fullText.length);

      if (!fullText || fullText.length < 50) {
        console.warn('[PDF Utils] Extracted text is very short or empty');
        console.log('[PDF Utils] First 500 chars of text:', fullText.substring(0, 500));
      }

      return fullText;
    }
  } catch (error) {
    console.error('[PDF Utils] Error extracting text from PDF:', error);
    if (error instanceof Error) {
      console.error('[PDF Utils] Error name:', error.name);
      console.error('[PDF Utils] Error message:', error.message);
      console.error('[PDF Utils] Error stack:', error.stack);
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Validates if a URL points to a PDF file
 */
export function isPdfUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    return pathname.endsWith('.pdf');
  } catch {
    return false;
  }
}

/**
 * Extracts a meaningful excerpt from text (first N characters)
 */
export function extractExcerpt(text: string, maxLength: number = 2000): string {
  if (text.length <= maxLength) {
    return text;
  }

  // Try to cut at a sentence boundary
  const excerpt = text.substring(0, maxLength);
  const lastPeriod = excerpt.lastIndexOf('.');
  const lastNewline = excerpt.lastIndexOf('\n');

  const cutPoint = Math.max(lastPeriod, lastNewline);
  if (cutPoint > maxLength * 0.8) {
    return excerpt.substring(0, cutPoint + 1);
  }

  return excerpt + '...';
}

/**
 * Cleans and normalizes extracted PDF text
 */
export function cleanPdfText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newline
    .trim();
}
