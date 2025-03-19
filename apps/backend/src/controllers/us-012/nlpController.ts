import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

// Import your NLP modules using require (since they are in JS)
const textExtraction = require('../../nlp/TextExtraction.js');
const tokenizing = require('../../nlp/tokenizing.js');
const NER = require('../../nlp/NER.js');
const sentimentAnalysis = require('../../nlp/SentimentAnalysis.js');

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const NLP_RESULTS_DIR = path.join(process.cwd(), 'nlpResults');

// POST /api/v1/documents/extract
export const extractDocumentData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Expect the document id (which could be the file name) to be passed in the request body.
    const { documentId } = req.body;
    if (!documentId) {
      return res.status(400).json({ success: false, message: 'documentId is required.' });
    }

    // Locate the file in the uploads folder. (You could improve this logic to handle paths or UUIDs.)
    const filePath = path.join(UPLOADS_DIR, documentId);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Uploaded file not found.' });
    }

    // Create a folder for this document's NLP results.
    const docResultDir = path.join(NLP_RESULTS_DIR, documentId);
    if (!fs.existsSync(docResultDir)) {
      await mkdir(docResultDir, { recursive: true });
    }

    // 1. Text Extraction: Use your TextExtraction.js module
    const extractedTextOutputPath = path.join(docResultDir, 'extracted.txt');
    const extractedText: string = await textExtraction.extractText(filePath, extractedTextOutputPath);

    // 2. Tokenization: Tokenize the extracted text.
    // Here we use the tokenizeText function which returns an array of sentences.
    const tokenizedSentences: string[] = tokenizing.tokenizeText(extractedText);
    const tokenizedOutputPath = path.join(docResultDir, 'tokenized.txt');
    await writeFile(tokenizedOutputPath, tokenizedSentences.join('\n'), 'utf-8');

    // 3. Named Entity Recognition (NER):
    // Save tokenized text temporarily for NER (if your NER module expects a file path).
    const nerInputPath = tokenizedOutputPath;
    // Run NER - note: your runNER function writes to NER.txt in its directory.
    // To avoid conflicts, you might want to modify the NER module to accept an output path.
    // For now, we assume it writes a file named "NER.txt" in the same folder as the module.
    // So, we call the function and then move the output file.
    NER.runNER(nerInputPath);
    // Move (or copy) the output file from the nlp folder to our docResultDir.
    const nerOutputOriginalPath = path.join(__dirname, '../../nlp/NER.txt');
    const nerOutputPath = path.join(docResultDir, 'NER.txt');
    if (fs.existsSync(nerOutputOriginalPath)) {
      fs.copyFileSync(nerOutputOriginalPath, nerOutputPath);
      fs.unlinkSync(nerOutputOriginalPath); // remove the file from the original location if needed
    }

    // 4. Sentiment Analysis:
    // Similarly, run sentiment analysis.
    sentimentAnalysis.sentimentAnalysisRunner(nerInputPath);
    const saOutputOriginalPath = path.join(__dirname, '../../nlp/SA.txt');
    const saOutputPath = path.join(docResultDir, 'SA.txt');
    if (fs.existsSync(saOutputOriginalPath)) {
      fs.copyFileSync(saOutputOriginalPath, saOutputPath);
      fs.unlinkSync(saOutputOriginalPath);
    }

    return res.status(200).json({
      success: true,
      message: 'NLP extraction completed.',
      documentId,
      resultsPath: docResultDir,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/documents/:id/data
export const getExtractedData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const documentId = req.params.id;
    const docResultDir = path.join(NLP_RESULTS_DIR, documentId);

    if (!fs.existsSync(docResultDir)) {
      return res.status(404).json({ success: false, message: 'No NLP data found for this document.' });
    }

    // Read the files if they exist
    const extractedTextPath = path.join(docResultDir, 'extracted.txt');
    const tokenizedPath = path.join(docResultDir, 'tokenized.txt');
    const nerPath = path.join(docResultDir, 'NER.txt');
    const saPath = path.join(docResultDir, 'SA.txt');

    const extractedText = fs.existsSync(extractedTextPath) ? await readFile(extractedTextPath, 'utf-8') : null;
    const tokenizedText = fs.existsSync(tokenizedPath) ? await readFile(tokenizedPath, 'utf-8') : null;
    const nerData = fs.existsSync(nerPath) ? await readFile(nerPath, 'utf-8') : null;
    const sentimentData = fs.existsSync(saPath) ? await readFile(saPath, 'utf-8') : null;

    return res.status(200).json({
      success: true,
      documentId,
      extractedText,
      tokenizedText,
      namedEntities: nerData,
      sentimentAnalysis: sentimentData,
    });
  } catch (err) {
    next(err);
  }
};

