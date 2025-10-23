declare module 'pdf-parse' {
  interface PDFData {
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    text: string;
    version: string;
  }

  interface PDFOptions {
    max?: number;
    version?: string;
  }

  function parse(dataBuffer: Buffer, options?: PDFOptions): Promise<PDFData>;

  export = parse;
}
