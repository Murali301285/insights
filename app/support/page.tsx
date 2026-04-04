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
import { cn } from "@/lib/utils"

export default function SupportPage() {
    const { setHeaderInfo } = useHeader()
    const { period: globalPeriod } = useFilter()

    useEffect(() => {
        setHeaderInfo("Field Support & Service", "Monitor ticket volumes, resolution rates, and critical issues.")
    }, [setHeaderInfo])

    const [isEntryOpen, setIsEntryOpen] = useState(false)
    const [metrics, setMetrics] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [localPeriod, setLocalPeriod] = useState("Weekly")

    const [criticalModalOpen, setCriticalModalOpen] = useState(false)
    const [totalTicketsModalOpen, setTotalTicketsModalOpen] = useState(false)
    const [openTicketsModalOpen, setOpenTicketsModalOpen] = useState(false)
    const [resolvedTicketsModalOpen, setResolvedTicketsModalOpen] = useState(false)

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/metrics?category=support&period=${localPeriod}`)
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

    const ticketsDiff = getDiff(latest.totalTickets || 0, latest.prevTotalTickets || 0)
    const openDiff = getDiff(latest.openTickets || 0, latest.prevOpenTickets || 0)
    const resolvedDiff = getDiff(latest.resolvedTickets || 0, latest.prevResolvedTickets || 0)

    const issuePriorityData = [
        { name: "Critical", value: latest.criticalIssues || 0, color: "#f43f5e" },
        { name: "Open Normal", value: (latest.openTickets || 0) - (latest.criticalIssues || 0), color: "#f59e0b" },
        { name: "Resolved", value: latest.resolvedTickets || 0, color: "#10b981" }
    ]

    const baseDate = new Date();
    const trendData = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(baseDate);
        d.setDate(d.getDate() - (6 - i));
        
        const multipliers = [0.9, 1.2, 0.8, 1.1, 1.4, 0.7, 1.0];
        const baseOpen = Math.round((latest.openTickets || 45) / 3);
        const baseResolved = Math.round((latest.resolvedTickets || 305) / 5);
        
        return {
            name: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
            resolved: Math.round(baseResolved * multipliers[i]),
            open: Math.round(baseOpen * multipliers[i])
        };
    });

    const activeTickets = [
        { id: "T-8902", title: "System Outage", priority: "Critical", time: "10m ago" },
        { id: "T-8903", title: "Login Error", priority: "High", time: "1h ago" },
        { id: "T-8904", title: "Billing Question", priority: "Normal", time: "2h ago" },
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
                                        <span>Internal: <span className="text-zinc-600">{Math.round((latest.totalTickets || 350) * 0.32)}</span></span>
                                        <span className="text-zinc-300">|</span>
                                        <span>External: <span className="text-zinc-600">{Math.round((latest.totalTickets || 350) * 0.68)}</span></span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center gap-3 relative z-20">
                                    <button onClick={() => setTotalTicketsModalOpen(true)} className="text-zinc-400 hover:text-blue-600 transition-colors">
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
                                        <span>Internal: <span className="text-zinc-600">{Math.round((latest.openTickets || 45) * 0.42)}</span></span>
                                        <span className="text-zinc-300">|</span>
                                        <span>External: <span className="text-zinc-600">{Math.round((latest.openTickets || 45) * 0.58)}</span></span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center gap-3 relative z-20">
                                    <button onClick={() => setOpenTicketsModalOpen(true)} className="text-zinc-400 hover:text-amber-600 transition-colors">
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
                                    <h2 className="text-3xl font-black text-zinc-900 tracking-tight">{latest.resolutionTime || 2.4} Days</h2>
                                    <div className="flex gap-2 mt-1 text-[11px] font-bold text-zinc-400">
                                        <span>Internal: <span className="text-zinc-600">1.2 Days</span></span>
                                        <span className="text-zinc-300">|</span>
                                        <span>External: <span className="text-zinc-600">3.1 Days</span></span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center gap-3 relative z-20">
                                    <button onClick={() => setResolvedTicketsModalOpen(true)} className="text-zinc-400 hover:text-emerald-600 transition-colors">
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
                        {/* Critical Issues */}
                        <div
                            className="bg-zinc-900 rounded-3xl p-6 shadow-xl relative overflow-hidden cursor-pointer group transition-all hover:scale-[1.01]"
                            onClick={() => setCriticalModalOpen(true)}
                        >
                            <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
                            <button
                                title="Deep Dive"
                                className="absolute top-6 right-6 p-1.5 rounded-full bg-white/10 text-zinc-400 group-hover:text-rose-400 group-hover:bg-rose-400/20 transition-all z-20"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-bold text-white text-lg">Critical Issues</h3>
                                </div>
                                <p className="text-zinc-400 text-sm mb-4">High priority escalations</p>

                                <div className="flex justify-between items-center bg-rose-500/10 p-4 rounded-xl border border-rose-500/20 border-l-4 border-l-rose-500">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-rose-500/20 rounded-full">
                                            <AlertCircle className="w-6 h-6 text-rose-400" />
                                        </div>
                                        <div>
                                            <div className="text-xs text-rose-200">Needs Immediate Action</div>
                                            <div className="text-2xl font-bold text-white">{latest.criticalIssues || 0}</div>
                                        </div>
                                    </div>
                                    <div className="bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                                        ACT NOW
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Avg Response Time */}
                        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-zinc-900 text-lg">Avg Response Time</h3>
                                    <p className="text-zinc-500 text-sm">Time to first reply</p>
                                </div>
                                <div className="p-2 bg-blue-50 rounded-xl">
                                    <Clock className="w-5 h-5 text-blue-600" />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2 mb-4">
                                <span className="text-4xl font-bold text-zinc-900">{latest.avgResponseTime || 0}h</span>
                            </div>
                            <div className="flex gap-2">
                                <div className="h-2 flex-1 bg-emerald-500 rounded-l-full" />
                                <div className="h-2 flex-1 bg-emerald-500" />
                                <div className="h-2 flex-1 bg-zinc-100 rounded-r-full" />
                            </div>
                            <div className="flex justify-between mt-2 text-xs font-semibold text-emerald-600 w-2/3 pr-2">
                                <span>Fast</span>
                                <span>Normal</span>
                            </div>
                        </div>
                    </div>

                    {/* Chart Section */}
                    {/* Chart Section */}
                    <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm relative overflow-hidden h-[300px]">
                        <h3 className="font-bold text-zinc-900 mb-6 flex items-center gap-2">
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

                    {/* Most Frequent Tickets */}
                    <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm relative overflow-hidden mt-6">
                        <h3 className="font-bold text-zinc-900 flex items-center gap-2 mb-4">
                            <AlertCircle className="w-4 h-4 text-rose-400" />
                            Most Frequent Tickets
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { name: "Password Reset Requests", days: 12, category: "IT Support" },
                                { name: "System Outage Reports", days: 8, category: "Infrastructure" },
                                { name: "Access Denial Errors", days: 15, category: "Security" },
                                { name: "Software Install Request", days: 5, category: "Provisioning" }
                            ].map((ticket, i) => (
                                <div key={i} className="flex justify-between items-center p-4 bg-zinc-50 border border-zinc-100 rounded-xl hover:bg-zinc-100 transition-colors">
                                    <div>
                                        <p className="font-bold text-sm text-zinc-900">{ticket.name}</p>
                                        <p className="text-xs font-semibold text-zinc-500 mt-1">{ticket.category}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-rose-500 text-lg leading-none">{ticket.days}</p>
                                        <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Days avg</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="col-span-12 lg:col-span-3 h-full min-h-[500px]">
                    <div className="h-full w-full bg-white rounded-3xl p-6 flex flex-col border border-zinc-200 shadow-sm align-start relative overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-zinc-900">Active High Priority</h3>
                        </div>
                        <div className="flex-1 space-y-4 overflow-hidden relative">
                            {activeTickets.map((ticket, i) => (
                                <div key={i} className="flex flex-col gap-2 p-4 rounded-xl bg-zinc-50 border border-zinc-100 border-l-4 border-l-rose-400">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-sm font-bold text-zinc-900">{ticket.title}</h4>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-zinc-500">
                                        <span>{ticket.id}</span>
                                        <span className={`px-2 py-0.5 rounded-full font-semibold ${ticket.priority === 'Critical' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {ticket.priority}
                                        </span>
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

            {/* Critical Issues Modal */}
            <Dialog open={criticalModalOpen} onOpenChange={setCriticalModalOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            Critical Issues Breakdown <span className="text-xs bg-rose-100 text-rose-800 px-2 py-1 rounded-full uppercase tracking-wider">Deep Dive</span>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-6 flex flex-col items-center">
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={issuePriorityData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {issuePriorityData.map((entry, index) => (
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
                            {issuePriorityData.map((d, i) => (
                                <div key={i} className="flex justify-between items-center bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                                        <span className="font-semibold text-zinc-700">{d.name}</span>
                                    </div>
                                    <span className="font-bold text-zinc-900 text-lg">{d.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Total Tickets Modal */}
            <Dialog open={totalTicketsModalOpen} onOpenChange={setTotalTicketsModalOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Total Support Volume</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-xl">
                            <div>
                                <p className="text-sm text-blue-600 font-medium">Recorded Volume</p>
                                <p className="text-2xl font-bold text-blue-700">{latest.totalTickets || 0}</p>
                            </div>
                            <LifeBuoy className="w-8 h-8 text-blue-500 opacity-50" />
                        </div>
                        <p className="text-sm text-zinc-500">This metric represents the total number of support cases and field service requests logged into the system during the selected period.</p>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Open Tickets Modal */}
            <Dialog open={openTicketsModalOpen} onOpenChange={setOpenTicketsModalOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Open Tickets Status</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-100 rounded-xl">
                            <div>
                                <p className="text-sm text-amber-600 font-medium">Pending Resolution</p>
                                <p className="text-2xl font-bold text-amber-700">{latest.openTickets || 0}</p>
                            </div>
                            <AlertCircle className="w-8 h-8 text-amber-500 opacity-50" />
                        </div>
                        <p className="text-sm text-zinc-500">This metric shows the current backlog of unresolved support tickets, indicating the volume of ongoing field service demands.</p>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Resolved Tickets Modal */}
            <Dialog open={resolvedTicketsModalOpen} onOpenChange={setResolvedTicketsModalOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Resolved Tickets Details</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                            <div>
                                <p className="text-sm text-emerald-600 font-medium">Completed Service</p>
                                <p className="text-2xl font-bold text-emerald-700">{latest.resolvedTickets || 0}</p>
                            </div>
                            <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-50" />
                        </div>
                        <p className="text-sm text-zinc-500">This metric represents the number of support requests successfully closed and resolved, reflecting your team's throughput.</p>
                    </div>
                </DialogContent>
            </Dialog>

            <TicketManager
                isOpen={isEntryOpen}
                onClose={() => { setIsEntryOpen(false); fetchData(); }}
            />
        </div>
    )
}
