const fs = require('fs');
const path = require('path');

function simplifyRender(filePath, condition) {
    const p = path.resolve(__dirname, filePath);
    let content = fs.readFileSync(p, 'utf8');

    const renderRegex = /return \([\s\S]*\}\s*\)\s*\}$/;

    const newRender = `return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm flex flex-col min-h-[500px]">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-zinc-900">Task Execution Queue</h3>
                    <div className="px-3 py-1 bg-violet-50 text-violet-700 text-xs font-bold uppercase tracking-wider rounded-lg border border-violet-100">
                        Total Records: {tasks.filter(t => ${condition}).length}
                    </div>
                </div>
                <div className="flex-1">
                    <DataTable columns={columns} data={tasks.filter(t => ${condition})} searchKey="description" />
                </div>
            </div>
        </div>
    )
}`;

    content = content.replace(renderRegex, newRender);
    fs.writeFileSync(p, content, 'utf8');
    console.log('Simplified', filePath);
}

simplifyRender('app/tasks/active/page.tsx', 't.status !== "Completed"');
simplifyRender('app/tasks/completed/page.tsx', 't.status === "Completed"');
