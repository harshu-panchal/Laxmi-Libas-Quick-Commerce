
const fs = require('fs');
const content = fs.readFileSync('c:/Users/hp/Desktop/laxmi-libaas/Laxmi-Libas-Quick-Commerce/backend/src/modules/bus/busController.ts', 'utf8');
let openBraces = 0;
let closeBraces = 0;
for (let i = 0; i < content.length; i++) {
    if (content[i] === '{') openBraces++;
    if (content[i] === '}') closeBraces++;
}
console.log(`Open braces: ${openBraces}, Close braces: ${closeBraces}`);
