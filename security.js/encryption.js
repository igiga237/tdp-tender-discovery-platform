const crypto = require('crypto');
const fs = require('fs');
const { SECRET_KEY } = require('./config');

function encryptFile(inputFile, outputFile) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', SECRET_KEY, iv);

    const input = fs.createReadStream(inputFile);
    const output = fs.createWriteStream(outputFile);

    output.write(iv);

    input.pipe(cipher).pipe(output);

    output.on('finish', () => {
        output.write(cipher.getAuthTag());
    });
}

function decryptFile(inputFile, outputFile) {
    const input = fs.readFileSync(inputFile);
    const iv = input.subarray(0, 16);
    const tag = input.subarray(-16);
    const ciphertext = input.subarray(16, -16);
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', SECRET_KEY, iv);
    decipher.setAuthTag(tag);
    
    const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final()
    ]);
    
    fs.writeFileSync(outputFile, decrypted);
}

module.exports = { encryptFile, decryptFile };