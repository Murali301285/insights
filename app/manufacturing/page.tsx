"use client"

import { useState } from "react"
import { PremiumCard } from "@/components/design/PremiumCard"
import {
    Factory,
    Settings,
    AlertTriangle,
    CheckCircle2,
    Clock,
    ArrowUpRight,
    Plus,
    Eye,
    TrendingUp,
    TrendingDown
} from "lucide-react"
import { useEffect } from "react"
import { useHeader } from "@/components/providers/HeaderProvider"
import { SmartEntrySheet } from "@/components/data-entry/SmartEntrySheet"
import { Button } from "@/components/ui/button"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts'



export default function ManufacturingPage() {
    const { setHeaderInfo } = useHeader()

    useEffect(() => {
        setHeaderInfo("Manufacturing & Assembly", "Production tracking and project timelines.")
    }, [setHeaderInfo])
    const [period, setPeriod] = useState("Weekly")
    const [isEntryOpen, setIsEntryOpen] = useState(false)
    const [metrics, setMetrics] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/metrics?category=manufacturing&period=${period}`)
            const data = await res.json()
            setMetrics(data || [])
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [period])

    const latest = metrics[0] || {}

    const rfqData = [
        { name: 'New (This Week)', value: latest.rfqNew || 0, fill: '#3b82f6' },
        { name: 'Standard', value: latest.rfqStandard || 0, fill: '#64748b' },
        { name: 'Custom', value: latest.rfqCustom || 0, fill: '#8b5cf6' },
    ]

    const onTrack = latest.projectOnTrack || 0
    const delayed = latest.projectDelayed || 0
    const critical = latest.projectCritical || 0
    const totalProjects = onTrack + delayed + critical

    // Live Production Feed
    const productionAlerts = [
        { id: 1, title: "Line 2 Active", desc: "Running at 98% efficiency.", time: "10m ago", type: "success" },
        { id: 2, title: "Maintenance Due", desc: "CNC Machine 04 needs oil check.", time: "1h ago", type: "warning" },
        { id: 3, title: "Shift Change", desc: "Team Alpha clocked in.", time: "4h ago", type: "info" },
        { id: 4, title: "Material Low", desc: "Aluminum supply < 10%.", time: "5h ago", type: "alert" },
    ]

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Actions Bar */}
            <div className="flex justify-end items-center gap-4 mb-2">

                <div className="flex items-center gap-3">
                    <div className="flex items-center px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-full">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse mr-2" />
                        <span className="text-sm font-medium text-amber-800">Shop Floor Live</span>
                    </div>

                    <div className="flex items-center bg-white p-1 rounded-lg border border-zinc-200 shadow-sm ml-2">
                        {["Weekly", "Monthly", "Quarterly", "Annual"].map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${period === p
                                    ? "bg-zinc-900 text-white shadow-sm"
                                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                                    }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>

                    <Button onClick={() => setIsEntryOpen(true)} size="sm" className="gap-2 bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg hover:shadow-xl transition-all">
                        <Plus className="w-4 h-4" />
                        Entry
                    </Button>
                </div>
            </div>

            {/* Main Layout: Grid + Side Panel */}
            <div className="grid grid-cols-12 gap-6 h-auto">

                {/* Left Column: Metrics & Charts - Spans 9 cols */}
                <div className="col-span-12 lg:col-span-9 space-y-6">

                    {/* KPI Bento Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsEntryOpen(true); }}
                                title="View Data Details"
                                className="absolute top-4 right-4 p-1.5 rounded-full bg-emerald-50 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 transition-all z-20 opacity-0 group-hover:opacity-100 animate-pulse"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-sm font-medium text-zinc-500">Active Projects</p>
                                        <h3 className="text-2xl font-bold text-zinc-900 mt-1">{totalProjects}</h3>
                                    </div>
                                    <div className="p-2 bg-amber-50 rounded-xl">
                                        <Settings className="w-5 h-5 text-amber-600" />
                                    </div>
                                </div>
                                <div className="flex items-center space-x-1 text-xs text-zinc-500">
                                    <span className="text-red-600 font-bold">{critical}</span>
                                    <span>Critical</span>
                                    <span className="text-zinc-300">|</span>
                                    <span className="text-amber-600 font-bold">{delayed}</span>
                                    <span>Delayed</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsEntryOpen(true); }}
                                title="View Data Details"
                                className="absolute top-4 right-4 p-1.5 rounded-full bg-emerald-50 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 transition-all z-20 opacity-0 group-hover:opacity-100 animate-pulse"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-sm font-medium text-zinc-500">New RFQs</p>
                                        <h3 className="text-2xl font-bold text-zinc-900 mt-1">{latest.rfqNew || 0}</h3>
                                    </div>
                                    <div className="p-2 bg-blue-50 rounded-xl">
                                        <Clock className="w-5 h-5 text-blue-600" />
                                    </div>
                                </div>
                                <div className="flex items-center text-xs text-blue-600 font-medium bg-blue-50 w-fit px-2 py-1 rounded-full">
                                    <ArrowUpRight className="w-3 h-3 mr-1" />
                                    Total: {(latest.rfqNew || 0) + (latest.rfqStandard || 0) + (latest.rfqCustom || 0)}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsEntryOpen(true); }}
                                title="View Data Details"
                                className="absolute top-4 right-4 p-1.5 rounded-full bg-emerald-50 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 transition-all z-20 opacity-0 group-hover:opacity-100 animate-pulse"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-sm font-medium text-zinc-500">Efficiency Rate</p>
                                        <h3 className="text-2xl font-bold text-zinc-900 mt-1">{latest.efficiency || 0}%</h3>
                                    </div>
                                    <div className="p-2 bg-emerald-50 rounded-xl">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                    </div>
                                </div>
                                <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${Math.min(latest.efficiency || 0, 100)}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>



                    {/* Efficiency Metrics Row (OEE, Scrap, MTBF) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsEntryOpen(true); }}
                                title="View Data Details"
                                className="absolute top-4 right-4 p-1.5 rounded-full bg-emerald-50 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 transition-all z-20 opacity-0 group-hover:opacity-100 animate-pulse"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-sm font-medium text-zinc-500">OEE Score</p>
                                        <h3 className="text-2xl font-bold text-zinc-900 mt-1">{latest.oee || 0}%</h3>
                                    </div>
                                    <div className="p-2 bg-amber-50 rounded-xl">
                                        <Factory className="w-5 h-5 text-amber-600" />
                                    </div>
                                </div>
                                <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-amber-500 h-full" style={{ width: `${latest.oee || 0}%` }} />
                                </div>
                                <div className="mt-2 text-xs text-zinc-400">Target: &gt; 85%</div>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsEntryOpen(true); }}
                                title="View Data Details"
                                className="absolute top-4 right-4 p-1.5 rounded-full bg-emerald-50 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 transition-all z-20 opacity-0 group-hover:opacity-100 animate-pulse"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-sm font-medium text-zinc-500">Scrap Rate</p>
                                        <h3 className="text-2xl font-bold text-zinc-900 mt-1">{latest.scrapRate || 0}%</h3>
                                    </div>
                                    <div className="p-2 bg-red-50 rounded-xl">
                                        <AlertTriangle className="w-5 h-5 text-red-600" />
                                    </div>
                                </div>
                                <div className="text-xs text-zinc-400">Defective Units</div>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsEntryOpen(true); }}
                                title="View Data Details"
                                className="absolute top-4 right-4 p-1.5 rounded-full bg-emerald-50 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 transition-all z-20 opacity-0 group-hover:opacity-100 animate-pulse"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-sm font-medium text-zinc-500">MTBF</p>
                                        <h3 className="text-2xl font-bold text-zinc-900 mt-1">{latest.mtbf || 0}h</h3>
                                    </div>
                                    <div className="p-2 bg-blue-50 rounded-xl">
                                        <Clock className="w-5 h-5 text-blue-600" />
                                    </div>
                                </div>
                                <div className="text-xs text-zinc-400">Mean Time Between Failures</div>
                            </div>
                        </div>
                    </div>

                    {/* Chart Grid */}
                    <div className="grid grid-cols-12 gap-6 h-[400px]">
                        {/* Large Chart: RFQ Analysis */}
                        <div className="col-span-12 md:col-span-8 bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm relative overflow-hidden group">
                            <h3 className="font-bold text-zinc-900 mb-6 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-zinc-400" />
                                RFQ Analysis
                            </h3>
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsEntryOpen(true); }}
                                title="View Chart Data"
                                className="absolute top-6 right-6 p-1.5 rounded-full bg-zinc-50 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all z-20 opacity-0 group-hover:opacity-100"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={rfqData} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f4f4f5" />
                                        <XAxis type="number" hide />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#52525b', fontSize: 13, fontWeight: 500 }}
                                            width={120}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7' }}
                                        />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
                                            {rfqData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Smaller Box: Project Status */}
                        <div className="col-span-12 md:col-span-4 bg-zinc-900 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between group">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
                            <div>
                                <h3 className="font-bold text-white mb-2 z-10 relative">Project Health</h3>
                                <p className="text-zinc-400 text-xs relative z-10">Live status of active projects</p>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsEntryOpen(true); }}
                                title="View Details"
                                className="absolute top-6 right-6 p-1.5 rounded-full bg-white/10 text-zinc-400 hover:text-white hover:bg-white/20 transition-all z-20 opacity-0 group-hover:opacity-100"
                            >
                                <Eye className="w-4 h-4" />
                            </button>

                            <div className="space-y-4 relative z-10">
                                <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/10">
                                    <div>
                                        <div className="text-zinc-400 text-xs">On Track</div>
                                        <div className="text-emerald-400 font-bold">{onTrack}</div>
                                    </div>
                                    <div className="text-emerald-500 text-xs flex items-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" /> Good
                                    </div>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/10">
                                    <div>
                                        <div className="text-zinc-400 text-xs">Delayed</div>
                                        <div className="text-amber-400 font-bold">{delayed}</div>
                                    </div>
                                    <div className="text-amber-500 text-xs flex items-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" /> Action
                                    </div>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/10">
                                    <div>
                                        <div className="text-zinc-400 text-xs">Critical</div>
                                        <div className="text-red-400 font-bold">{critical}</div>
                                    </div>
                                    <div className="text-red-500 text-xs flex items-center">
                                        <AlertTriangle className="w-3 h-3 mr-1" /> Risk
                                    </div>
                                </div>
                            </div>

                            <Button variant="outline" size="sm" className="w-full mt-4 bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10">
                                Project List
                            </Button>
                        </div>
                    </div>

                </div>

                {/* Right Column: Live Feed - Spans 3 cols */}
                <div className="col-span-12 lg:col-span-3 h-full min-h-[500px]">
                    <div className="h-full w-full bg-white rounded-3xl p-6 flex flex-col border border-zinc-200 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-zinc-900">Floor Alerts</h3>
                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        </div>

                        <div className="flex-1 space-y-4 overflow-hidden relative">
                            {/* Mock Feed Items */}
                            {productionAlerts.map((item, i) => (
                                <div key={i} className="flex gap-3 items-start p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                                    <div className={`w-1.5 h-1.5 mt-2 rounded-full shrink-0 ${item.type === 'success' ? 'bg-emerald-500' : item.type === 'alert' ? 'bg-red-500' : 'bg-amber-500'}`} />
                                    <div>
                                        <h4 className="text-sm font-semibold text-zinc-900">{item.title}</h4>
                                        <p className="text-xs text-zinc-500">{item.desc}</p>
                                        <span className="text-[10px] text-zinc-400 mt-1 block">{item.time}</span>
                                    </div>
                                </div>
                            ))}

                            <div className="p-4 bg-amber-50 rounded-2xl mt-8 border border-amber-100">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-sm font-bold text-amber-900">Maintenance</h4>
                                    <span className="text-xs font-medium text-amber-700 bg-amber-200 px-2 py-0.5 rounded-full">Due</span>
                                </div>
                                <div className="text-2xl font-bold text-amber-800">4 Ops</div>
                                <p className="text-xs text-amber-600 mt-1">Scheduled for weekend.</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <SmartEntrySheet
                isOpen={isEntryOpen}
                onClose={() => { setIsEntryOpen(false); fetchData(); }}
                category="manufacturing"
            />
        </div >
    )
}
