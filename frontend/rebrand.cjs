const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const mapping = {
    'green-50': 'yellow-50',
    'green-100': 'yellow-100',
    'green-200': 'yellow-200',
    'green-300': 'yellow-300',
    'green-400': 'yellow-400',
    'green-500': 'primary',
    'green-600': 'primary-dark',
    'green-700': 'yellow-700',
    'green-800': 'yellow-800',
    'green-900': 'yellow-900',
    'emerald-500': 'primary',
    'emerald-600': 'primary-dark',
    'emerald-700': 'yellow-700',
};

function walkSync(dir, callback) {
    fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            walkSync(filePath, callback);
        } else {
            callback(filePath);
        }
    });
}

walkSync(srcDir, (filePath) => {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.css') || filePath.endsWith('.js')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let changed = false;

        for (const [oldClass, newClass] of Object.entries(mapping)) {
            const regex = new RegExp(oldClass, 'g');
            if (regex.test(content)) {
                content = content.replace(regex, newClass);
                changed = true;
            }
        }

        if (changed) {
            fs.writeFileSync(filePath, content);
            console.log(`Updated: ${filePath}`);
        }
    }
});
