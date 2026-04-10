"use client"

import { useState, useEffect } from "react"
import { PremiumCard } from "@/components/design/PremiumCard"
import { useHeader } from "@/components/providers/HeaderProvider"
import { useFilter } from "@/components/providers/FilterProvider"
import {
    Users, Briefcase, Plus, Eye, TrendingUp, CheckCircle2, MoreHorizontal,
    ArrowUpRight, ArrowDownRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, PieChart, Pie, Legend, LineChart, Line
} from 'recharts'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SmartEntrySheet } from "@/components/data-entry/SmartEntrySheet"
import { KpiInsightModal } from "@/components/modals/KpiInsightModal"
import { cn } from "@/lib/utils"

export default function HrPage() {
    const { setHeaderInfo } = useHeader()
    const { period: globalPeriod, selectedCompanyIds } = useFilter()

    useEffect(() => {
        setHeaderInfo("Human Resources", "Monitor organization strength, hiring pipelines, and employee satisfaction.")
    }, [setHeaderInfo])

    const [isEntryOpen, setIsEntryOpen] = useState(false)
    const [metrics, setMetrics] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [localPeriod, setLocalPeriod] = useState("Weekly")

    const [positionsModalOpen, setPositionsModalOpen] = useState(false)
    const [insightModalOpen, setInsightModalOpen] = useState(false)
    const [insightData, setInsightData] = useState<{ title: string, metricKey: string, formulaDesc: string, formatType: "number" | "currency" | "percent" } | null>(null)

    const fetchData = async () => {
        setLoading(true)
        try {
            const companyQuery = selectedCompanyIds.length > 0 ? `&companies=${selectedCompanyIds.join(',')}` : ''
            const res = await fetch(`/api/metrics?category=hr&period=${localPeriod}${companyQuery}`)
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

    const strengthDiff = getDiff(latest.orgStrength || 0, latest.prevOrgStrength || 0)

    // Open Positions Pie Data
    const positionsData = [
        { name: "On Track", value: latest.openPosOnTrack || 0, color: "#10b981" },
        { name: "Lagging", value: latest.openPosLagging || 0, color: "#f43f5e" }
    ]

    const totalPositions = (latest.openPosOnTrack || 0) + (latest.openPosLagging || 0)

    // Org strength trend
    const trendData = metrics.map((m: any) => ({
        name: new Date(m.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
        strength: m.orgStrength || 0
    })).reverse()

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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Org Strength */}
                        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-sm font-medium text-zinc-500">Org Strength</p>
                                        <h3 className="text-2xl font-bold text-zinc-900 mt-1">{latest.orgStrength || 0}</h3>
                                    </div>
                                    <div className="flex flex-col gap-2 relative z-20">
                                        <button onClick={() => { setInsightData({ title: "Org Strength", metricKey: "orgStrength", formulaDesc: "Total headcount of active employees maintained across selected companies during the specified period.", formatType: "number" }); setInsightModalOpen(true); }} className="ml-auto p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-emerald-600 transition-all z-20">
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <div className="p-2 bg-emerald-50 rounded-xl">
                                            <Users className="w-5 h-5 text-emerald-600" />
                                        </div>
                                    </div>
                                </div>
                                <div className={`flex items-center text-[10px] font-semibold w-fit px-2 py-0.5 rounded-full ${strengthDiff > 0 ? 'text-emerald-600 bg-emerald-50' : strengthDiff < 0 ? 'text-rose-600 bg-rose-50' : 'text-zinc-600 bg-zinc-50'}`}>
                                    {strengthDiff > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : strengthDiff < 0 ? <ArrowDownRight className="w-3 h-3 mr-1" /> : null}
                                    {Math.abs(strengthDiff).toFixed(1)}% vs prev {periodText}
                                </div>
                            </div>
                        </div>

                        {/* Open Positions Deep Dive Trigger */}
                        <div
                            className="bg-zinc-900 rounded-3xl p-6 shadow-xl relative overflow-hidden cursor-pointer group transition-all hover:scale-[1.01]"
                            onClick={() => setPositionsModalOpen(true)}
                        >
                            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
                            <button
                                title="Deep Dive"
                                className="absolute top-6 right-6 p-1.5 rounded-full bg-white/10 text-zinc-400 group-hover:text-blue-400 group-hover:bg-blue-400/20 transition-all z-20"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-bold text-white text-lg">Open Positions</h3>
                                    <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-semibold uppercase">Deep Dive</span>
                                </div>
                                <div className="flex items-baseline gap-2 mb-4">
                                    <span className="text-3xl font-bold text-white">{totalPositions}</span>
                                    <span className="text-zinc-400 text-sm">Active roles</span>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                        <span className="text-sm font-semibold text-emerald-300">{latest.openPosOnTrack || 0} On Track</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20">
                                        <div className="w-2 h-2 rounded-full bg-rose-400" />
                                        <span className="text-sm font-semibold text-rose-300">{latest.openPosLagging || 0} Lagging</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chart Section */}
                    <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm relative overflow-hidden h-[300px]">
                        <h3 className="font-bold text-zinc-900 mb-6 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-zinc-400" />
                            Org Strength Trend
                        </h3>
                        {trendData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="80%">
                                <LineChart data={trendData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ fontSize: '12px' }}
                                    />
                                    <Line type="monotone" dataKey="strength" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="Total Employees" />
                                </LineChart>
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
                            <h3 className="font-bold text-zinc-900">Active Hiring</h3>
                        </div>
                        <div className="flex-1 space-y-4 overflow-hidden relative flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center mb-2 border border-zinc-100">
                                <Users className="w-6 h-6 text-zinc-300" />
                            </div>
                            <h4 className="text-sm font-bold text-zinc-700">No Data Linkage</h4>
                            <p className="text-xs text-zinc-500 px-4">
                                Granular candidate role tracking is currently not mapped in the backend schema.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Open Positions Modal */}
            <Dialog open={positionsModalOpen} onOpenChange={setPositionsModalOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            Open Positions <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full uppercase tracking-wider">Deep Dive</span>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-6 flex flex-col items-center">
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={positionsData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {positionsData.map((entry, index) => (
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
                            {positionsData.map((d, i) => (
                                <div key={i} className="flex justify-between items-center bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                                        <span className="font-semibold text-zinc-700">{d.name} Role Fulfillment</span>
                                    </div>
                                    <span className={`font-bold text-lg ${d.name === 'Lagging' ? 'text-rose-600' : 'text-emerald-600'}`}>{d.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Org Strength Modal Replaced by Unified Modal */}

            <SmartEntrySheet
                isOpen={isEntryOpen}
                onClose={() => { setIsEntryOpen(false); fetchData(); }}
                category="hr"
            />
            
            <KpiInsightModal
                open={insightModalOpen}
                onOpenChange={setInsightModalOpen}
                title={insightData?.title || null}
                metricKey={insightData?.metricKey || null}
                category="hr"
                formulaDesc={insightData?.formulaDesc || null}
                formatType={insightData?.formatType}
            />
        </div>
    )
}
