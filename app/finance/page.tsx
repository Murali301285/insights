"use client"

import { useState, useEffect } from "react"
import { PremiumCard } from "@/components/design/PremiumCard"
import {
    PieChart,
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    ArrowDownRight,
    DollarSign,
    Calendar,
    Eye
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useHeader } from "@/components/providers/HeaderProvider"

// Mock Data
const cashFlowData = [
    { name: 'Mon', inflow: 4000, outflow: 2400 },
    { name: 'Tue', inflow: 3000, outflow: 1398 },
    { name: 'Wed', inflow: 2000, outflow: 9800 },
    { name: 'Thu', inflow: 2780, outflow: 3908 },
    { name: 'Fri', inflow: 1890, outflow: 4800 },
    { name: 'Sat', inflow: 2390, outflow: 3800 },
    { name: 'Sun', inflow: 3490, outflow: 4300 },
]

const arData = [
    { client: "Acme Corp", total: 12500, current: 8000, overdue: 4500, bucket: "30-60 Days" },
    { client: "Globex Inc", total: 4200, current: 4200, overdue: 0, bucket: "Current" },
    { client: "Soylent Corp", total: 15000, current: 0, overdue: 15000, bucket: "90+ Days" },
]

// ... Re-implementing full component to ensure hooks are correct
/*
    Actual implementation note:
    I need to rewrite the component to use useEffect properly and map the real data to the cards.
    Since the file is large, I will output the whole component content.
*/
import { SmartEntrySheet } from "@/components/data-entry/SmartEntrySheet"
import { Plus, ArrowLeftRight } from "lucide-react"

export default function FinancePage() {
    const { setHeaderInfo } = useHeader()

    useEffect(() => {
        setHeaderInfo("Finance & Accounting", "Cash flow monitoring and AP/AR aging analysis.")
    }, [setHeaderInfo])

    const [period, setPeriod] = useState("Monthly")
    const [currency, setCurrency] = useState("INR") // Default INR
    const [isEntryOpen, setIsEntryOpen] = useState(false)
    const [metrics, setMetrics] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/metrics?category=finance&period=${period}`)
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

    // Derive latest metric
    const latest = metrics[0] || {}
    const prev = metrics[1] || {}

    // Helper for percentage diff
    const getDiff = (curr: number, prev: number) => {
        if (!prev) return 0
        return ((curr - prev) / prev) * 100
    }

    // Currency Formatter
    const formatCurrency = (val: number) => {
        if (isNaN(val)) return "0"

        let amount = val
        let code = currency

        // Simple fallback conversion (Assuming data is stored in native scale, let's say base is INR for this app as user requested INR default)
        // If data is stored effectively as "Units", we just format.
        // User said: "Currency -> option to add INR , USD, Default -> INR".
        // Let's assume input is in BASE currency (INR).
        if (currency === "USD") {
            amount = val / 84 // Approx rate
        }

        return new Intl.NumberFormat(currency === "INR" ? 'en-IN' : 'en-US', {
            style: 'currency',
            currency: code,
            maximumFractionDigits: 0
        }).format(amount)
    }

    // Map metrics to chart data
    const chartData = metrics.map((m: any) => ({
        name: new Date(m.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
        inflow: m.inflow,
        outflow: m.outflow
    })).reverse() // Recharts left-to-right

    // Mock Feed for Finance
    const transactions = [
        { id: 1, title: "Invoice Paid", desc: "Acme Corp - #INV-2024", time: "Just now", type: "inflow" },
        { id: 2, title: "Server Cost", desc: "AWS Monthly Bill", time: "2h ago", type: "outflow" },
        { id: 3, title: "Tax Payment", desc: "Quarterly GST", time: "1d ago", type: "outflow" },
        { id: 4, title: "Subscription", desc: "New User License", time: "2d ago", type: "inflow" },
    ]

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Actions Bar */}
            <div className="flex justify-end items-center gap-4 mb-2">

                <div className="flex items-center gap-3">
                    <div className="flex items-center px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse mr-2" />
                        <span className="text-sm font-medium text-emerald-800">Books Open</span>
                    </div>

                    {/* Currency Toggle */}
                    <div className="flex items-center bg-white p-1 rounded-lg border border-zinc-200 shadow-sm ml-2">
                        <button
                            onClick={() => setCurrency("INR")}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${currency === "INR" ? "bg-emerald-100 text-emerald-800" : "text-zinc-500 hover:text-zinc-900"}`}
                        >
                            ₹
                        </button>
                        <button
                            onClick={() => setCurrency("USD")}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${currency === "USD" ? "bg-blue-100 text-blue-800" : "text-zinc-500 hover:text-zinc-900"}`}
                        >
                            $
                        </button>
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
                                        <p className="text-sm font-medium text-zinc-500">Net Profit</p>
                                        <h3 className="text-2xl font-bold text-zinc-900 mt-1">{formatCurrency(latest.profit || 0)}</h3>
                                    </div>
                                    <div className="p-2 bg-emerald-50 rounded-xl">
                                        <DollarSign className="w-5 h-5 text-emerald-600" />
                                    </div>
                                </div>
                                <div className="flex items-center text-xs text-emerald-600 font-medium bg-emerald-50 w-fit px-2 py-1 rounded-full">
                                    <ArrowUpRight className="w-3 h-3 mr-1" />
                                    {getDiff(latest.profit, prev.profit).toFixed(1)}% vs last period
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
                                        <p className="text-sm font-medium text-zinc-500">Total Revenue</p>
                                        <h3 className="text-2xl font-bold text-zinc-900 mt-1">{formatCurrency(latest.revenue || 0)}</h3>
                                    </div>
                                    <div className="p-2 bg-blue-50 rounded-xl">
                                        <TrendingUp className="w-5 h-5 text-blue-600" />
                                    </div>
                                </div>
                                <div className="flex items-center text-xs text-blue-600 font-medium bg-blue-50 w-fit px-2 py-1 rounded-full">
                                    <ArrowUpRight className="w-3 h-3 mr-1" />
                                    {getDiff(latest.revenue, prev.revenue).toFixed(1)}% vs last period
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
                                        <p className="text-sm font-medium text-zinc-500">Expenses</p>
                                        <h3 className="text-2xl font-bold text-zinc-900 mt-1">{formatCurrency(latest.expenses || 0)}</h3>
                                    </div>
                                    <div className="p-2 bg-rose-50 rounded-xl">
                                        <TrendingDown className="w-5 h-5 text-rose-600" />
                                    </div>
                                </div>
                                <div className="flex items-center text-xs text-rose-600 font-medium bg-rose-50 w-fit px-2 py-1 rounded-full">
                                    <ArrowUpRight className="w-3 h-3 mr-1" />
                                    {getDiff(latest.expenses, prev.expenses).toFixed(1)}% vs last period
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Extended KPI Row (EBITDA, Cash Burn, AR) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-50 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
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
                                        <p className="text-sm font-medium text-zinc-500">EBITDA</p>
                                        <div className="flex items-baseline gap-2">
                                            <h3 className="text-2xl font-bold text-zinc-900 mt-1">{formatCurrency(latest.ebitda || 0)}</h3>
                                            <span className="text-xs font-semibold text-cyan-600 bg-cyan-50 px-1.5 py-0.5 rounded-md">{latest.ebitdaMargin || 0}% Margin</span>
                                        </div>
                                    </div>
                                    <div className="p-2 bg-cyan-50 rounded-xl">
                                        <TrendingUp className="w-5 h-5 text-cyan-600" />
                                    </div>
                                </div>
                                <div className="text-xs text-zinc-400">Operating Performance</div>
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
                                        <p className="text-sm font-medium text-zinc-500">Cash Burn</p>
                                        <h3 className="text-2xl font-bold text-zinc-900 mt-1">{formatCurrency(latest.cashBurn || 0)}</h3>
                                    </div>
                                    <div className="p-2 bg-red-50 rounded-xl">
                                        <TrendingDown className="w-5 h-5 text-red-600" />
                                    </div>
                                </div>
                                <div className="flex items-center text-xs text-red-600 font-medium bg-red-50 w-fit px-2 py-1 rounded-full">
                                    Runway: {latest.cashRunway || 0} Months
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
                                        <p className="text-sm font-medium text-zinc-500">AR Aging (90+ Days)</p>
                                        <h3 className="text-2xl font-bold text-zinc-900 mt-1">{formatCurrency(latest.arAging?.days90 || 0)}</h3>
                                    </div>
                                    <div className="p-2 bg-amber-50 rounded-xl">
                                        <Calendar className="w-5 h-5 text-amber-600" />
                                    </div>
                                </div>
                                <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-amber-500 h-full" style={{ width: '45%' }} />
                                </div>
                                <div className="mt-2 text-[10px] text-zinc-400">Total Overdue: {formatCurrency((latest.arAging?.days30 || 0) + (latest.arAging?.days60 || 0) + (latest.arAging?.days90 || 0))}</div>
                            </div>
                        </div>
                    </div>

                    {/* Chart Grid */}
                    <div className="grid grid-cols-12 gap-6 h-[400px]">
                        {/* Large Chart: Cash Flow */}
                        <div className="col-span-12 md:col-span-8 bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm relative overflow-hidden group">
                            <h3 className="font-bold text-zinc-900 mb-6 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-zinc-400" />
                                Cash Flow Trend
                            </h3>
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsEntryOpen(true); }}
                                title="View Chart Data"
                                className="absolute top-6 right-6 p-1.5 rounded-full bg-zinc-50 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all z-20 opacity-0 group-hover:opacity-100"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            <div className="h-[300px] w-full">
                                {chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorOutflow" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} />
                                                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                itemStyle={{ fontSize: '12px' }}
                                            />
                                            <Area type="monotone" dataKey="inflow" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorInflow)" name="Inflow" />
                                            <Area type="monotone" dataKey="outflow" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorOutflow)" name="Outflow" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-zinc-400">
                                        No data available. Add entry to visualize.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Smaller Box: AR/AP Focus */}
                        <div className="col-span-12 md:col-span-4 bg-zinc-900 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
                            <div>
                                <h3 className="font-bold text-white mb-2 z-10 relative">Aging Summary</h3>
                                <p className="text-zinc-400 text-xs relative z-10">Outstanding Invoices</p>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsEntryOpen(true); }}
                                title="View Details"
                                className="absolute top-6 right-6 p-1.5 rounded-full bg-white/10 text-zinc-400 hover:text-white hover:bg-white/20 transition-all z-20"
                            >
                                <Eye className="w-4 h-4" />
                            </button>

                            <div className="space-y-4 relative z-10">
                                <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/10">
                                    <div>
                                        <div className="text-zinc-400 text-xs">Current</div>
                                        <div className="text-emerald-400 font-bold">$12,450</div>
                                    </div>
                                    <div className="text-emerald-500 text-xs">Healthy</div>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/10">
                                    <div>
                                        <div className="text-zinc-400 text-xs">30-60 Days</div>
                                        <div className="text-amber-400 font-bold">$4,200</div>
                                    </div>
                                    <div className="text-amber-500 text-xs">Follow Up</div>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/10">
                                    <div>
                                        <div className="text-zinc-400 text-xs">90+ Days</div>
                                        <div className="text-rose-400 font-bold">$15,000</div>
                                    </div>
                                    <div className="text-rose-500 text-xs">Critical</div>
                                </div>
                            </div>

                            <Button variant="outline" size="sm" className="w-full mt-4 bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10">
                                View Full Report
                            </Button>
                        </div>
                    </div>

                </div>

                {/* Right Column: Live Feed - Spans 3 cols */}
                <div className="col-span-12 lg:col-span-3 h-full min-h-[500px]">
                    <div className="h-full w-full bg-white rounded-3xl p-6 flex flex-col border border-zinc-200 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-zinc-900">Transactions</h3>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>

                        <div className="flex-1 space-y-4 overflow-hidden relative">
                            {/* Mock Feed Items */}
                            {transactions.map((item, i) => (
                                <div key={i} className="flex gap-3 items-start p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                                    <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${item.type === 'inflow' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                        {item.type === 'inflow' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-zinc-900">{item.title}</h4>
                                        <p className="text-xs text-zinc-500">{item.desc}</p>
                                        <span className="text-[10px] text-zinc-400 mt-1 block">{item.time}</span>
                                    </div>
                                </div>
                            ))}

                            <div className="p-4 bg-emerald-50 rounded-2xl mt-8 border border-emerald-100">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-sm font-bold text-emerald-900">Runway</h4>
                                    <span className="text-xs font-medium text-emerald-700 bg-emerald-200 px-2 py-0.5 rounded-full">Safe</span>
                                </div>
                                <div className="text-2xl font-bold text-emerald-800">14 Months</div>
                                <p className="text-xs text-emerald-600 mt-1">Based on current burn rate.</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <SmartEntrySheet
                isOpen={isEntryOpen}
                onClose={() => { setIsEntryOpen(false); fetchData(); }}
                category="finance"
            />
        </div>
    )
}
