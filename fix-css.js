const fs = require('fs');
const path = require('path');

const cssPath = path.resolve(__dirname, 'app/globals.css');
// Read as raw buffer to see if there are null bytes from UTF-16LE
const buffer = fs.readFileSync(cssPath);

// Convert buffer back to standard UTF-8 string, stripping null bytes if powershell messed it up
let str = buffer.toString('utf8');
str = str.replace(/\0/g, '');

// Clean up any broken keyframes block at the end
str = str.replace(/@keyframes scrollUp\s*\{\s*0%\s*\{\s*transform:\s*translateY\(0\);\s*\}\s*100%\s*\{\s*transform:\s*translateY\(calc\(-33\.333%\)\);\s*\}\s*\}/gi, '');

// Just append it safely now using js
str += `
@keyframes scrollUp {
  0% { transform: translateY(0); }
  100% { transform: translateY(-33.333%); }
}
`;

fs.writeFileSync(cssPath, str, 'utf8');
console.log("CSS Encoding and syntax fixed");
