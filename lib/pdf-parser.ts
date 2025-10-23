/**
 * Simple PDF text extraction using pdf-parse
 * This is a simpler implementation that avoids complex module loading issues
 */

import type { Buffer } from 'buffer';

interface PDFData {
  text: string;
  numpages: number;
  numrender?: number;
  info?: any;
  metadata?: any;
}

/**
 * Extract text from PDF buffer using pdf-parse
 * Uses a simpler approach to avoid module loading issues in Next.js
 */
export async function extractTextFromBuffer(buffer: Buffer): Promise<string> {
  try {
    // Import pdf-parse at runtime to avoid build issues
    const pdfParse = await import('pdf-parse/lib/pdf-parse');

    // Parse the PDF
    const data: PDFData = await pdfParse.default(buffer);

    if (!data.text) {
      throw new Error('No text content found in PDF');
    }

    return data.text;
  } catch (error) {
    console.error('[PDF Parser] Error parsing PDF:', error);
    throw error;
  }
}

/**
 * Fetch PDF from URL and extract text
 */
export async function extractTextFromURL(pdfUrl: string): Promise<string> {
  try {
    // Fetch the PDF
    const response = await fetch(pdfUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
    }

    // Convert to buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text
    return await extractTextFromBuffer(buffer);
  } catch (error) {
    console.error('[PDF Parser] Error fetching or parsing PDF:', error);
    throw error;
  }
}

/**
 * Clean and normalize extracted text
 */
export function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\n{3,}/g, '\n\n') // Replace excessive newlines
    .replace(/\s+/g, ' ') // Replace multiple spaces
    .replace(/\t+/g, ' ') // Replace tabs with spaces
    .trim();
}