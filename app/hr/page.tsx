"use client"

import { useState } from "react"
import {
    Users,
    UserPlus,
    Briefcase,
    TrendingUp,
    TrendingDown,
    Plus,
    Eye,
    Clock,
    GraduationCap,
    Heart
} from "lucide-react"
import { useEffect } from "react"
import { useHeader } from "@/components/providers/HeaderProvider"
import { SmartEntrySheet } from "@/components/data-entry/SmartEntrySheet"
import { Button } from "@/components/ui/button"

export default function HRPage() {
    const { setHeaderInfo } = useHeader()

    useEffect(() => {
        setHeaderInfo("HR & Admin Portal", "Workforce analytics and recruitment pipeline.")
    }, [setHeaderInfo])
    const [period, setPeriod] = useState("Monthly")
    const [isEntryOpen, setIsEntryOpen] = useState(false)
    const [metrics, setMetrics] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/metrics?category=hr&period=${period}`)
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

    // Pipeline Data
    const pipelineData = [
        { stage: 'Applied', count: latest.recruitedApplied || 0, color: 'bg-zinc-200' },
        { stage: 'Screening', count: latest.recruitedScreening || 0, color: 'bg-blue-200' },
        { stage: 'Interview', count: latest.recruitedInterview || 0, color: 'bg-indigo-300' },
        { stage: 'Offer', count: latest.recruitedOffer || 0, color: 'bg-purple-400' },
        { stage: 'Hired', count: latest.recruitedHired || 0, color: 'bg-emerald-500' },
    ]

    const maxCount = Math.max(...pipelineData.map(d => d.count), 1)

    // Employee Pulse Feed
    const employeePulse = [
        { id: 1, title: "New Hire", desc: "Sarah J. joined Engineering.", time: "1h ago", type: "success" },
        { id: 2, title: "Compliance", desc: "Annual training deadline.", time: "4h ago", type: "warning" },
        { id: 3, title: "Review Cycle", desc: "Q3 reviews start tomorrow.", time: "1d ago", type: "info" },
        { id: 4, title: "Office Event", desc: "Townhall in Main Conf.", time: "2d ago", type: "neutral" },
    ]

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Actions Bar */}
            <div className="flex justify-end items-center gap-4 mb-2">

                <div className="flex items-center gap-3">
                    <div className="flex items-center px-3 py-1.5 bg-violet-50 border border-violet-100 rounded-full">
                        <div className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse mr-2" />
                        <span className="text-sm font-medium text-violet-800">HR Pulse</span>
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
                            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsEntryOpen(true); }}
                                title="View Data Details"
                                className="absolute top-4 right-4 p-1.5 rounded-full bg-zinc-50 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all z-20 opacity-0 group-hover:opacity-100"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-sm font-medium text-zinc-500">Total Employees</p>
                                        <h3 className="text-2xl font-bold text-zinc-900 mt-1">{latest.totalEmployees || 0}</h3>
                                    </div>
                                    <div className="p-2 bg-purple-50 rounded-xl">
                                        <Users className="w-5 h-5 text-purple-600" />
                                    </div>
                                </div>
                                <div className="flex items-center text-xs text-emerald-600 font-medium bg-emerald-50 w-fit px-2 py-1 rounded-full">
                                    <TrendingUp className="w-3 h-3 mr-1" />
                                    {latest.netChange || 0} Net change
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
                                        <p className="text-sm font-medium text-zinc-500">Open Positions</p>
                                        <h3 className="text-2xl font-bold text-zinc-900 mt-1">{latest.openPositions || 0}</h3>
                                    </div>
                                    <div className="p-2 bg-blue-50 rounded-xl">
                                        <Briefcase className="w-5 h-5 text-blue-600" />
                                    </div>
                                </div>
                                <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${latest.openPositions ? Math.min(((latest.filledPositions || 0) / (latest.openPositions + (latest.filledPositions || 0))) * 100, 100) : 0}%` }} />
                                </div>
                                <div className="mt-2 text-[10px] text-zinc-400">{latest.filledPositions || 0} Filled recently</div>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
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
                                        <p className="text-sm font-medium text-zinc-500">Attrition Rate</p>
                                        <h3 className="text-2xl font-bold text-zinc-900 mt-1">{latest.attritionRate || 0}%</h3>
                                    </div>
                                    <div className="p-2 bg-orange-50 rounded-xl">
                                        <TrendingDown className="w-5 h-5 text-orange-600" />
                                    </div>
                                </div>
                                <div className="flex items-center text-xs text-emerald-600 font-medium bg-emerald-50 w-fit px-2 py-1 rounded-full">
                                    -0.5% vs Industry Avg
                                </div>
                            </div>
                        </div>
                    </div>



                    {/* Workforce Insights Row (eNPS, ROI, Time to Fill) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                        <p className="text-sm font-medium text-zinc-500">eNPS Score</p>
                                        <h3 className="text-2xl font-bold text-zinc-900 mt-1">{latest.enps || 0}</h3>
                                    </div>
                                    <div className="p-2 bg-rose-50 rounded-xl">
                                        <Heart className="w-5 h-5 text-rose-600" />
                                    </div>
                                </div>
                                <div className="text-xs text-zinc-400">Employee Engagement</div>
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
                                        <p className="text-sm font-medium text-zinc-500">Training ROI</p>
                                        <h3 className="text-2xl font-bold text-zinc-900 mt-1">{latest.trainingRoi || 0}x</h3>
                                    </div>
                                    <div className="p-2 bg-emerald-50 rounded-xl">
                                        <GraduationCap className="w-5 h-5 text-emerald-600" />
                                    </div>
                                </div>
                                <div className="text-xs text-zinc-400">Return on Investment</div>
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
                                        <p className="text-sm font-medium text-zinc-500">Time to Fill</p>
                                        <h3 className="text-2xl font-bold text-zinc-900 mt-1">{latest.timeToFill || 0} Days</h3>
                                    </div>
                                    <div className="p-2 bg-blue-50 rounded-xl">
                                        <Clock className="w-5 h-5 text-blue-600" />
                                    </div>
                                </div>
                                <div className="text-xs text-zinc-400">Target: &lt; 30 Days</div>
                            </div>
                        </div>
                    </div>

                    {/* Chart Grid */}
                    <div className="grid grid-cols-12 gap-6 h-[400px]">
                        {/* Large Chart: Recruitment Pipeline */}
                        <div className="col-span-12 md:col-span-8 bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm relative overflow-hidden group">
                            <h3 className="font-bold text-zinc-900 mb-6 flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-zinc-400" />
                                Recruitment Funnel
                            </h3>
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsEntryOpen(true); }}
                                title="View Chart Data"
                                className="absolute top-6 right-6 p-1.5 rounded-full bg-emerald-50 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 transition-all z-20 opacity-0 group-hover:opacity-100 animate-pulse"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            <div className="space-y-4 pt-4">
                                {pipelineData.map((item) => (
                                    <div key={item.stage} className="flex items-center group">
                                        <div className="w-24 text-sm font-medium text-zinc-500 group-hover:text-zinc-900 transition-colors">{item.stage}</div>
                                        <div className="flex-1 h-8 bg-zinc-50 rounded-r-full overflow-hidden flex items-center relative">
                                            <div className="absolute inset-y-0 left-0 bg-zinc-100 w-full rounded-r-full" />
                                            <div className={`h-full ${item.color} rounded-r-full transition-all duration-1000 relative z-10 hover:brightness-95 cursor-pointer`} style={{ width: `${(item.count / maxCount) * 100}%` }} />
                                            <span className="ml-3 text-sm font-bold text-zinc-900 relative z-20 pl-2">{item.count}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Smaller Box: Onboarding Status */}
                        <div className="col-span-12 md:col-span-4 bg-zinc-900 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between group">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
                            <div>
                                <h3 className="font-bold text-white mb-2 z-10 relative">Onboarding</h3>
                                <p className="text-zinc-400 text-xs relative z-10">New Hires Progress</p>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsEntryOpen(true); }}
                                title="View Details"
                                className="absolute top-6 right-6 p-1.5 rounded-full bg-white/10 text-zinc-400 hover:text-white hover:bg-white/20 transition-all z-20 opacity-0 group-hover:opacity-100"
                            >
                                <Eye className="w-4 h-4" />
                            </button>

                            <div className="relative z-10 mt-4 flex-1 flex flex-col justify-center">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-emerald-500/20 rounded-full">
                                        <UserPlus className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    <div className="text-right">
                                        <div className="text-3xl font-bold text-white">{latest.recruitedHired || 0}</div>
                                        <div className="text-[10px] text-zinc-400 uppercase tracking-wider">New Joinees</div>
                                    </div>
                                </div>

                                <div className="space-y-3 mt-4">
                                    <div className="flex justify-between text-xs p-2 bg-white/5 rounded-lg border border-white/10">
                                        <span className="text-zinc-400">IT Setup</span>
                                        <span className="text-emerald-400 font-medium">Done</span>
                                    </div>
                                    <div className="flex justify-between text-xs p-2 bg-white/5 rounded-lg border border-white/10">
                                        <span className="text-zinc-400">Access</span>
                                        <span className="text-amber-400 font-medium">Pending</span>
                                    </div>
                                    <div className="flex justify-between text-xs p-2 bg-white/5 rounded-lg border border-white/10">
                                        <span className="text-zinc-400">Orientation</span>
                                        <span className="text-blue-400 font-medium">Fri 10am</span>
                                    </div>
                                </div>
                            </div>

                            <Button variant="outline" size="sm" className="w-full mt-6 bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10">
                                Manage Hires
                            </Button>
                        </div>
                    </div>

                </div>

                {/* Right Column: Live Feed - Spans 3 cols */}
                <div className="col-span-12 lg:col-span-3 h-full min-h-[500px]">
                    <div className="h-full w-full bg-white rounded-3xl p-6 flex flex-col border border-zinc-200 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-zinc-900">Employee Pulse</h3>
                            <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                        </div>

                        <div className="flex-1 space-y-4 overflow-hidden relative">
                            {/* Mock Feed Items */}
                            {employeePulse.map((item, i) => (
                                <div key={i} className="flex gap-3 items-start p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                                    <div className={`w-1.5 h-1.5 mt-2 rounded-full shrink-0 ${item.type === 'success' ? 'bg-emerald-500' : item.type === 'warning' ? 'bg-amber-500' : 'bg-violet-500'}`} />
                                    <div>
                                        <h4 className="text-sm font-semibold text-zinc-900">{item.title}</h4>
                                        <p className="text-xs text-zinc-500">{item.desc}</p>
                                        <span className="text-[10px] text-zinc-400 mt-1 block">{item.time}</span>
                                    </div>
                                </div>
                            ))}

                            <div className="p-4 bg-violet-50 rounded-2xl mt-8 border border-violet-100">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-sm font-bold text-violet-900">Upcoming</h4>
                                    <span className="text-xs font-medium text-violet-700 bg-violet-200 px-2 py-0.5 rounded-full">Event</span>
                                </div>
                                <div className="text-xl font-bold text-violet-800">Q3 Townhall</div>
                                <p className="text-xs text-violet-600 mt-1">Friday, 2:00 PM</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <SmartEntrySheet
                isOpen={isEntryOpen}
                onClose={() => { setIsEntryOpen(false); fetchData(); }}
                category="hr"
            />
        </div >
    )
}
