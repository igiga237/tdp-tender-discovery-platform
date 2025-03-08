const { exec } = require('child_process');

function scanFile(filePath) {
    return new Promise((resolve, reject) => {
        exec(`clamscan ${filePath}`, (error, stdout, stderr) => {
            if (error) {
                return reject(error);
            }
            resolve(!stdout.includes('Infected'));
        });
    });
}

module.exports = { scanFile };