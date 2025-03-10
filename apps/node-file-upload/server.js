// server.js

const express = require('express');
const multer = require('multer');
const path = require('path');

// 1) Create the Express app
const app = express();

// 2) Configure Multer Storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Files will be stored in 'uploads' folder
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Keep the original filename, or rename if needed
    cb(null, file.originalname);
  },
});

// 3) File Filter for PDF/DOCX
function fileFilter(req, file, cb) {
  // Allowed file types
  const allowedTypes = ['.pdf', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    // Reject file
    cb(new Error('Unsupported file type. Only PDF and DOCX are allowed.'), false);
  }
}

// 4) Multer Instance with 50MB Limit
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB in bytes
});

// 5) Define a POST route for multiple file uploads
app.post('/upload', upload.array('files'), (req, res) => {
  // If any file fails Multer validation, it throws an error automatically
  // If no errors, the code below runs

  // Check if files are actually attached
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No files uploaded.',
    });
  }

  // If everything is fine
  res.status(201).json({
    success: true,
    message: 'Files uploaded successfully.',
    files: req.files.map((file) => ({
      originalName: file.originalname,
      path: file.path,
      size: file.size,
    })),
  });
});

// 6) Error Handling Middleware for Multer Errors
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds the 50MB limit.',
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  } else if (err) {
    // Other errors (e.g., unsupported file type)
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
  next();
});

// 7) Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

