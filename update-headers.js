const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

async function fixDb() {
    const prisma = new PrismaClient();
    try {
        const invParent = await prisma.appPage.findFirst({ where: { pageName: 'Inventory' } });
        if (invParent) {
            const dashes = await prisma.appPage.findMany({ 
                where: { pageName: 'Dashboard', parentId: invParent.id },
                orderBy: { createdAt: 'asc' }
            });
            if (dashes.length > 1) {
                // Delete duplicates keeping the first one
                for (let i = 1; i < dashes.length; i++) {
                    await prisma.appPage.delete({ where: { id: dashes[i].id } });
                    console.log('Deleted duplicate Dashboard in Inventory.');
                }
            }
        }
    } catch(e) { console.error('DB Update error:', e); }
    finally { await prisma.$disconnect(); }
}

const updates = [
    {
        file: 'app/tasks/dashboard/page.tsx',
        name: 'Tasks DashboardPlaceholder',
        title: 'Tasks Dashboard',
        desc: "Manage and monitor your team's task distribution."
    },
    {
        file: 'app/tasks/active/page.tsx',
        name: 'ActiveTasksPlaceholder',
        title: 'Active Tasks',
        desc: "Track and update ongoing assignments."
    },
    {
        file: 'app/tasks/completed/page.tsx',
        name: 'CompletedTasksPlaceholder',
        title: 'Completed Tasks',
        desc: "Archive view of finalized task deliveries."
    },
    {
        file: 'app/time-tracker/dashboard/page.tsx',
        title: 'Time Tracking Analytics',
        desc: "Monitor working hours, project distributions, and monthly task efficiency.",
        removeRegex: /<h1 className="[^"]*">[\s\S]*?<\/h1>\s*<p className="[^"]*">[^<]*<\/p>/g
    },
    {
        file: 'app/time-tracker/entry/page.tsx',
        title: 'Time Tracker Logs',
        desc: "Log manual hours efficiently for proper project billing.",
    },
    {
        file: 'app/time-tracker/report/page.tsx',
        title: 'Time Tracker Reports',
        desc: "Analyze and export timesheet logs across dates, users, and assigned clusters."
    },
    {
        file: 'app/inventory/dashboard/page.tsx',
        title: 'Inventory Analytics',
        desc: "Track global stock metrics, flow trends, and shortage alerts.",
        removeRegex: /<h1 className="[^"]*">[\s\S]*?<\/h1>\s*<p className="[^"]*">[^<]*<\/p>/g
    },
    {
        file: 'app/inventory/entry/page.tsx',
        title: 'Inventory Movement Logs',
        desc: "Log inbound GRNs, outbound dispatches, and inter-location transfers.",
    },
    {
        file: 'app/inventory/report/page.tsx',
        title: 'Stock Ledger Reports',
        desc: "Analyze real-time quantities across multiple warehouses and product categories."
    },
    {
        file: 'app/expense/dashboard/page.tsx',
        title: 'Expense Operations Dashboard',
        desc: "Assess aggregate expenditures, departmental burn-rates, and high-frequency categories.",
        removeRegex: /<h1 className="[^"]*">[\s\S]*?<\/h1>\s*<p className="[^"]*">[^<]*<\/p>/g
    },
    {
        file: 'app/expense/entry/page.tsx',
        title: 'Expense Ledger Entry',
        desc: "Manually log ad-hoc spending and upload bill documents for accounting."
    },
    {
        file: 'app/expense/report/page.tsx',
        title: 'Expense Audit Reports',
        desc: "Extract detailed historical spends scoped by strict timeline filters and vendors."
    },
    {
        file: 'app/weekly-review/page.tsx',
        title: 'Weekly Management Review',
        desc: "Executive tracking and status update matrix for all operational verticals."
    }
];

function processFile(item) {
    const p = path.resolve(__dirname, item.file);
    if (!fs.existsSync(p)) return console.log('Not found:', item.file);
    
    let content = fs.readFileSync(p, 'utf8');

    // Make sure we have useHeader and useEffect
    if (!content.includes('useHeader')) {
        content = content.replace(/(im\port\s+.*?from\s+['"]react['"];?)/, "$1\nimport { useHeader } from \"@/components/providers/HeaderProvider\";");
        if(!content.includes('useHeader')) {
             content = `import { useHeader } from "@/components/providers/HeaderProvider";\n` + content;
        }
    }
    if (!content.includes('useEffect')) {
        content = content.replace(/(import\s+.*?from\s+['"]react['"];?)/, "$1").replace('import * as React from "react"', 'import * as React from "react"\nimport { useEffect } from "react"').replace('import { useState }', 'import { useState, useEffect }');
        if(!content.includes('useEffect') && content.includes('"use client"')) {
             content = content.replace('"use client"', '"use client"\nimport { useEffect } from "react";');
        }
    }

    // Inject hook call inside the component
    const componentRegex = /(export\s+default\s+function\s+\w+\s*\([^)]*\)\s*\{)/;
    if (componentRegex.test(content) && !content.includes('setHeaderInfo(')) {
        content = content.replace(componentRegex, `$1\n    const { setHeaderInfo } = useHeader();\n    useEffect(() => {\n        setHeaderInfo("${item.title}", "${item.desc}");\n    }, [setHeaderInfo]);\n`);
    }

    // Strip inline headers safely
    if (item.removeRegex) {
        content = content.replace(item.removeRegex, "");
    } else {
        // Strip out the wrapping <div> that usually contains the h1 and p if it's there
        const flexMatch = content.match(/<div[^>]*>[\s]*<h1[^>]*>[\s\S]*?<\/h1>[\s]*<p[^>]*>[\s\S]*?<\/p>[\s]*<\/div>/);
        if(flexMatch) {
            content = content.replace(flexMatch[0], "");
        } else {
            const h1pMatch = content.match(/<h1[^>]*>[\s\S]*?<\/h1>[\s]*<p[^>]*>[\s\S]*?<\/p>/);
            if(h1pMatch) content = content.replace(h1pMatch[0], "");
        }
    }

    fs.writeFileSync(p, content, 'utf8');
    console.log('Updated:', item.file);
}

updates.forEach(processFile);
fixDb();
