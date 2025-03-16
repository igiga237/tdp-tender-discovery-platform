// textExtraction.js
import fs from 'fs/promises';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

// Extract text from PDF
async function extractTextFromPDF(pdfPath) {
    const dataBuffer = await fs.readFile(pdfPath);
    const pdfData = await pdfParse(dataBuffer);
    return pdfData.text;
}

// Extract text from DOCX
async function extractTextFromDOCX(docxPath) {
    const dataBuffer = await fs.readFile(docxPath);
    const result = await mammoth.extractRawText({ buffer: dataBuffer });
    return result.value;
}

// Extract text based on file type
async function extractText(filePath, outputFile = null) {
    let text = '';
    if (filePath.endsWith('.pdf')) {
        text = await extractTextFromPDF(filePath);
    } else if (filePath.endsWith('.docx')) {
        text = await extractTextFromDOCX(filePath);
    } else {
        throw new Error('Unsupported file format. Only PDF and DOCX are supported.');
    }
    
    if (outputFile) {
        await fs.writeFile(outputFile, text, 'utf-8');
    }
    return text;
}