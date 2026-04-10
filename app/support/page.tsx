"use client"

import { useState, useEffect } from "react"
import { PremiumCard } from "@/components/design/PremiumCard"
import { useHeader } from "@/components/providers/HeaderProvider"
import { useFilter } from "@/components/providers/FilterProvider"
import {
    LifeBuoy, CheckCircle2, AlertCircle, Clock, Plus, Eye, Activity,
    ArrowUpRight, ArrowDownRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TicketManager } from "@/components/data-entry/TicketManager"
import { KpiInsightModal } from "@/components/modals/KpiInsightModal"
import { cn } from "@/lib/utils"

export default function SupportPage() {
    const { setHeaderInfo } = useHeader()
    const { period: globalPeriod, selectedCompanyIds } = useFilter()

    useEffect(() => {
        setHeaderInfo("Field Support & Service", "Monitor ticket volumes, resolution rates, and critical issues.")
    }, [setHeaderInfo])

    const [isEntryOpen, setIsEntryOpen] = useState(false)
    const [metrics, setMetrics] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [localPeriod, setLocalPeriod] = useState("Weekly")

    const [criticalModalOpen, setCriticalModalOpen] = useState(false)
    const [insightModalOpen, setInsightModalOpen] = useState(false)
    const [insightData, setInsightData] = useState<{ title: string, metricKey: string, formulaDesc: string, formatType: "number" | "currency" | "percent" } | null>(null)

    const fetchData = async () => {
        setLoading(true)
        try {
            const companiesQuery = selectedCompanyIds?.length > 0 ? `&companies=${selectedCompanyIds.join(',')}` : '';
            const res = await fetch(`/api/metrics?category=support&period=${localPeriod}${companiesQuery}`)
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
    }, [localPeriod, selectedCompanyIds])

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

    const ticketsDiff = getDiff(latest.totalTickets || 0, latest.prevTotalTickets || 0)
    const openDiff = getDiff(latest.openTickets || 0, latest.prevOpenTickets || 0)
    const resolvedDiff = getDiff(latest.resolvedTickets || 0, latest.prevResolvedTickets || 0)

    const issuePriorityData = latest.trendData || [];
    const trendData = latest.trendData || [];
    const activeTickets = latest.activeTickets || [];

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
                <Button onClick={() => setIsEntryOpen(true)} size="sm" className="gap-2 bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg hover:shadow-xl transition-all h-9 rounded-full px-5">
                    <Plus className="w-4 h-4" />
                    Entry
                </Button>
            </div>

            <div className="grid grid-cols-12 gap-6 h-auto">
                <div className="col-span-12 lg:col-span-9 space-y-6">

                    {/* KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Total Tickets */}
                        <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100/50 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-semibold text-emerald-800 text-sm mb-1">Total Tickets</h3>
                                    <h2 className="text-3xl font-black text-zinc-900 tracking-tight">{latest.totalTickets || 0}</h2>
                                    <div className="flex gap-2 mt-1 text-[11px] font-bold text-zinc-400">
                                        <span>Internal: <span className="text-zinc-600">{latest.internalTotal || 0}</span></span>
                                        <span className="text-zinc-300">|</span>
                                        <span>External: <span className="text-zinc-600">{latest.externalTotal || 0}</span></span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center gap-3 relative z-20">
                                    <button onClick={() => { setInsightData({ title: "Total Tickets", metricKey: "totalTickets", formulaDesc: "Total support volume representing all logged items for the period.", formatType: "number" }); setInsightModalOpen(true); }} className="text-zinc-400 hover:text-blue-600 transition-colors">
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <div className="bg-blue-50 p-2 rounded-full shadow-sm border border-blue-100/50">
                                        <LifeBuoy className="w-5 h-5 text-blue-600" />
                                    </div>
                                </div>
                            </div>
                            <div className={`flex items-center text-[10px] font-semibold w-fit px-2 py-0.5 rounded-full border bg-white ${ticketsDiff < 0 ? 'text-emerald-700 border-emerald-200' : ticketsDiff > 0 ? 'text-amber-700 border-amber-200' : 'text-zinc-700 border-zinc-200'}`}>
                                {ticketsDiff < 0 ? <ArrowDownRight className="w-3 h-3 mr-1" /> : ticketsDiff > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : null}
                                {Math.abs(ticketsDiff).toFixed(1)}% vs prev {periodText}
                            </div>
                        </div>

                        {/* Open Tickets */}
                        <div className="bg-rose-50/50 rounded-2xl p-5 border border-rose-100/50 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-semibold text-rose-800 text-sm mb-1">Open Tickets</h3>
                                    <h2 className="text-3xl font-black text-zinc-900 tracking-tight">{latest.openTickets || 0}</h2>
                                    <div className="flex gap-2 mt-1 text-[11px] font-bold text-zinc-400">
                                        <span>Internal: <span className="text-zinc-600">{latest.internalOpen || 0}</span></span>
                                        <span className="text-zinc-300">|</span>
                                        <span>External: <span className="text-zinc-600">{latest.externalOpen || 0}</span></span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center gap-3 relative z-20">
                                    <button onClick={() => { setInsightData({ title: "Open Tickets", metricKey: "openTickets", formulaDesc: "Total number of unresolved support items indicating current backlog.", formatType: "number" }); setInsightModalOpen(true); }} className="text-zinc-400 hover:text-amber-600 transition-colors">
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <div className="bg-amber-50 p-2 rounded-full shadow-sm border border-amber-100/50">
                                        <AlertCircle className="w-5 h-5 text-amber-600" />
                                    </div>
                                </div>
                            </div>
                            <div className={`flex items-center text-[10px] font-semibold w-fit px-2 py-0.5 rounded-full border bg-white ${openDiff < 0 ? 'text-emerald-700 border-emerald-200' : openDiff > 0 ? 'text-rose-700 border-rose-200' : 'text-zinc-700 border-zinc-200'}`}>
                                {openDiff < 0 ? <ArrowDownRight className="w-3 h-3 mr-1" /> : openDiff > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : null}
                                {Math.abs(openDiff).toFixed(1)}% vs prev {periodText}
                            </div>
                        </div>

                        {/* Avg Time taken to complete */}
                        <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100/50 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-semibold text-blue-800 text-sm mb-1">Avg Time taken to complete</h3>
                                    <h2 className="text-3xl font-black text-zinc-900 tracking-tight">{latest.resolutionTime || 0} Days</h2>
                                    <div className="flex gap-2 mt-1 text-[11px] font-bold text-zinc-400">
                                        <span>Computed across {latest.resolvedTickets || 0} resolved items</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center gap-3 relative z-20">
                                    <button onClick={() => { setInsightData({ title: "Resolution Time", metricKey: "resolvedTickets", formulaDesc: "Total number of tickets successfully closed within the period.", formatType: "number" }); setInsightModalOpen(true); }} className="text-zinc-400 hover:text-emerald-600 transition-colors">
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <div className="bg-emerald-50 p-2 rounded-full shadow-sm border border-emerald-100/50">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                    </div>
                                </div>
                            </div>
                            <div className={`flex items-center text-[10px] font-semibold w-fit px-2 py-0.5 rounded-full border bg-white ${resolvedDiff > 0 ? 'text-emerald-700 border-emerald-200' : resolvedDiff < 0 ? 'text-rose-700 border-rose-200' : 'text-amber-700 border-amber-200'}`}>
                                {resolvedDiff > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : resolvedDiff < 0 ? <ArrowDownRight className="w-3 h-3 mr-1" /> : null}
                                {Math.abs(resolvedDiff).toFixed(1)}% vs prev {periodText}
                            </div>
                        </div>
                    </div>

                    {/* Deep Dives */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Active Volume */}
                        <div
                            className="bg-zinc-900 rounded-3xl p-6 shadow-xl relative overflow-hidden cursor-pointer group transition-all hover:scale-[1.01]"
                            onClick={() => setOpenTicketsModalOpen(true)}
                        >
                            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
                            <button
                                title="Deep Dive"
                                onClick={() => { setInsightData({ title: "Open Tickets", metricKey: "openTickets", formulaDesc: "Total unresolved support items indicating current backlog.", formatType: "number" }); setInsightModalOpen(true); }}
                                className="absolute top-6 right-6 p-1.5 rounded-full bg-white/10 text-zinc-400 group-hover:text-amber-400 group-hover:bg-amber-400/20 transition-all z-20"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-bold text-white text-lg">Active Volume</h3>
                                </div>
                                <p className="text-zinc-400 text-sm mb-4">Total unresolved tickets</p>

                                <div className="flex justify-between items-center bg-amber-500/10 p-4 rounded-xl border border-amber-500/20 border-l-4 border-l-amber-500">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-amber-500/20 rounded-full">
                                            <AlertCircle className="w-6 h-6 text-amber-400" />
                                        </div>
                                        <div>
                                            <div className="text-xs text-amber-200">Pending Resolution</div>
                                            <div className="text-2xl font-bold text-white">{latest.openTickets || 0}</div>
                                        </div>
                                    </div>
                                    <div className="bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                                        PRIORITY
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Avg Pending Ticket Age */}
                        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                            <button
                                title="Open Ticket Manager"
                                onClick={() => { setInsightData({ title: "Total Tickets", metricKey: "totalTickets", formulaDesc: "Detailed breakdown of ticket activity log.", formatType: "number" }); setInsightModalOpen(true); }}
                                className="absolute top-6 right-6 p-1.5 rounded-full bg-zinc-50 text-zinc-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all z-20"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div>
                                    <h3 className="font-bold text-zinc-900 text-lg">Avg Ticket Age</h3>
                                    <p className="text-zinc-500 text-sm">Age of open tickets</p>
                                </div>
                                <div className="p-2 bg-blue-50 rounded-xl mr-10 z-10">
                                    <Clock className="w-5 h-5 text-blue-600" />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2 mb-4">
                                <span className="text-4xl font-bold text-zinc-900">{latest.avgResponseTime || 0}d</span>
                            </div>
                            <div className="flex gap-2">
                                <div className="h-2 flex-1 bg-amber-500 rounded-l-full" />
                                <div className="h-2 flex-1 bg-zinc-100" />
                                <div className="h-2 flex-1 bg-zinc-100 rounded-r-full" />
                            </div>
                            <div className="flex justify-between mt-2 text-xs font-semibold text-amber-600 w-2/3 pr-2">
                                <span>Pending Time Tracker</span>
                            </div>
                        </div>
                    </div>

                    {/* Chart Section */}
                    {/* Chart Section */}
                    <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm relative overflow-hidden h-[300px] group">
                        <button
                            title="Open Ticket Manager"
                            onClick={() => { setInsightData({ title: "Total Tickets", metricKey: "totalTickets", formulaDesc: "Detailed breakdown of ticket activity log.", formatType: "number" }); setInsightModalOpen(true); }}
                            className="absolute top-6 right-6 p-1.5 rounded-full bg-zinc-50 text-zinc-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all z-20"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                        <h3 className="font-bold text-zinc-900 mb-6 flex items-center gap-2 relative z-10">
                            <Activity className="w-4 h-4 text-zinc-400" />
                            Ticket Resolution Trend
                        </h3>
                        {trendData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="80%">
                                <BarChart data={trendData} margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        cursor={{ fill: '#f4f4f5' }}
                                    />
                                    <Legend verticalAlign="top" height={36} />
                                    <Bar dataKey="resolved" name="Resolved" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="open" name="Open" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-zinc-400">No data available.</div>
                        )}
                    </div>

                    {/* Most Frequent Tickets - REMOVED (No ticket categorization schema exists) */}
                </div>

                {/* Right Column */}
                <div className="col-span-12 lg:col-span-3 h-full min-h-[500px]">
                    <div className="h-full w-full bg-white rounded-3xl p-6 flex flex-col border border-zinc-200 shadow-sm align-start relative overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-zinc-900">Longest Pending Tickets</h3>
                        </div>
                        <div className="flex-1 space-y-4 overflow-hidden relative overflow-y-auto pr-2">
                            {activeTickets.length === 0 ? <p className="text-zinc-400 text-sm">No pending tickets.</p> : null}
                            {activeTickets.map((ticket: any, i: number) => (
                                <div key={i} className="flex flex-col gap-2 p-4 rounded-xl bg-zinc-50 border border-zinc-100 border-l-4 border-l-amber-400">
                                    <div className="flex justify-between items-start gap-2">
                                        <h4 className="text-sm font-bold text-zinc-900 line-clamp-2">{ticket.title}</h4>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-zinc-500">
                                         <span className="font-mono text-[10px]">{ticket.id}</span>
                                         {ticket.age > 0 ? (
                                            <span className="text-rose-600 font-semibold">{ticket.age} days old</span>
                                         ) : (
                                            <span className="text-emerald-600 font-semibold">New today</span>
                                         )}
                                    </div>
                                    <div className="text-[10px] text-zinc-400 font-medium tracking-wide">
                                        Opened {ticket.time}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Removed Critical Issues Modal Schema Constraints */}

            {/* Unified KPI Insight Modal takes place of static ones */}

            <TicketManager
                isOpen={isEntryOpen}
                onClose={() => { setIsEntryOpen(false); fetchData(); }}
            />
            
            <KpiInsightModal
                open={insightModalOpen}
                onOpenChange={setInsightModalOpen}
                title={insightData?.title || null}
                metricKey={insightData?.metricKey || null}
                category="support"
                formulaDesc={insightData?.formulaDesc || null}
                formatType={insightData?.formatType}
            />
        </div>
    )
}
