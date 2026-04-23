const fs = require('fs');
const path = require('path');

const p = path.resolve(__dirname, 'components/dashboard/DashboardContent.tsx');
let content = fs.readFileSync(p, 'utf8');

// 1. Add state for Sales Toggle
if (!content.includes('salesToggle')) {
    content = content.replace('const [greeting, setGreeting] = useState("Good Morning")', 'const [greeting, setGreeting] = useState("Good Morning")\n    const [salesToggle, setSalesToggle] = useState<"value" | "nos">("nos")');
}

// 2. Supply Chain Text change from "Credit" to "New"
content = content.replace('<div className="text-[9px] uppercase font-bold text-indigo-600/90 tracking-widest mt-0.5">Credit</div>', '<div className="text-[9px] uppercase font-bold text-indigo-600/90 tracking-widest mt-0.5">New</div>');

// 3. HR Portal text from "Hires" to "Total"
content = content.replace('<div className="text-[9px] uppercase font-bold text-purple-600/90 tracking-widest mt-0.5">Hires</div>', '<div className="text-[9px] uppercase font-bold text-purple-600/90 tracking-widest mt-0.5">Total</div>');

// 4. Smart Alerts auto-scroll
const alertsRegex = /<div className="flex flex-col gap-4 w-full pb-4">[\s\S]*?\{alerts\.map\(\(alert, index\) => \([\s\S]*?<\/div>\s*\}\)\s*<\/div>/;

const newAlertsHTML = `<div className="flex flex-col gap-4 w-full pb-4 animate-[scrollUp_30s_linear_infinite] hover:[animation-play-state:paused]">
                                {[...alerts, ...alerts].map((alert, index) => (
                                    <div
                                        key={\`\${alert.id}-\${index}\`}
                                        className={\`p-4 rounded-xl border backdrop-blur-sm transition-transform hover:scale-[1.02] \${alert.type === 'critical' ? 'bg-red-500/10 border-red-500/30' :
                                            alert.type === 'warning' ? 'bg-amber-500/10 border-amber-500/30' :
                                                'bg-zinc-800/50 border-zinc-700'
                                            }\`}
                                    >
                                        <div className="flex items-start justify-between mb-1">
                                            <span className={\`text-xs font-bold uppercase \${alert.type === 'critical' ? 'text-red-400' :
                                                alert.type === 'warning' ? 'text-amber-400' :
                                                    'text-blue-400'
                                                }\`}>{alert.type}</span>
                                            <span className="text-[10px] text-zinc-500" suppressHydrationWarning>{new Date().toLocaleTimeString()}</span>
                                        </div>
                                        <h4 className="text-sm font-semibold text-zinc-100 mb-1">{alert.title}</h4>
                                        <p className="text-xs text-zinc-400 leading-relaxed">{alert.desc}</p>
                                    </div>
                                ))}
                            </div>`;

content = content.replace(alertsRegex, newAlertsHTML);

// 5. Replace Business Acquisition Funnel with 4 Cards + Toggle
const salesRegex = /\{\/\* Sales \(Medium - 6x2\) \*\/\}[\s\S]*?\{\/\* Manufacturing \(Small - 3\) \*\/\}/;

const newSalesHTML = `{/* Sales (Medium - 6x2) */}
                    <div className="col-span-12 md:col-span-6 row-span-2 group relative">
                        <div className="h-full w-full bg-white rounded-3xl p-6 border border-zinc-200 transition-all duration-300 relative overflow-hidden flex flex-col justify-between">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />

                            <div className="flex items-center justify-between relative z-10 mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-50 rounded-2xl w-fit">
                                        <Users className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-zinc-900 leading-tight">Business Acquisition</h3>
                                        <p className="text-sm text-zinc-500 mt-0.5">Track leads and conversion rates.</p>
                                    </div>
                                </div>
                                <div className="flex bg-zinc-100 p-1 rounded-lg">
                                    <button 
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSalesToggle("value"); }}
                                        className={\`px-3 py-1 text-xs font-bold rounded-md transition-all \${salesToggle === 'value' ? 'bg-white shadow-sm text-blue-700' : 'text-zinc-500'}\`}
                                    >Value</button>
                                    <button 
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSalesToggle("nos"); }}
                                        className={\`px-3 py-1 text-xs font-bold rounded-md transition-all \${salesToggle === 'nos' ? 'bg-white shadow-sm text-blue-700' : 'text-zinc-500'}\`}
                                    >Nos</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 relative z-10 h-full">
                                <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100 flex flex-col justify-center">
                                    <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-2">Leads</div>
                                    <div className="text-2xl font-black text-zinc-800">
                                        {salesToggle === 'nos' ? '124' : '₹4.5Cr'}
                                    </div>
                                </div>
                                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex flex-col justify-center">
                                    <div className="text-[10px] uppercase font-bold text-blue-600/80 tracking-wider mb-2">Quotations</div>
                                    <div className="text-2xl font-black text-blue-700">
                                        {salesToggle === 'nos' ? (data?.salesFunnel.quotation || 65) : '₹2.8Cr'}
                                    </div>
                                </div>
                                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex flex-col justify-center">
                                    <div className="text-[10px] uppercase font-bold text-amber-600/80 tracking-wider mb-2">Negotiation</div>
                                    <div className="text-2xl font-black text-amber-700">
                                        {salesToggle === 'nos' ? (data?.salesFunnel.negotiation || 22) : '₹1.1Cr'}
                                    </div>
                                </div>
                                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 flex flex-col justify-center">
                                    <div className="text-[10px] uppercase font-bold text-emerald-600/80 tracking-wider mb-2">Orders</div>
                                    <div className="text-2xl font-black text-emerald-700">
                                        {salesToggle === 'nos' ? (data?.salesFunnel.orderWin || 10) : '₹0.6Cr'}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); openDetailView("Sales Pipeline Details", "Sales"); }}
                            title="View Data Details"
                            className="absolute top-4 right-4 p-2 rounded-full bg-zinc-100 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 transition-all z-20 opacity-0 group-hover:opacity-100"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Manufacturing (Small - 3) */}`;

content = content.replace(salesRegex, newSalesHTML);

fs.writeFileSync(p, content, 'utf8');

// Write tailwind infinite scroll config
let cssPath = path.resolve(__dirname, 'app/globals.css');
let cssContent = fs.readFileSync(cssPath, 'utf8');
if (!cssContent.includes('@keyframes scrollUp')) {
    cssContent += \`
@keyframes scrollUp {
  0% { transform: translateY(0); }
  100% { transform: translateY(-50%); }
}\`;
    fs.writeFileSync(cssPath, cssContent, 'utf8');
}

console.log("Updated DashboardContent.tsx and added CSS animations");
