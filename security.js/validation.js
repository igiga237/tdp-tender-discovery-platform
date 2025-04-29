const fileType = require('file-type');
const fs = require('fs');
const path = require('path');
const { ALLOWED_EXTENSIONS, MAX_FILE_SIZE_MB } = require('./config');

function allowedFile(filename) {
    const ext = path.extname(filename).toLowerCase().slice(1);
    return ALLOWED_EXTENSIONS.has(ext);
}

async function allowedMime(filePath) {
    const buffer = fs.readFileSync(filePath);
    const type = await fileType.fromBuffer(buffer);
    return type && ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(type.mime);
}

function validateFileSize(file) {
    return file.size <= MAX_FILE_SIZE_MB * 1024 * 1024;
}

module.exports = { allowedFile, allowedMime, validateFileSize };