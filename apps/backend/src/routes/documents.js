// import required modules
const express = require("express"); // import Express.js library
const multer = require("multer"); // import Multer middleware for file uploads
const path = require("path"); // import path to handle file paths
const fs = require("fs"); // import file system module
const pdfParse = require("pdf-parse"); // import to exctract text from PDFs

const app = express(); //initialize express app
const PORT = 3000; // default port for the server to run on
const extractedData = {}; // key-value array

// set up Multer storage for file uploads
const storage = multer.diskStorage({ // using disk storage to save files
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // save files to 'uploads/'
    },
    filename: (req, file, cb) => {
        cb(null, path.extname(file.originalname)) // name the file with an original extenstion
    }
});

const upload = multer({ storage }); // initialize multer 
app.use(express.json()); // allow JSON parsing

// upload document ( POST /api/v1/documents/upload)
app.post("/api/v1/documents/upload", upload.single("file"), (req, res) => { 
    // checking if a file was uploaded
    if (!req.file){
        return res.status(400).json({ message: "No file uploaded." });
    }
    // success message with the file ID
    res.json({ message: "File successfully uploaded.", filename: req.file.filename });
});

// extract text ( POST /api/v1/documents/extract )
app.post("/api/v1/documents/extract", async (req, res) => {
    
    // extract the file ID from the request body, and check if the file ID is provided
    const { fileId } = req.body;
    if (!fileId) {
        return res.status(400).json({ message: "File ID is required." });
    }

    // create the file path using the uploads folder, and check if the file exists before reading
    const filePath = path.join(__dirname, "uploads", fileId);
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File is not found." });
    }

    try {
        const fileData = fs.readFileSync(filePath); // read the file's data
        const pdfText = pdfParse(fileData); // use pdf parse to extact text
        const extractedText = pdfText.text; // store the extracted text in temp storage
        
        if (!extractedText) {
            return res.status(400).json({ message: "Unable to analyze the document. Please check the file and try again."})
        }

        let confidenceScore = calculateConfidenceScore(extractedText); // calculate the confidence score
        
        extractedData[fileId] = {text: extractedText, confidence: confidenceScore};
        
        res.json({ message: "Text successfully extracted.", fileId, confidenceScore });
    } catch (err){
        res.status(500).json({ message: "Error extracting text.", error: err.message });
    }
});

// function that determines the clarity of the text and calculates the confidence score
function calculateConfidenceScore(text){
    const wordCount = text.split(/\s+/).length; // count the words without white spaces
    const punctCount = text.match(/.,?!/g).length; // count the punctation

    if (wordCount < 10) return 0.2; // very low confidence
    if ((punctCount/wordCount) < 0.2) return 0.5; // low-medium confidence due to low punctuation ratio
    if ((punctCount/wordCount) < 0.5) return 0.7; // medium-high confidence due to higher puncuation ratio
    return 0.9; // very high confidence if the text is tructured and puncuated 
}

// retrieve extracted data ( GET /api/v1/documents/:id/data )
app.get("/api/v1/documents/:id/data", (req, res) => {
    
    // extract the file ID from the request parameters, and check if the extracted text exists
    const { id } = req.params;
    if (!extractedData[id]) {
        return res.status(404).json({ message: "Extracted data is not found." });
    }
    res.json({ fileId: id, extractedText: extractedData[id] }) // the extracted text
});