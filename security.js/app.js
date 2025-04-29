const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { scanFile } = require('./antivirus');
const { encryptFile } = require('./encryption');
const { allowedFile, allowedMime, validateFileSize } = require('./validation');
const { UPLOAD_FOLDER } = require('./config');
const storage = multer.diskStorage({
    destination: './uploads/', // Assurez-vous que ce dossier existe
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const app = express();
const upload = multer({ storage });



// Créer le dossier de téléchargement s'il n'existe pas
if (!fs.existsSync(UPLOAD_FOLDER)) {
    fs.mkdirSync(UPLOAD_FOLDER);
}

app.post('/api/v1/documents/upload', upload.single('file'), async (req, res) => {
    console.log(req.file);
    if (!req.file) {
        return res.status(400).json({ error: 'No file provided.' });
    }

    if (!allowedFile(req.file.originalname)) {
        return res.status(400).json({ error: 'Unsupported file format.' });
    }

    if (!validateFileSize(req.file)) {
        return res.status(413).json({ error: 'File size exceeds 50MB.' });
    }

    const tempPath = req.file.path;

    try {
        const isSafe = await scanFile(tempPath);
        if (!isSafe) {
            fs.unlinkSync(tempPath);
            return res.status(400).json({ error: 'File is infected.' });
        }

        const encryptedPath = tempPath + '.enc';
        await encryptFile(tempPath, encryptedPath);
        fs.unlinkSync(tempPath);

        res.json({ message: 'File encrypted and stored securely.' });
    } catch (error) {
        fs.unlinkSync(tempPath);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
