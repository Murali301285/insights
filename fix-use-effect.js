const fs = require('fs');
const path = require('path');

const files = [
    'app/tasks/dashboard/page.tsx',
    'app/tasks/active/page.tsx',
    'app/tasks/completed/page.tsx',
    'app/time-tracker/dashboard/page.tsx',
    'app/time-tracker/entry/page.tsx',
    'app/time-tracker/report/page.tsx',
    'app/inventory/dashboard/page.tsx',
    'app/inventory/entry/page.tsx',
    'app/inventory/report/page.tsx',
    'app/expense/dashboard/page.tsx',
    'app/expense/entry/page.tsx',
    'app/expense/report/page.tsx',
    'app/weekly-review/page.tsx'
];

files.forEach(file => {
    const p = path.resolve(__dirname, file);
    if (fs.existsSync(p)) {
        let content = fs.readFileSync(p, 'utf8');
        
        // If it uses useEffect but has no react import
        if (content.includes('useEffect') && !content.includes('import { useEffect') && !content.includes('React.useEffect')) {
            content = content.replace('"use client"', '"use client"\nimport { useEffect } from "react";');
            fs.writeFileSync(p, content, 'utf8');
            console.log('Added useEffect import to', file);
        }
    }
});
