require('dotenv').config();

module.exports = {
    UPLOAD_FOLDER: 'uploads',
    ALLOWED_EXTENSIONS: new Set(['pdf', 'docx']),
    MAX_FILE_SIZE_MB: 50,
    SECRET_KEY: Buffer.from(process.env.SECRET_KEY, 'hex'), // Clé AES-256
};