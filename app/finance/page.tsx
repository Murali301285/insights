"use client"

import { useState, useEffect } from "react"
import { useHeader } from "@/components/providers/HeaderProvider"
import { useFilter } from "@/components/providers/FilterProvider"
import { useUser } from "@/components/providers/UserProvider"
import { formatCurrency } from "@/lib/utils"
import { Eye, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, DollarSign, Calendar, Plus, Wallet } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell, CartesianAxis } from 'recharts'
import { SmartEntrySheet } from "@/components/data-entry/SmartEntrySheet"
import { KpiInsightModal } from "@/components/modals/KpiInsightModal"

export default function FinancePage() {
    const { setHeaderInfo } = useHeader()
    const { period, setPeriod, currency, selectedCompanyIds } = useFilter()
    const user = useUser()

    useEffect(() => {
        setHeaderInfo("Finance & Accounting", "Cash flow monitoring and AP/AR aging analysis.")
    }, [setHeaderInfo])

    const [isEntryOpen, setIsEntryOpen] = useState(false)
    const [metrics, setMetrics] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Deep Dive State
    const [arModalOpen, setArModalOpen] = useState(false)
    const [apModalOpen, setApModalOpen] = useState(false)
    const [insightModalOpen, setInsightModalOpen] = useState(false)
    const [insightData, setInsightData] = useState<{ title: string, metricKey: string, formulaDesc: string } | null>(null)

    const fetchData = async () => {
        setLoading(true)
        try {
            let url = `/api/metrics?category=finance&period=${period}`
            
            if (selectedCompanyIds && selectedCompanyIds.length > 0) {
                if (selectedCompanyIds.length === 1) {
                    url += `&companyId=${selectedCompanyIds[0]}`
                } else {
                    url += `&companies=${selectedCompanyIds.join(',')}`
                }
            }

            const res = await fetch(url)
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
    }, [period, selectedCompanyIds])

    const latest = metrics[0] || {}

    // Diff vs Previous Week logic
    const getDiff = (curr: number, prev: number) => {
        if (!prev || prev === 0) return 0
        return ((curr - prev) / prev) * 100
    }

    const inflowDiff = getDiff(latest.inflow, latest.prevInflow)
    const outflowDiff = getDiff(latest.outflow, latest.prevOutflow)
    const balanceDiff = getDiff(latest.cashBalance, latest.prevCashBalance)

    const getPeriodText = () => {
        if (period === "Weekly") return "week"
        if (period === "Monthly") return "month"
        if (period === "Quarterly") return "quarter"
        if (period === "Annual") return "year"
        return "week"
    }
    const periodText = getPeriodText()

    const formatDate = (dateInput: any) => {
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return "";
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    };

    // Chart Data
    const chartData = metrics.map((m: any) => ({
        name: formatDate(m.date),
        inflow: m.inflow,
        outflow: m.outflow
    })).reverse() // Left-to-right

    const arChartData = [
        { name: "Current", value: latest.arCurrent || 0 },
        { name: "0-30 Days", value: latest.ar0to30 || 0 },
        { name: "30-60 Days", value: latest.ar30to60 || 0 },
        { name: "60-90+ Days", value: latest.ar60to90plus || 0 }
    ]

    const apChartData = [
        { name: "Current", value: latest.apCurrent || 0 },
        { name: "0-30 Days", value: latest.ap0to30 || 0 },
        { name: "30-60 Days", value: latest.ap30to60 || 0 },
        { name: "60-90+ Days", value: latest.ap60to90plus || 0 }
    ]

    const transactions: any[] = []
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Actions Bar */}
            <div className="flex justify-end items-center gap-4 mb-2">
                <div className="flex items-center bg-white p-1 rounded-xl border border-zinc-200 shadow-sm">
                    {["Weekly", "Monthly", "Quarterly", "Annual"].map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${period === p
                                ? "bg-zinc-900 text-white shadow-sm"
                                : "text-zinc-500 hover:text-zinc-900"
                                }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
                {user?.userType !== 'Group' && (
                    <Button onClick={() => setIsEntryOpen(true)} size="sm" className="gap-2 bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg hover:shadow-xl transition-all">
                        <Plus className="w-4 h-4" />
                        Entry
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-12 gap-6 h-auto">
                {/* Left Column: Metrics & Charts */}
                <div className="col-span-12 lg:col-span-9 space-y-6">

                    {/* KPI Bento Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Cash Inflow */}
                        <div className="bg-emerald-50/40 rounded-3xl p-6 border border-emerald-100/50 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100/50 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-sm font-medium text-emerald-800/70">Cash Inflow</p>
                                        <h3 className="text-2xl font-bold text-zinc-900 mt-1">{formatCurrency(latest.inflow || 0, currency)}</h3>
                                    </div>
                                    <div className="flex flex-col gap-2 items-end">
                                        <button onClick={() => { setInsightData({ title: "Cash Inflow", metricKey: "inflow", formulaDesc: "Aggregated sum of all cash receipts (revenue, loans, or investments) received by the selected companies during the specified period." }); setInsightModalOpen(true); }} className="p-1.5 rounded-full hover:bg-emerald-100 text-zinc-400 hover:text-emerald-600 transition-all z-20">
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-emerald-100 shadow-sm mt-1">
                                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-auto pt-2">
                                     <span className={`inline-block px-2 py-0.5 rounded-full bg-white border shadow-sm text-[10px] font-semibold flex items-center w-fit ${inflowDiff >= 0 ? 'text-emerald-600 border-emerald-100/50' : 'text-rose-600 border-rose-100/50'}`}>
                                        {inflowDiff > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : inflowDiff < 0 ? <ArrowDownRight className="w-3 h-3 mr-1" /> : null}
                                        {Math.abs(inflowDiff).toFixed(1)}% vs prev {periodText}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Cash Outflow */}
                        <div className="bg-rose-50/40 rounded-3xl p-6 border border-rose-100/50 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-100/50 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-sm font-medium text-rose-800/70">Cash Outflow</p>
                                        <h3 className="text-2xl font-bold text-zinc-900 mt-1">{formatCurrency(latest.outflow || 0, currency)}</h3>
                                    </div>
                                    <div className="flex flex-col gap-2 items-end">
                                        <button onClick={() => { setInsightData({ title: "Cash Outflow", metricKey: "outflow", formulaDesc: "Total sum of all cash disbursements (expenses, supplier payments, tax) processed by the selected companies during the specified period." }); setInsightModalOpen(true); }} className="p-1.5 rounded-full hover:bg-rose-100 text-zinc-400 hover:text-rose-600 transition-all z-20">
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-rose-100 shadow-sm mt-1">
                                            <TrendingDown className="w-4 h-4 text-rose-600" />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-auto pt-2">
                                     <span className={`inline-block px-2 py-0.5 rounded-full bg-white border shadow-sm text-[10px] font-semibold flex items-center w-fit ${outflowDiff <= 0 ? 'text-emerald-600 border-emerald-100/50' : 'text-rose-600 border-rose-100/50'}`}>
                                        {outflowDiff < 0 ? <ArrowDownRight className="w-3 h-3 mr-1" /> : outflowDiff > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : null}
                                        {Math.abs(outflowDiff).toFixed(1)}% vs prev {periodText}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Cash Balance */}
                        <div className="bg-blue-50/40 rounded-3xl p-6 border border-blue-100/50 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100/50 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-sm font-medium text-blue-800/70">Cash Balance</p>
                                        <h3 className="text-2xl font-bold text-zinc-900 mt-1">{formatCurrency(latest.cashBalance || 0, currency)}</h3>
                                    </div>
                                    <div className="flex flex-col gap-2 items-end">
                                        <button onClick={() => { setInsightData({ title: "Cash Balance", metricKey: "cashBalance", formulaDesc: "The net cash position strictly recorded by the SmartEntry inputs for the selected companies across the defined period." }); setInsightModalOpen(true); }} className="p-1.5 rounded-full hover:bg-blue-100 text-zinc-400 hover:text-blue-600 transition-all z-20">
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-blue-100 shadow-sm mt-1">
                                            <Wallet className="w-4 h-4 text-blue-600" />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-auto pt-2">
                                     <span className={`inline-block px-2 py-0.5 rounded-full bg-white border shadow-sm text-[10px] font-semibold flex items-center w-fit ${balanceDiff >= 0 ? 'text-blue-600 border-blue-100/50' : 'text-rose-600 border-rose-100/50'}`}>
                                        {balanceDiff > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : balanceDiff < 0 ? <ArrowDownRight className="w-3 h-3 mr-1" /> : null}
                                        {Math.abs(balanceDiff).toFixed(1)}% vs prev {periodText}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* AR / AP Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Accounts Receivable */}
                        <div
                            className="bg-zinc-900 rounded-3xl p-6 shadow-xl relative overflow-hidden cursor-pointer group transition-all hover:scale-[1.01]"
                            onClick={() => setArModalOpen(true)}
                        >
                            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
                            <button
                                title="View Details"
                                className="absolute top-6 right-6 p-1.5 rounded-full bg-white/10 text-zinc-400 group-hover:text-emerald-400 group-hover:bg-emerald-400/20 transition-all z-20"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-bold text-white text-lg">Accounts Receivable</h3>
                                </div>
                                <p className="text-zinc-400 text-sm mb-4">Total Outstanding: <span className="text-emerald-400 font-bold">{formatCurrency(latest.arTotal || 0, currency)}</span></p>
                                <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                                    <h4 className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-2">Aging Summary</h4>
                                    <div className="h-40 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={[
                                                { name: "Total", value: latest.arTotal ?? 0, fill: "#3f3f46" },
                                                { name: "Current", value: latest.arCurrent ?? 0, fill: "#10b981" },
                                                { name: "PD 0-30", value: latest.ar0to30 ?? 0, fill: "#f59e0b" },
                                                { name: "PD 30-60", value: latest.ar30to60 ?? 0, fill: "#f97316" },
                                                { name: "PD 60-90+", value: latest.ar60to90plus ?? 0, fill: "#ef4444" }
                                            ]} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#27272a" />
                                                <XAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                                                <YAxis type="number" tickLine={false} axisLine={false} tick={{ fill: '#a1a1aa', fontSize: 10 }} tickFormatter={(val: any) => `₹${(val / 1000).toFixed(0)}k`} />
                                                <Tooltip
                                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }}
                                                    itemStyle={{ color: '#fff' }}
                                                    formatter={(val: any) => formatCurrency(val, currency)}
                                                />
                                                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={32}>
                                                    {[...Array(5)].map((_, index) => (
                                                        <Cell key={`cell-${index}`} fill={
                                                            index === 0 ? "#3f3f46" :
                                                                index === 1 ? "#10b981" :
                                                                    index === 2 ? "#f59e0b" :
                                                                        index === 3 ? "#f97316" :
                                                                            "#ef4444"
                                                        } />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Accounts Payable */}
                        <div
                            className="bg-zinc-900 rounded-3xl p-6 shadow-xl relative overflow-hidden cursor-pointer group transition-all hover:scale-[1.01]"
                            onClick={() => setApModalOpen(true)}
                        >
                            <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
                            <button
                                title="View Details"
                                className="absolute top-6 right-6 p-1.5 rounded-full bg-white/10 text-zinc-400 group-hover:text-rose-400 group-hover:bg-rose-400/20 transition-all z-20"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-bold text-white text-lg">Accounts Payable</h3>
                                </div>
                                <p className="text-zinc-400 text-sm mb-4">Total Outstanding: <span className="text-rose-400 font-bold">{formatCurrency(latest.apTotal || 0, currency)}</span></p>
                                <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                                    <h4 className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-2">Aging Summary</h4>
                                    <div className="h-40 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={[
                                                { name: "Total", value: latest.apTotal ?? 0, fill: "#3f3f46" },
                                                { name: "Current", value: latest.apCurrent ?? 0, fill: "#10b981" },
                                                { name: "PD 0-30", value: latest.ap0to30 ?? 0, fill: "#f59e0b" },
                                                { name: "PD 30-60", value: latest.ap30to60 ?? 0, fill: "#f97316" },
                                                { name: "PD 60-90+", value: latest.ap60to90plus ?? 0, fill: "#ef4444" }
                                            ]} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#27272a" />
                                                <XAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                                                <YAxis type="number" tickLine={false} axisLine={false} tick={{ fill: '#a1a1aa', fontSize: 10 }} tickFormatter={(val: any) => `₹${(val / 1000).toFixed(0)}k`} />
                                                <Tooltip
                                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }}
                                                    itemStyle={{ color: '#fff' }}
                                                    formatter={(val: any) => formatCurrency(val, currency)}
                                                />
                                                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={32}>
                                                    {[...Array(5)].map((_, index) => (
                                                        <Cell key={`cell-${index}`} fill={
                                                            index === 0 ? "#3f3f46" :
                                                                index === 1 ? "#10b981" :
                                                                    index === 2 ? "#f59e0b" :
                                                                        index === 3 ? "#f97316" :
                                                                            "#ef4444"
                                                        } />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Fund Metrics Area */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Total Fund */}
                        <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm relative overflow-hidden transition-all hover:shadow-md group cursor-pointer" onClick={() => {
                                setInsightData({ title: "Total Fund", metricKey: "totalFund", formulaDesc: "View the historical aggregates of the Total Fund derived from the system." });
                                setInsightModalOpen(true);
                            }}>
                            <button
                                title="View Details"
                                className="absolute top-5 right-5 p-1.5 rounded-full bg-zinc-100 text-zinc-400 group-hover:text-emerald-600 transition-all z-20 opacity-0 group-hover:opacity-100"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            <div className="flex items-center justify-between mb-4 mt-1">
                                <h3 className="font-bold text-zinc-500 text-sm uppercase tracking-wider">Total Fund</h3>
                                <div className="p-2 bg-emerald-50 rounded-full mr-8">
                                    <DollarSign className="w-4 h-4 text-emerald-600" />
                                </div>
                            </div>
                            <div className="text-3xl font-black text-zinc-900 mt-2">
                                {formatCurrency(latest.totalFund || 0, currency)}
                            </div>
                        </div>

                        {/* Utilised Fund */}
                        <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm relative overflow-hidden transition-all hover:shadow-md group cursor-pointer" onClick={() => {
                                setInsightData({ title: "Utilised Fund", metricKey: "totalUtilised", formulaDesc: "View the historical aggregates of the Utilised Fund derived from the system." });
                                setInsightModalOpen(true);
                            }}>
                            <button
                                title="View Details"
                                className="absolute top-5 right-5 p-1.5 rounded-full bg-zinc-100 text-zinc-400 group-hover:text-rose-600 transition-all z-20 opacity-0 group-hover:opacity-100"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            <div className="flex items-center justify-between mb-4 mt-1">
                                <h3 className="font-bold text-zinc-500 text-sm uppercase tracking-wider">Utilised</h3>
                                <div className="p-2 bg-rose-50 rounded-full mr-8">
                                    <TrendingUp className="w-4 h-4 text-rose-600" />
                                </div>
                            </div>
                            <div className="text-3xl font-black text-zinc-900 mt-2">
                                {formatCurrency(latest.totalUtilised || 0, currency)}
                            </div>
                            <div className="mt-4 flex items-center">
                                <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-100 uppercase tracking-widest">
                                    {latest.totalFund ? ((latest.totalUtilised / latest.totalFund) * 100).toFixed(1) + "% Used" : "0.0% Used"}
                                </span>
                            </div>
                        </div>

                        {/* Available Fund */}
                        <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm relative overflow-hidden transition-all hover:shadow-md group cursor-pointer" onClick={() => {
                                setInsightData({ title: "Available Fund", metricKey: "totalAvailable", formulaDesc: "View the historical aggregates of the Available Fund derived from the system." });
                                setInsightModalOpen(true);
                            }}>
                            <button
                                title="View Details"
                                className="absolute top-5 right-5 p-1.5 rounded-full bg-zinc-100 text-zinc-400 group-hover:text-blue-600 transition-all z-20 opacity-0 group-hover:opacity-100"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            <div className="flex items-center justify-between mb-4 mt-1">
                                <h3 className="font-bold text-zinc-500 text-sm uppercase tracking-wider">Available Fund</h3>
                                <div className="p-2 bg-blue-50 rounded-full mr-8">
                                    <Wallet className="w-4 h-4 text-blue-600" />
                                </div>
                            </div>
                            <div className="text-3xl font-black text-zinc-900 mt-2">
                                {formatCurrency(latest.totalAvailable || 0, currency)}
                            </div>
                            <div className="mt-4 flex items-center">
                                <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100 uppercase tracking-widest">
                                    {latest.totalFund ? ((latest.totalAvailable / latest.totalFund) * 100).toFixed(1) + "% Free" : "100.0% Free"}
                                </span>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Right Column: Live Feed */}
                <div className="col-span-12 lg:col-span-3 h-full min-h-[500px]">
                    <div className="h-full w-full bg-white rounded-3xl p-6 flex flex-col border border-zinc-200 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-bold text-emerald-900 bg-emerald-100 px-3 py-1 -ml-2 leading-none">Transactions</h3>
                            <button
                                title="View All Transactions"
                                onClick={() => {
                                    setInsightData({ title: "Transaction Flow", metricKey: "inflow", formulaDesc: "View the exact transactional inflow aggregates derived from the system." });
                                    setInsightModalOpen(true);
                                }}
                                className="p-2 rounded-full bg-white border border-zinc-200 text-zinc-400 hover:text-zinc-600 transition-colors shadow-sm"
                            >
                                <Eye className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 space-y-5 overflow-hidden relative">
                            {transactions.map((item, i) => (
                                <div
                                    key={i}
                                    className="flex gap-4 items-center p-5 rounded-[1.25rem] bg-zinc-50 border border-zinc-100 transition-colors group shadow-sm"
                                >
                                    <div className={`w-12 h-12 rounded-full shrink-0 flex items-center justify-center ${item.type === 'inflow' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                        {item.type === 'inflow' ? <ArrowUpRight className="w-5 h-5 stroke-[2.5]" /> : <ArrowDownRight className="w-5 h-5 stroke-[2.5]" />}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-base font-bold text-zinc-900 leading-tight">{item.title}</h4>
                                        <p className="text-[13px] text-zinc-500 mt-1">{item.desc}</p>
                                        <span className="text-[11px] text-zinc-400 mt-1 block">{item.time}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* AR Deep Dive Modal */}
            <Dialog open={arModalOpen} onOpenChange={setArModalOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            Accounts Receivable
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-2">
                        {/* Table */}
                        <div className="mt-8 border border-zinc-200 rounded-xl overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-zinc-50 border-b border-zinc-200">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold text-zinc-500 w-16">Sl No</th>
                                        <th className="px-4 py-3 font-semibold text-zinc-500">Recorded Date</th>
                                        <th className="px-4 py-3 font-semibold text-zinc-500 text-right">Aggregated Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {metrics.map((row, i) => (
                                        <tr key={i} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50 transition-colors">
                                            <td className="px-4 py-3 text-zinc-500">{i + 1}</td>
                                            <td className="px-4 py-3 font-medium text-zinc-700">{formatDate(row.date)}</td>
                                            <td className="px-4 py-3 text-zinc-900 font-bold text-right">{formatCurrency(row.arTotal || 0, currency)}</td>
                                        </tr>
                                    ))}
                                    {metrics.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-4 py-12 text-center text-zinc-500 font-medium bg-zinc-50/30">
                                                No recorded entries found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* AP Deep Dive Modal */}
            <Dialog open={apModalOpen} onOpenChange={setApModalOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            Accounts Payable
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-2">
                        {/* Table */}
                        <div className="mt-8 border border-zinc-200 rounded-xl overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-zinc-50 border-b border-zinc-200">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold text-zinc-500 w-16">Sl No</th>
                                        <th className="px-4 py-3 font-semibold text-zinc-500">Recorded Date</th>
                                        <th className="px-4 py-3 font-semibold text-zinc-500 text-right">Aggregated Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {metrics.map((row, i) => (
                                        <tr key={i} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50 transition-colors">
                                            <td className="px-4 py-3 text-zinc-500">{i + 1}</td>
                                            <td className="px-4 py-3 font-medium text-zinc-700">{formatDate(row.date)}</td>
                                            <td className="px-4 py-3 text-zinc-900 font-bold text-right">{formatCurrency(row.apTotal || 0, currency)}</td>
                                        </tr>
                                    ))}
                                    {metrics.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-4 py-12 text-center text-zinc-500 font-medium bg-zinc-50/30">
                                                No recorded entries found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <SmartEntrySheet
                isOpen={isEntryOpen}
                onClose={() => { setIsEntryOpen(false); fetchData(); }}
                category="finance"
            />

            <KpiInsightModal
                open={insightModalOpen}
                onOpenChange={setInsightModalOpen}
                title={insightData?.title || null}
                metricKey={insightData?.metricKey || null}
                category="finance"
                formulaDesc={insightData?.formulaDesc || null}
                formatType="currency"
            />
        </div>
    )
}
