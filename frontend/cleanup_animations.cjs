const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
}

const SEARCH_DIR = 'src';

walk(SEARCH_DIR, (filePath) => {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let changed = false;

        // Replace high-stiffness/bouncy springs with professional ease
        const bouncyPattern = /transition=\{\{\s*type:\s*['"]spring['"]\s*,\s*stiffness:\s*500\s*,\s*damping:\s*15\s*\}\}/g;
        if (bouncyPattern.test(content)) {
            content = content.replace(bouncyPattern, "transition={{ duration: 0.3, ease: 'easeOut' }}");
            changed = true;
        }

        if (changed) {
            fs.writeFileSync(filePath, content);
            console.log(`Cleaned animations in: ${filePath}`);
        }
    }
});
