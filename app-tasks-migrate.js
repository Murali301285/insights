const fs = require('fs');
const path = require('path');

const srcPath = path.resolve(__dirname, 'app/tasks/page.tsx');
let baseContent = fs.readFileSync(srcPath, 'utf8');

// Add useRouter
baseContent = baseContent.replace('import { usePathname } from "next/navigation"', 'import { usePathname, useRouter } from "next/navigation"');
if (!baseContent.includes('useRouter')) {
    baseContent = baseContent.replace('import { useState, useEffect, useMemo } from "react"', 'import { useState, useEffect, useMemo } from "react"\nimport { useRouter } from "next/navigation"');
}

// Inject const router = useRouter() inside the component
baseContent = baseContent.replace('export default function TasksDashboardPage() {', 'export default function TasksDashboardPage() {\n    const router = useRouter()');

// Update Dropdown MenuItem to navigate to /tasks/details
baseContent = baseContent.replace(
    '<DropdownMenuItem className="text-zinc-700">',
    '<DropdownMenuItem className="text-zinc-700 cursor-pointer" onClick={() => router.push(`/tasks/details`)}>'
);

// We need to construct content for Dashboard, Active, Completed

// 1. Dashboard (All)
let dashContent = baseContent.replace('setHeaderInfo("Task Tracker Overview", "Monitor task allocations, completion rates, and historical trends.")', 'setHeaderInfo("Tasks Dashboard", "Monitor task allocations, completion rates, and historical trends.")');
fs.writeFileSync(path.resolve(__dirname, 'app/tasks/dashboard/page.tsx'), dashContent);

// 2. Active Tasks (Filtered)
let activeContent = baseContent.replace('setHeaderInfo("Task Tracker Overview", "Monitor task allocations, completion rates, and historical trends.")', 'setHeaderInfo("Active Tasks", "Track and update ongoing assignments.")');
// Find where DataTable is passed 'tasks' and replace with filtered
activeContent = activeContent.replace(/<DataTable columns={columns} data={tasks}/g, '<DataTable columns={columns} data={tasks.filter(t => t.status !== "Completed")}');
activeContent = activeContent.replace('TasksDashboardPage', 'ActiveTasksPage');
fs.writeFileSync(path.resolve(__dirname, 'app/tasks/active/page.tsx'), activeContent);

// 3. Completed Tasks (Filtered)
let compContent = baseContent.replace('setHeaderInfo("Task Tracker Overview", "Monitor task allocations, completion rates, and historical trends.")', 'setHeaderInfo("Completed Tasks", "Archive view of finalized task deliveries.")');
compContent = compContent.replace(/<DataTable columns={columns} data={tasks}/g, '<DataTable columns={columns} data={tasks.filter(t => t.status === "Completed")}');
compContent = compContent.replace('TasksDashboardPage', 'CompletedTasksPage');
fs.writeFileSync(path.resolve(__dirname, 'app/tasks/completed/page.tsx'), compContent);

console.log('Successfully migrated full UI logic into Tasks sub-menus.');
