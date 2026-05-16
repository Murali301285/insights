const fs = require('fs');
const path = require('path');

const configDir = 'f:\\\\Dev\\\\InSight\\\\InsideCode\\\\app\\\\config';

// recursively get all page.tsx files
function getFiles(dir, files = []) {
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            getFiles(fullPath, files);
        } else if (file === 'page.tsx') {
            files.push(fullPath);
        }
    }
    return files;
}

const files = getFiles(configDir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const folderName = path.basename(path.dirname(file));
    let readableName = folderName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    
    // regex to find <DataTable ... />
    const regex = /<DataTable\s+columns={columns}\s+data={data}\s+searchKey="([^"]+)"\s*\/>/g;
    
    if (regex.test(content)) {
        content = content.replace(regex, (match, searchKey) => {
            return `<DataTable \n                columns={columns} \n                data={data} \n                searchKey="${searchKey}" \n                reportName="Config - ${readableName} Report" \n                fileName="insight-config" \n            />`;
        });
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated ' + folderName);
    }
});
console.log('Done');
