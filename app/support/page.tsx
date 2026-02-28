"use client"

import { useState, useEffect } from "react"
import { PremiumCard } from "@/components/design/PremiumCard"
import { useHeader } from "@/components/providers/HeaderProvider"
import { useFilter } from "@/components/providers/FilterProvider"
import {
    LifeBuoy, CheckCircle2, AlertCircle, Clock, Plus, Eye, Activity
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SmartEntrySheet } from "@/components/data-entry/SmartEntrySheet"

export default function SupportPage() {
    const { setHeaderInfo } = useHeader()
    const { period } = useFilter()

    useEffect(() => {
        setHeaderInfo("Field Support & Service", "Monitor ticket volumes, resolution rates, and critical issues.")
    }, [setHeaderInfo])

    const [isEntryOpen, setIsEntryOpen] = useState(false)
    const [metrics, setMetrics] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const [criticalModalOpen, setCriticalModalOpen] = useState(false)

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

    const issuePriorityData = [
        { name: "Critical", value: latest.criticalIssues || 0, color: "#f43f5e" },
        { name: "Open Normal", value: (latest.openTickets || 0) - (latest.criticalIssues || 0), color: "#f59e0b" },
        { name: "Resolved", value: latest.resolvedTickets || 0, color: "#10b981" }
    ]

    const trendData = metrics.map((m: any) => ({
        name: new Date(m.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
        resolved: m.resolvedTickets || 0,
        open: m.openTickets || 0
    })).reverse()

    const activeTickets = [
        { id: "T-8902", title: "System Outage", priority: "Critical", time: "10m ago" },
        { id: "T-8903", title: "Login Error", priority: "High", time: "1h ago" },
        { id: "T-8904", title: "Billing Question", priority: "Normal", time: "2h ago" },
    ]

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">

            {/* Actions Bar */}
            <div className="flex justify-end items-center gap-4 mb-2">
                <Button onClick={() => setIsEntryOpen(true)} size="sm" className="gap-2 bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg hover:shadow-xl transition-all">
                    <Plus className="w-4 h-4" />
                    New Ticket Log
                </Button>
            </div>

            <div className="grid grid-cols-12 gap-6 h-auto">
                <div className="col-span-12 lg:col-span-9 space-y-6">

                    {/* KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <PremiumCard
                            title="Total Tickets"
                            value={latest.totalTickets || 0}
                            icon={<LifeBuoy className="w-4 h-4 text-blue-600" />}
                            trend={{ value: 0, label: "Volume this period", positive: true }}
                            borderGlow="blue"
                        />
                        <PremiumCard
                            title="Open Tickets"
                            value={latest.openTickets || 0}
                            icon={<AlertCircle className="w-4 h-4 text-amber-600" />}
                            trend={{ value: 0, label: "Awaiting resolution", positive: false }}
                            borderGlow="amber"
                        />
                        <PremiumCard
                            title="Resolved Tickets"
                            value={latest.resolvedTickets || 0}
                            icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                            trend={{ value: 0, label: "Successfully closed", positive: true }}
                            borderGlow="emerald"
                        />
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
                                    <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full font-semibold uppercase">Deep Dive</span>
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

            <SmartEntrySheet
                isOpen={isEntryOpen}
                onClose={() => { setIsEntryOpen(false); fetchData(); }}
                category="support"
            />
        </div>
    )
}
