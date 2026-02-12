"use client"

import { useState } from "react"
import {
    LifeBuoy,
    AlertOctagon,
    CheckCircle,
    Clock,
    ThumbsUp,
    MessageSquare,
    Plus,
    Eye,
    TrendingUp,
    TrendingDown,
    Heart,
    Ticket
} from "lucide-react"
import { useEffect } from "react"
import { useHeader } from "@/components/providers/HeaderProvider"
import { SmartEntrySheet } from "@/components/data-entry/SmartEntrySheet"
import { Button } from "@/components/ui/button"
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend
} from 'recharts'


export default function SupportPage() {
    const { setHeaderInfo } = useHeader()

    useEffect(() => {
        setHeaderInfo("Field Support", "Ticket resolution and customer satisfaction.")
    }, [setHeaderInfo])
    const [period, setPeriod] = useState("Weekly")
    const [isEntryOpen, setIsEntryOpen] = useState(false)
    const [metrics, setMetrics] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/metrics?category=support&period=${period}`)
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

    // Derived Data
    const openTickets = latest.openTickets || 0
    const resolved = latest.resolvedTickets || 0
    const total = latest.totalTickets || (openTickets + resolved)

    // Fallback if total is 0 to avoid empty charts
    const ticketStatusData = [
        { name: 'Open', value: openTickets, fill: '#3b82f6' },
        { name: 'Resolved', value: resolved, fill: '#10b981' },
    ]

    // Help Desk Live Feed
    const supportFeed = [
        { id: 1, title: "New Ticket #3882", desc: "Login issue reported.", time: "2m ago", type: "info" },
        { id: 2, title: "Escalation", desc: "Enterprise client outage.", time: "1h ago", type: "alert" },
        { id: 3, title: "Resolved #3880", desc: "Fixed in 15 mins.", time: "3h ago", type: "success" },
        { id: 4, title: "Chat Session", desc: "Agent active with User.", time: "4h ago", type: "neutral" },
    ]

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Actions Bar */}
            <div className="flex justify-end items-center gap-4 mb-2">

                <div className="flex items-center gap-3">
                    <div className="flex items-center px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-full">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse mr-2" />
                        <span className="text-sm font-medium text-rose-800">Support Live</span>
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
                                        <p className="text-sm font-medium text-zinc-500">Open Tickets</p>
                                        <h3 className="text-2xl font-bold text-zinc-900 mt-1">{openTickets}</h3>
                                    </div>
                                    <div className="p-2 bg-blue-50 rounded-xl">
                                        <MessageSquare className="w-5 h-5 text-blue-600" />
                                    </div>
                                </div>
                                <div className="flex items-center text-xs text-zinc-500 font-medium bg-blue-50 w-fit px-2 py-1 rounded-full">
                                    {total} Total this period
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
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
                                        <p className="text-sm font-medium text-zinc-500">Critical Issues</p>
                                        <h3 className="text-2xl font-bold text-zinc-900 mt-1">{latest.criticalIssues || 0}</h3>
                                    </div>
                                    <div className="p-2 bg-rose-50 rounded-xl">
                                        <AlertOctagon className="w-5 h-5 text-rose-600" />
                                    </div>
                                </div>
                                <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-rose-500 h-full" style={{ width: total ? `${((latest.criticalIssues || 0) / total) * 100}%` : '0%' }} />
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
                                        <p className="text-sm font-medium text-zinc-500">CSAT Score</p>
                                        <h3 className="text-2xl font-bold text-zinc-900 mt-1">{latest.csatScore || 0}/5.0</h3>
                                    </div>
                                    <div className="p-2 bg-emerald-50 rounded-xl">
                                        <ThumbsUp className="w-5 h-5 text-emerald-600" />
                                    </div>
                                </div>
                                <div className="flex space-x-1 mt-2">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= (latest.csatScore || 0) ? 'bg-emerald-500' : 'bg-emerald-200'}`} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Support Excellence Row (FCR, AHT, NPS) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                        <p className="text-sm font-medium text-zinc-500">First Contact Resolution</p>
                                        <h3 className="text-2xl font-bold text-zinc-900 mt-1">{latest.fcr || 0}%</h3>
                                    </div>
                                    <div className="p-2 bg-blue-50 rounded-xl">
                                        <CheckCircle className="w-5 h-5 text-blue-600" />
                                    </div>
                                </div>
                                <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-blue-600 h-full" style={{ width: `${latest.fcr || 0}%` }} />
                                </div>
                            </div>
                        </div>

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
                                        <p className="text-sm font-medium text-zinc-500">Average Handle Time</p>
                                        <h3 className="text-2xl font-bold text-zinc-900 mt-1">{latest.aht || 0}m</h3>
                                    </div>
                                    <div className="p-2 bg-amber-50 rounded-xl">
                                        <Clock className="w-5 h-5 text-amber-600" />
                                    </div>
                                </div>
                                <div className="text-xs text-zinc-400">Target: &lt; 15m</div>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
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
                                        <p className="text-sm font-medium text-zinc-500">Net Promoter Score</p>
                                        <h3 className="text-2xl font-bold text-zinc-900 mt-1">{latest.nps || 0}</h3>
                                    </div>
                                    <div className="p-2 bg-rose-50 rounded-xl">
                                        <Heart className="w-5 h-5 text-rose-600" />
                                    </div>
                                </div>
                                <div className="flex items-center text-xs text-rose-600 font-medium bg-rose-50 w-fit px-2 py-1 rounded-full">
                                    Customer Sentiment
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chart Grid */}
                    <div className="grid grid-cols-12 gap-6 h-[400px]">
                        {/* Large Chart: Ticket Status Pie */}
                        <div className="col-span-12 md:col-span-8 bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm relative overflow-hidden group">
                            <h3 className="font-bold text-zinc-900 mb-6 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-zinc-400" />
                                Ticket Status
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
                                    <PieChart>
                                        <Pie
                                            data={ticketStatusData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={80}
                                            outerRadius={120}
                                            paddingAngle={5}
                                            dataKey="value"
                                            cornerRadius={8}
                                        >
                                            {ticketStatusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Smaller Box: Performance Stats */}
                        <div className="col-span-12 md:col-span-4 bg-zinc-900 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between group">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
                            <div>
                                <h3 className="font-bold text-white mb-2 z-10 relative">Support KPIs</h3>
                                <p className="text-zinc-400 text-xs relative z-10">Efficiency Metrics</p>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsEntryOpen(true); }}
                                title="View Details"
                                className="absolute top-6 right-6 p-1.5 rounded-full bg-white/10 text-zinc-400 hover:text-white hover:bg-white/20 transition-all z-20 opacity-0 group-hover:opacity-100"
                            >
                                <Eye className="w-4 h-4" />
                            </button>

                            <div className="space-y-4 relative z-10">
                                {/* Avg Response Time */}
                                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <Clock className="w-5 h-5 text-zinc-400" />
                                        <span className="text-xs font-medium text-zinc-300">Avg. Response Time</span>
                                    </div>
                                    <div className="text-3xl font-bold text-white">{latest.avgResponseTime || 0}<span className="text-sm font-normal text-zinc-500 ml-1">hrs</span></div>
                                    <div className="text-[10px] text-emerald-400 font-medium mt-1">Faster than SLA</div>
                                </div>

                                {/* Resolution Rate */}
                                <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                                        <span className="text-xs font-medium text-emerald-200">Resolution Rate</span>
                                    </div>
                                    <div className="text-3xl font-bold text-emerald-400">
                                        {total ? Math.round((resolved / total) * 100) : 0}%
                                    </div>
                                    <div className="text-[10px] text-emerald-600 font-medium mt-1">Tickets Resolved</div>
                                </div>
                            </div>

                            <Button variant="outline" size="sm" className="w-full mt-4 bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10">
                                View Team Stats
                            </Button>
                        </div>
                    </div>

                </div>

                {/* Right Column: Live Feed - Spans 3 cols */}
                <div className="col-span-12 lg:col-span-3 h-full min-h-[500px]">
                    <div className="h-full w-full bg-white rounded-3xl p-6 flex flex-col border border-zinc-200 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-zinc-900">Live Support</h3>
                            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        </div>

                        <div className="flex-1 space-y-4 overflow-hidden relative">
                            {/* Mock Feed Items */}
                            {supportFeed.map((item, i) => (
                                <div key={i} className="flex gap-3 items-start p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                                    <div className={`w-1.5 h-1.5 mt-2 rounded-full shrink-0 ${item.type === 'success' ? 'bg-emerald-500' : item.type === 'alert' ? 'bg-rose-500' : 'bg-blue-500'}`} />
                                    <div>
                                        <h4 className="text-sm font-semibold text-zinc-900">{item.title}</h4>
                                        <p className="text-xs text-zinc-500">{item.desc}</p>
                                        <span className="text-[10px] text-zinc-400 mt-1 block">{item.time}</span>
                                    </div>
                                </div>
                            ))}

                            <div className="p-4 bg-rose-50 rounded-2xl mt-8 border border-rose-100">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-sm font-bold text-rose-900">Queued</h4>
                                    <span className="text-xs font-medium text-rose-700 bg-rose-200 px-2 py-0.5 rounded-full">High</span>
                                </div>
                                <div className="text-2xl font-bold text-rose-800">12 Pending</div>
                                <p className="text-xs text-rose-600 mt-1">Wait time ~15m.</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <SmartEntrySheet
                isOpen={isEntryOpen}
                onClose={() => { setIsEntryOpen(false); fetchData(); }}
                category="support"
            />
        </div>
    )
}
