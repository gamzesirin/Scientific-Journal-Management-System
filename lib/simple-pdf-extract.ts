// Type definition for pdf-parse
interface PDFData {
  numpages: number;
  numrender: number;
  info: any;
  metadata: any;
  text: string;
  version: string;
}

/**
 * Extracts text from a PDF file
 * @param pdfUrl - URL or path to the PDF file
 * @returns Extracted text from the PDF
 */
export async function extractPDFText(pdfUrl: string): Promise<string> {
  console.log('[PDF Extract] ===== STARTING PDF EXTRACTION =====');
  console.log('[PDF Extract] URL:', pdfUrl);

  try {
    // Fetch the PDF file
    console.log('[PDF Extract] Step 1: Fetching PDF...');
    const response = await fetch(pdfUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
    }

    console.log('[PDF Extract] Step 2: PDF fetched successfully, converting to buffer...');

    // Get the PDF as ArrayBuffer
    const arrayBuffer = await response.arrayBuffer();

    // Convert ArrayBuffer to Uint8Array (pdf-parse requires Uint8Array, not Buffer)
    const uint8Array = new Uint8Array(arrayBuffer);

    console.log('[PDF Extract] Step 3: Uint8Array created, size:', uint8Array.length, 'bytes');

    // Import pdf-parse - it exports a PDFParse class
    console.log('[PDF Extract] Step 4: Importing pdf-parse module...');

    const module = eval('require')('pdf-parse');
    console.log('[PDF Extract] Module structure:', Object.keys(module));

    // pdf-parse exports PDFParse class
    const { PDFParse } = module;

    if (!PDFParse) {
      throw new Error('PDFParse class not found in pdf-parse module');
    }

    console.log('[PDF Extract] PDFParse loaded successfully');
    console.log('[PDF Extract] PDFParse type:', typeof PDFParse);
    console.log('[PDF Extract] PDFParse is a:', PDFParse.constructor.name);

    // Create PDFParse instance and extract text
    console.log('[PDF Extract] Step 5: Creating PDFParse instance...');
    const parser = new PDFParse(uint8Array);

    console.log('[PDF Extract] Step 6: Extracting text from PDF...');
    const result = await parser.getText();

    console.log('[PDF Extract] Result type:', typeof result);
    console.log('[PDF Extract] Result:', result);

    // getText() might return the text directly or in an object
    let text: string;
    if (typeof result === 'string') {
      text = result;
    } else if (result && typeof result === 'object' && 'text' in result) {
      text = (result as any).text;
    } else if (Array.isArray(result)) {
      text = result.join('\n');
    } else {
      console.error('[PDF Extract] Unexpected result format:', result);
      throw new Error('Could not extract text from PDF - unexpected format');
    }

    console.log('[PDF Extract] ===== PDF EXTRACTION SUCCESSFUL =====');
    console.log('[PDF Extract] Text length:', text?.length || 0, 'characters');
    console.log('[PDF Extract] Text preview (first 200 chars):', text?.substring(0, 200) || 'No text');

    // Create data object in expected format
    const data: PDFData = {
      text: text || '',
      numpages: 0,
      numrender: 0,
      info: {},
      metadata: {},
      version: '1.0'
    };

    return data.text;
  } catch (error) {
    console.error('[PDF Extract] ===== ERROR DURING EXTRACTION =====');
    console.error('[PDF Extract] Error details:', error);
    console.error('[PDF Extract] Error type:', error instanceof Error ? error.constructor.name : typeof error);

    if (error instanceof Error) {
      console.error('[PDF Extract] Error message:', error.message);
      console.error('[PDF Extract] Error stack:', error.stack);
      throw new Error(`PDF extraction failed: ${error.message}`);
    }

    throw new Error('PDF extraction failed: Unknown error');
  }
}

/**
 * Cleans extracted text by removing extra whitespace and formatting
 * @param text - Raw extracted text
 * @returns Cleaned text
 */
export function cleanExtractedText(text: string): string {
  console.log('[PDF Extract] Cleaning extracted text...');

  // Remove excessive whitespace
  let cleaned = text.replace(/\s+/g, ' ');

  // Remove excessive newlines
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');

  // Trim
  cleaned = cleaned.trim();

  console.log('[PDF Extract] Text cleaned, final length:', cleaned.length, 'characters');

  return cleaned;
}

/**
 * Extracts and cleans text from a PDF file in one step
 * @param pdfUrl - URL or path to the PDF file
 * @returns Cleaned extracted text
 */
export async function extractAndCleanPDFText(pdfUrl: string): Promise<string> {
  const rawText = await extractPDFText(pdfUrl);
  return cleanExtractedText(rawText);
}
