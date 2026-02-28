"use client"

import { useState, useEffect } from "react"
import { PremiumCard } from "@/components/design/PremiumCard"
import { useHeader } from "@/components/providers/HeaderProvider"
import { useFilter } from "@/components/providers/FilterProvider"
import {
    Settings, AlertCircle, Clock, CheckCircle2,
    ArrowUpRight, TrendingUp, TrendingDown, Plus, Eye,
    Activity, LayoutList
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SmartEntrySheet } from "@/components/data-entry/SmartEntrySheet"

export default function ManufacturingPage() {
    const { setHeaderInfo } = useHeader()
    const { period } = useFilter() // Manufacturing deals more with counts/percentages than currency usually

    useEffect(() => {
        setHeaderInfo("Manufacturing & Assembly", "Track RFQ volumes, production efficiency, and project health.")
    }, [setHeaderInfo])

    const [isEntryOpen, setIsEntryOpen] = useState(false)
    const [metrics, setMetrics] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const [projectModalOpen, setProjectModalOpen] = useState(false)

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

    // Eff Trend
    const trendData = metrics.map((m: any) => ({
        name: new Date(m.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
        efficiency: m.efficiency || 0
    })).reverse()

    // Project Status Pie Data
    const projectStatusData = [
        { name: "On Track", value: latest.projectOnTrack || 0, color: "#10b981" },
        { name: "Behind Schedule", value: latest.projectBehindSchedule || 0, color: "#f59e0b" },
        { name: "Critical", value: latest.projectCritical || 0, color: "#f43f5e" }
    ]

    const totalProjects = (latest.projectOnTrack || 0) + (latest.projectBehindSchedule || 0) + (latest.projectCritical || 0)

    const activeWorkOrders = [
        { id: "WO-2024-089", client: "TechCorp", status: "On Track", progress: 85 },
        { id: "WO-2024-090", client: "Acme Ind", status: "Critical", progress: 30 },
        { id: "WO-2024-091", client: "Globex", status: "Behind", progress: 65 },
        { id: "WO-2024-092", client: "Soylent", status: "On Track", progress: 95 },
    ]

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">

            {/* Actions Bar */}
            <div className="flex justify-end items-center gap-4 mb-2">
                <Button onClick={() => setIsEntryOpen(true)} size="sm" className="gap-2 bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg hover:shadow-xl transition-all">
                    <Plus className="w-4 h-4" />
                    New Log
                </Button>
            </div>

            <div className="grid grid-cols-12 gap-6 h-auto">
                <div className="col-span-12 lg:col-span-9 space-y-6">

                    {/* RFQ Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <PremiumCard
                            title="New RFQs (This Week)"
                            value={latest.rfqNew || 0}
                            icon={<LayoutList className="w-4 h-4 text-blue-600" />}
                            trend={{ value: 0, label: "Total incoming requests", positive: true }}
                            borderGlow="blue"
                        />
                        <PremiumCard
                            title="Standard RFQs"
                            value={latest.rfqStandard || 0}
                            icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                            trend={{ value: 0, label: "Ready to quote", positive: true }}
                            borderGlow="emerald"
                        />
                        <PremiumCard
                            title="Custom RFQs"
                            value={latest.rfqCustom || 0}
                            icon={<Settings className="w-4 h-4 text-purple-600" />}
                            trend={{ value: 0, label: "Requires engineering review", positive: true }}
                            borderGlow="purple"
                        />
                    </div>

                    {/* Deep Dive & Trend Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Project Status trigger */}
                        <div
                            className="bg-zinc-900 rounded-3xl p-6 shadow-xl relative overflow-hidden cursor-pointer group transition-all hover:scale-[1.01]"
                            onClick={() => setProjectModalOpen(true)}
                        >
                            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
                            <button
                                title="Deep Dive"
                                className="absolute top-6 right-6 p-1.5 rounded-full bg-white/10 text-zinc-400 group-hover:text-amber-400 group-hover:bg-amber-400/20 transition-all z-20"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-bold text-white text-lg">Project Status</h3>
                                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-semibold uppercase">Deep Dive</span>
                                </div>
                                <p className="text-zinc-400 text-sm mb-4">Total Active Projects: <span className="text-white font-bold">{totalProjects}</span></p>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg border border-white/5">
                                        <span className="text-xs text-zinc-400">On Track</span>
                                        <span className="text-sm font-bold text-emerald-400">{latest.projectOnTrack || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg border border-white/5">
                                        <span className="text-xs text-zinc-400">At Risk (Behind/Critical)</span>
                                        <span className="text-sm font-bold text-rose-400">{(latest.projectBehindSchedule || 0) + (latest.projectCritical || 0)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Overall Efficiency */}
                        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-zinc-900 text-lg">Plant Efficiency</h3>
                                    <p className="text-zinc-500 text-sm">Overall Equipment Effectiveness</p>
                                </div>
                                <div className="p-2 bg-emerald-50 rounded-xl">
                                    <Activity className="w-5 h-5 text-emerald-600" />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2 mb-4">
                                <span className="text-4xl font-bold text-zinc-900">{latest.efficiency || 0}%</span>
                            </div>
                            <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: `${latest.efficiency || 0}%` }} />
                            </div>
                        </div>
                    </div>

                    {/* Chart Section */}
                    <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm relative overflow-hidden h-[300px]">
                        <h3 className="font-bold text-zinc-900 mb-6 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-zinc-400" />
                            Efficiency Trend
                        </h3>
                        {trendData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="80%">
                                <AreaChart data={trendData}>
                                    <defs>
                                        <linearGradient id="colorEff" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} domain={[0, 100]} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ fontSize: '12px' }}
                                    />
                                    <Area type="monotone" dataKey="efficiency" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorEff)" name="Efficiency %" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-zinc-400">No data available.</div>
                        )}
                    </div>
                </div>

                {/* Right Column */}
                <div className="col-span-12 lg:col-span-3 h-full min-h-[500px]">
                    <div className="h-full w-full bg-white rounded-3xl p-6 flex flex-col border border-zinc-200 shadow-sm align-start relative overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-zinc-900">Active Work Orders</h3>
                        </div>
                        <div className="flex-1 space-y-4 overflow-hidden relative">
                            {activeWorkOrders.map((order, i) => (
                                <div key={i} className="flex flex-col gap-2 p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-xs font-bold text-zinc-900">{order.id}</h4>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${order.status === 'On Track' ? 'bg-emerald-100 text-emerald-700' :
                                                order.status === 'Critical' ? 'bg-rose-100 text-rose-700' :
                                                    'bg-amber-100 text-amber-700'
                                            }`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-500">{order.client}</p>
                                    <div className="h-1.5 w-full bg-zinc-200 rounded-full overflow-hidden mt-1">
                                        <div className={`h-full ${order.status === 'On Track' ? 'bg-emerald-500' :
                                                order.status === 'Critical' ? 'bg-rose-500' :
                                                    'bg-amber-500'
                                            }`} style={{ width: `${order.progress}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Project Status Modal */}
            <Dialog open={projectModalOpen} onOpenChange={setProjectModalOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            Project Status <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full uppercase tracking-wider">Deep Dive</span>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-6 flex flex-col items-center">
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={projectStatusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {projectStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="w-full mt-6 space-y-3">
                            {projectStatusData.map((d, i) => (
                                <div key={i} className="flex justify-between items-center bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                                        <span className="font-semibold text-zinc-700">{d.name}</span>
                                    </div>
                                    <span className="font-bold text-zinc-900">{d.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <SmartEntrySheet
                isOpen={isEntryOpen}
                onClose={() => { setIsEntryOpen(false); fetchData(); }}
                category="manufacturing"
            />
        </div>
    )
}
