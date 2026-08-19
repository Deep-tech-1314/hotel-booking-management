const fs = require('fs');
const path = require('path');

function searchFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            searchFiles(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const lines = content.split('\n');
            lines.forEach((line, index) => {
                // look for \` or \${
                if (line.includes('\\`') || line.includes('\\${')) {
                    console.log(`${fullPath}:${index + 1}: ${line.trim()}`);
                }
            });
        }
    }
}

searchFiles(path.join(process.cwd(), 'client/src'));
