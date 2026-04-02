"use client"

import { useState, useEffect } from "react"
import { PremiumCard } from "@/components/design/PremiumCard"
import { useHeader } from "@/components/providers/HeaderProvider"
import { useFilter } from "@/components/providers/FilterProvider"
import {
    Settings, AlertCircle, Clock, CheckCircle2,
    ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Plus, Eye,
    Activity, LayoutList
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn, formatCurrency } from "@/lib/utils"
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend, LabelList
} from 'recharts'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SmartEntrySheet } from "@/components/data-entry/SmartEntrySheet"

export default function ManufacturingPage() {
    const { setHeaderInfo } = useHeader()
    const { period: globalPeriod, currency } = useFilter()

    useEffect(() => {
        setHeaderInfo("Order Fulfilment", "Track RFQ volumes, production efficiency, and win order fulfillment.")
    }, [setHeaderInfo])

    const [isEntryOpen, setIsEntryOpen] = useState(false)
    const [isMetricsLogOpen, setIsMetricsLogOpen] = useState(false)
    const [logData, setLogData] = useState({
        efficiency: "", rfqNew: "", rfqStandard: "", rfqCustom: "",
        projectOnTrack: "", projectBehindSchedule: "", projectCritical: ""
    })
    const handleLogSave = async () => {
        const processed = Object.fromEntries(Object.entries(logData).map(([k, v]) => [k, Number(v) || 0]));
        try {
            const res = await fetch('/api/metrics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category: "manufacturing", data: processed, date: new Date().toISOString().split("T")[0], period: "Weekly" })
            });
            if (res.ok) {
                // toast.success("Metrics saved");
                fetchData();
                setLogData({ efficiency: "", rfqNew: "", rfqStandard: "", rfqCustom: "", projectOnTrack: "", projectBehindSchedule: "", projectCritical: "" })
            }
        } catch (e) { }
    }

    const [metrics, setMetrics] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [localPeriod, setLocalPeriod] = useState("Weekly")

    const [projectModalOpen, setProjectModalOpen] = useState(false)
    const [rfqNewModalOpen, setRfqNewModalOpen] = useState(false)
    const [rfqStandardModalOpen, setRfqStandardModalOpen] = useState(false)
    const [rfqCustomModalOpen, setRfqCustomModalOpen] = useState(false)

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/metrics?category=manufacturing&period=${localPeriod}`)
            const data = await res.json()
            setMetrics(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [localPeriod])

    const latest = metrics[0] || {}

    const getDiff = (curr: number, prev: number) => {
        if (!prev || prev === 0) return 0
        return ((curr - prev) / prev) * 100
    }

    const getPeriodText = () => {
        if (localPeriod === "Weekly") return "week"
        if (localPeriod === "Monthly") return "month"
        if (localPeriod === "Quarterly") return "quarter"
        if (localPeriod === "Annual") return "year"
        return "month"
    }
    const periodText = getPeriodText()

    const rfqNewDiff = getDiff(latest.rfqNew || 0, latest.prevRfqNew || 0)
    const rfqStandardDiff = getDiff(latest.rfqStandard || 0, latest.prevRfqStandard || 0)
    const rfqCustomDiff = getDiff(latest.rfqCustom || 0, latest.prevRfqCustom || 0)

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
                {/* Local Period Toggle */}
                <div className="flex bg-zinc-100 p-1 rounded-full border border-zinc-200">
                    {['Weekly', 'Monthly', 'Quarterly', 'Annual'].map((p) => (
                        <button
                            key={p}
                            onClick={() => setLocalPeriod(p)}
                            className={cn(
                                "px-4 py-1.5 text-sm rounded-full font-medium transition-colors",
                                localPeriod === p
                                    ? "bg-zinc-900 text-white shadow-sm"
                                    : "text-zinc-500 hover:text-zinc-900"
                            )}
                        >
                            {p}
                        </button>
                    ))}
                </div>
                <Button onClick={() => setIsEntryOpen(true)} size="sm" className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg hover:shadow-xl transition-all h-9 rounded-full px-5">
                    <LayoutList className="w-4 h-4" />
                    Order Pipeline
                </Button>
            </div>

            <div className="grid grid-cols-12 gap-6 h-auto">
                <div className="col-span-12 lg:col-span-9 space-y-6">

                    {/* RFQ Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Annual Target */}
                        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-sm font-medium text-zinc-500">Annual Target</p>
                                        <h3 className="text-2xl font-bold text-zinc-900 mt-1">{formatCurrency(latest.annualTarget || 0, currency)}</h3>
                                    </div>
                                    <div className="flex flex-col gap-2 relative z-20">
                                        <div className="p-2 bg-emerald-50 ml-auto rounded-xl">
                                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center text-[10px] font-semibold w-fit px-2 py-0.5 rounded-full text-emerald-600 bg-emerald-50">
                                    Manufacturing Quota
                                </div>
                            </div>
                        </div>

                        {/* Standard RFQs */}
                        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-sm font-medium text-zinc-500">Standard RFQs</p>
                                        <h3 className="text-2xl font-bold text-zinc-900 mt-1">{latest.rfqStandard || 0}</h3>
                                    </div>
                                    <div className="flex flex-col gap-2 relative z-20">
                                        <button onClick={() => setRfqStandardModalOpen(true)} className="ml-auto p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-emerald-600 transition-all z-20">
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <div className="p-2 bg-emerald-50 rounded-xl">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                        </div>
                                    </div>
                                </div>
                                <div className={`flex items-center text-[10px] font-semibold w-fit px-2 py-0.5 rounded-full ${rfqStandardDiff > 0 ? 'text-emerald-600 bg-emerald-50' : rfqStandardDiff < 0 ? 'text-rose-600 bg-rose-50' : 'text-amber-600 bg-amber-50'}`}>
                                    {rfqStandardDiff > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : rfqStandardDiff < 0 ? <ArrowDownRight className="w-3 h-3 mr-1" /> : null}
                                    {Math.abs(rfqStandardDiff).toFixed(1)}% vs prev {periodText}
                                </div>
                            </div>
                        </div>

                        {/* Custom RFQs */}
                        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-sm font-medium text-zinc-500">Custom RFQs</p>
                                        <h3 className="text-2xl font-bold text-zinc-900 mt-1">{latest.rfqCustom || 0}</h3>
                                    </div>
                                    <div className="flex flex-col gap-2 relative z-20">
                                        <button onClick={() => setRfqCustomModalOpen(true)} className="ml-auto p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-purple-600 transition-all z-20">
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <div className="p-2 bg-purple-50 rounded-xl">
                                            <Settings className="w-5 h-5 text-purple-600" />
                                        </div>
                                    </div>
                                </div>
                                <div className={`flex items-center text-[10px] font-semibold w-fit px-2 py-0.5 rounded-full ${rfqCustomDiff > 0 ? 'text-emerald-600 bg-emerald-50' : rfqCustomDiff < 0 ? 'text-rose-600 bg-rose-50' : 'text-amber-600 bg-amber-50'}`}>
                                    {rfqCustomDiff > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : rfqCustomDiff < 0 ? <ArrowDownRight className="w-3 h-3 mr-1" /> : null}
                                    {Math.abs(rfqCustomDiff).toFixed(1)}% vs prev {periodText}
                                </div>
                            </div>
                        </div>
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
                            <Activity className="w-4 h-4 text-zinc-400" />
                            Project Stages
                        </h3>
                        {(latest.stageData || projectStatusData).length > 0 ? (
                            <ResponsiveContainer width="100%" height="80%">
                                <BarChart data={latest.stageData || projectStatusData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                                    <RechartsTooltip
                                        cursor={{ fill: '#f4f4f5' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                        <LabelList dataKey="value" position="top" fill="#52525b" fontSize={12} fontWeight={600} />
                                        {(latest.stageData || projectStatusData).map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
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

                    {/* Quick Log Metrics Section */}
                    <div className="w-full bg-white rounded-3xl p-6 flex flex-col border border-zinc-200 shadow-sm mt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-zinc-900">Quick Log Weekly KPIs</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-zinc-500">Efficiency %</label>
                                    <input type="number" className="w-full text-sm p-1.5 border rounded-md" value={logData.efficiency} onChange={e => setLogData({ ...logData, efficiency: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-zinc-500">New RFQs</label>
                                    <input type="number" className="w-full text-sm p-1.5 border rounded-md" value={logData.rfqNew} onChange={e => setLogData({ ...logData, rfqNew: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-zinc-500">On Track Pj</label>
                                    <input type="number" className="w-full text-sm p-1.5 border rounded-md" value={logData.projectOnTrack} onChange={e => setLogData({ ...logData, projectOnTrack: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-zinc-500">Critical Pj</label>
                                    <input type="number" className="w-full text-sm p-1.5 border rounded-md" value={logData.projectCritical} onChange={e => setLogData({ ...logData, projectCritical: e.target.value })} />
                                </div>
                            </div>
                            <Button onClick={handleLogSave} size="sm" className="w-full bg-zinc-900 text-white mt-2">Save Metrics</Button>
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
                                    <RechartsTooltip
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

            {/* New RFQs Modal */}
            <Dialog open={rfqNewModalOpen} onOpenChange={setRfqNewModalOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">New RFQs Breakdown</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-xl">
                            <div>
                                <p className="text-sm text-blue-600 font-medium">Unhandled Requests</p>
                                <p className="text-2xl font-bold text-blue-700">{latest.rfqNew || 0}</p>
                            </div>
                            <LayoutList className="w-8 h-8 text-blue-500 opacity-50" />
                        </div>
                        <p className="text-sm text-zinc-500">This metric represents the number of incoming Requests for Quotation (RFQs) that have not yet been processed or categorized into Standard or Custom tiers.</p>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Standard RFQs Modal */}
            <Dialog open={rfqStandardModalOpen} onOpenChange={setRfqStandardModalOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Standard RFQs Breakdown</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                            <div>
                                <p className="text-sm text-emerald-600 font-medium">Standard Processing</p>
                                <p className="text-2xl font-bold text-emerald-700">{latest.rfqStandard || 0}</p>
                            </div>
                            <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-50" />
                        </div>
                        <p className="text-sm text-zinc-500">This metric shows the volume of RFQs categorized as 'Standard' (typically off-the-shelf components or recurring simple orders) during the selected period.</p>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Custom RFQs Modal */}
            <Dialog open={rfqCustomModalOpen} onOpenChange={setRfqCustomModalOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Custom RFQs Breakdown</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="flex items-center justify-between p-4 bg-purple-50 border border-purple-100 rounded-xl">
                            <div>
                                <p className="text-sm text-purple-600 font-medium">Custom Engineering</p>
                                <p className="text-2xl font-bold text-purple-700">{latest.rfqCustom || 0}</p>
                            </div>
                            <Settings className="w-8 h-8 text-purple-500 opacity-50" />
                        </div>
                        <p className="text-sm text-zinc-500">This metric represents RFQs that require specialized engineering, bespoke manufacturing routes, or non-standard parts, driving custom quoting cycles.</p>
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
