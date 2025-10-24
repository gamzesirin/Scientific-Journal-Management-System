/**
 * Simple PDF text extraction for Next.js
 * Uses a minimal approach to avoid module loading issues
 */

/**
 * Extract text from PDF using a simple fetch-based approach
 */
export async function extractPDFText(pdfUrl: string): Promise<string> {
  console.log('[PDF Extract] Starting PDF text extraction from:', pdfUrl);

  try {
    // First, fetch the PDF to ensure it's accessible
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    console.log('[PDF Extract] PDF fetched, size:', arrayBuffer.byteLength, 'bytes');

    // Convert to Uint8Array for processing
    const uint8Array = new Uint8Array(arrayBuffer);

    // Try to extract text using a simple approach
    let extractedText = '';

    try {
      // Convert to string and look for readable text patterns
      const decoder = new TextDecoder('utf-8', { fatal: false });
      const rawText = decoder.decode(uint8Array);

      // Extract readable text between common PDF markers
      const textMatches = rawText.match(/(\w[\w\s.,;:!?'"()-]{10,})/g);
      if (textMatches) {
        extractedText = textMatches
          .filter(match => {
            // Filter out likely binary data
            const printableRatio = match.replace(/[^\x20-\x7E]/g, '').length / match.length;
            return printableRatio > 0.8;
          })
          .join(' ');
      }
    } catch (e) {
      console.warn('[PDF Extract] Simple text extraction failed:', e);
    }

    // If simple extraction didn't work well, return a placeholder
    if (extractedText.length < 100) {
      console.warn('[PDF Extract] Simple extraction yielded little text, using fallback');

      // For now, return a placeholder text that indicates manual processing may be needed
      extractedText = `[PDF Content - Manual Processing Required]

        PDF Size: ${arrayBuffer.byteLength} bytes
        URL: ${pdfUrl}

        The PDF content could not be automatically extracted. This may be due to:
        - The PDF contains primarily images or scanned content
        - The PDF uses complex encoding
        - The PDF is protected or encrypted

        For AI analysis, we'll process based on the filename and any available metadata.

        Filename Analysis: ${pdfUrl.split('/').pop() || 'Unknown'}

        Please note: For best results, ensure the PDF contains selectable text rather than scanned images.`;
    }

    console.log('[PDF Extract] Extraction complete, text length:', extractedText.length);
    return extractedText;

  } catch (error) {
    console.error('[PDF Extract] Error during extraction:', error);
    throw error;
  }
}

/**
 * Clean extracted text
 */
export function cleanExtractedText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Replace multiple spaces
    .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable characters
    .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines
    .trim();
}