import { NextRequest, NextResponse } from 'next/server';
import PDFParser from 'pdf2json';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const pdfParser = new PDFParser(null, true); // Enable text extraction
    
    const text = await new Promise<string>((resolve, reject) => {
      pdfParser.on('pdfParser_dataError', (error: any) => {
        console.error("PDF Parser Error:", error);
        reject(error);
      });
      
      pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
        console.log("PDF data ready");
        try {
          // Method 1: Get raw text
          const rawText = pdfParser.getRawTextContent();
          
          // Method 2: If raw text is empty, try formatted text
          if (!rawText || rawText.trim().length === 0) {
            const formattedText = pdfData.Pages.map((page: any) => {
              return page.Texts.map((text: any) => {
                return decodeURIComponent(text.R[0].T);
              }).join(' ');
            }).join('\n\n');
            
            resolve(formattedText);
          } else {
            resolve(rawText);
          }
        } catch (err) {
          console.error("Error processing PDF data:", err);
          reject(err);
        }
      });
      
      pdfParser.parseBuffer(buffer);
    });
    
    console.log("Extracted text length:", text.length);
    
    return NextResponse.json({ text: text.trim() });
  } catch (error) {
    console.error('PDF extraction error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to extract text from PDF',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}