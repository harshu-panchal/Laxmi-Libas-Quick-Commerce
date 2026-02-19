import fs from 'fs';

const content = fs.readFileSync('d:/project backup/Laxmi Libas/frontend/src/modules/seller/pages/SellerAddProduct.tsx', 'utf8');

const divCount = (content.match(/<div/g) || []).length;
const divCloseCount = (content.match(/<\/div/g) || []).length;
const formCount = (content.match(/<form/g) || []).length;
const formCloseCount = (content.match(/<\/form/g) || []).length;
const braceOpenCount = (content.match(/{/g) || []).length;
const braceCloseCount = (content.match(/}/g) || []).length;
const parenOpenCount = (content.match(/\(/g) || []).length;
const parenCloseCount = (content.match(/\)/g) || []).length;

console.log(`Div: ${divCount} vs ${divCloseCount}`);
console.log(`Form: ${formCount} vs ${formCloseCount}`);
console.log(`Braces: ${braceOpenCount} vs ${braceCloseCount}`);
console.log(`Parens: ${parenOpenCount} vs ${parenCloseCount}`);
