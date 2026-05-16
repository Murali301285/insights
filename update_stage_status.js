const fs = require('fs');

let fileStage = 'f:\\\\Dev\\\\InSight\\\\InsideCode\\\\app\\\\config\\\\stage\\\\page.tsx';
let contentStage = fs.readFileSync(fileStage, 'utf8');

contentStage = contentStage.replace(
    'accessorKey: "percentage",\r\n            header: ({ column }) => {',
    'accessorKey: "percentage",\r\n            accessorFn: (row: any) => `${row.percentage || 0}%`,\r\n            header: ({ column }) => {'
);
contentStage = contentStage.replace(
    'accessorKey: "isActive",\r\n            header: ({ column }) => {',
    'accessorKey: "isActive",\r\n            accessorFn: (row: any) => row.isActive ? "Yes" : "No",\r\n            header: ({ column }) => {'
);

fs.writeFileSync(fileStage, contentStage);
console.log('Stage updated.');

let fileStatus = 'f:\\\\Dev\\\\InSight\\\\InsideCode\\\\app\\\\config\\\\status\\\\page.tsx';
let contentStatus = fs.readFileSync(fileStatus, 'utf8');

contentStatus = contentStatus.replace(
    'accessorKey: "isActive",\r\n            header: ({ column }) => {',
    'accessorKey: "isActive",\r\n            accessorFn: (row: any) => row.isActive ? "Yes" : "No",\r\n            header: ({ column }) => {'
);

fs.writeFileSync(fileStatus, contentStatus);
console.log('Status updated.');
