"use client"

import { useState } from "react"
import { PremiumCard } from "@/components/design/PremiumCard"
import {
    Users,
    Target,
    FileText,
    Briefcase,
    ArrowUpRight,
    TrendingUp,
    TrendingDown,
    Plus,
    CheckCircle2,
    Clock,
    DollarSign,
    Handshake,
    Eye
} from "lucide-react"
import { useEffect } from "react"
import { useHeader } from "@/components/providers/HeaderProvider"
import { SmartEntrySheet } from "@/components/data-entry/SmartEntrySheet"
import { Button } from "@/components/ui/button"
import { useDetailView } from "@/components/providers/DetailViewProvider"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    Label,
    LabelList
} from 'recharts'

export default function SalesPage() {
    const { setHeaderInfo } = useHeader()

    useEffect(() => {
        setHeaderInfo("Sales & Marketing", "Pipeline health and conversion analytics.")
    }, [setHeaderInfo])
    const { openDetailView } = useDetailView()
    const [currency, setCurrency] = useState("INR")
    const [funnelView, setFunnelView] = useState<'count' | 'value'>('count') // 'count' | 'value'
    const [period, setPeriod] = useState("Annual")
    const [isEntryOpen, setIsEntryOpen] = useState(false)
    const [metrics, setMetrics] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/metrics?category=sales&period=${period}`)
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

    // Currency Formatter
    const formatCurrency = (val: number) => {
        if (isNaN(val)) return "0"
        let amount = val
        let code = currency
        if (currency === "USD") {
            amount = val / 84 // Approx rate
        }
        return new Intl.NumberFormat(currency === "INR" ? 'en-IN' : 'en-US', {
            style: 'currency',
            currency: code,
            maximumFractionDigits: 0
        }).format(amount)
    }

    // Chart Data Mappers
    // 1. Funnel (in numbers)
    const countFunnelData = [
        { stage: 'Leads', value: latest.leadsCount || 0, fill: '#64748b' },
        { stage: 'RFQ', value: latest.rfqCount || 0, fill: '#3b82f6' },
        { stage: 'Quotes', value: latest.quotesCount || 0, fill: '#8b5cf6' },
        { stage: 'Negotiation', value: latest.negotiationCount || 0, fill: '#f59e0b' },
        { stage: 'Orders', value: latest.orderCount || 0, fill: '#10b981' },
    ]

    // 2. Funnel (in INR/USD)
    const valueFunnelData = [
        { stage: 'Quotes', value: latest.quotesValue || 0, fill: '#8b5cf6' },
        { stage: 'Negotiation', value: latest.negotiationValue || 0, fill: '#f59e0b' },
        { stage: 'Wins', value: latest.winValue || 0, fill: '#10b981' },
        { stage: 'Loss', value: latest.lossValue || 0, fill: '#ef4444' },
    ]

    // Select data based on view
    const currentFunnelData = funnelView === 'count' ? countFunnelData : valueFunnelData.map(d => ({
        ...d,
        // If view is value, we might want to convert currency for display in tooltip
        // But for the bar height/proportion, raw value is fine. Tooltip will handle formatting.
        displayValue: d.value
    }))

    const targetVal = latest.annualTarget || 1
    const achievedVal = latest.ordersYtd || 0
    const progress = Math.min(Math.round((achievedVal / targetVal) * 100), 100)

    // Side Widget Data (Pipeline Value Breakdown) - Always Value
    const pipelineWidgetData = valueFunnelData

    // Live Feed Data (Mock)
    const feedItems = [
        { id: 1, title: "New Lead Acquired", desc: "Global Logistics Ltd.", time: "2m ago", type: "success" },
        { id: 2, title: "Quote Approved", desc: "TechSpace Inc - $45k", time: "1h ago", type: "success" },
        { id: 3, title: "Target Alert", desc: "Q3 Goal 95% met.", time: "3h ago", type: "info" },
        { id: 4, title: "Evaluation Call", desc: "With CTO of FinCorp.", time: "5h ago", type: "neutral" },
    ]

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Actions Bar */}
            <div className="flex justify-end items-center gap-4 mb-2">

                <div className="flex items-center gap-3">
                    <div className="flex items-center px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse mr-2" />
                        <span className="text-sm font-medium text-blue-800">Tracking Active</span>
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
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); openDetailView("Annual Sales Target", "Sales"); }}
                                title="View Data Details"
                                className="absolute top-4 right-4 p-1.5 rounded-full bg-zinc-50 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all z-20 opacity-0 group-hover:opacity-100"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-sm font-medium text-zinc-500">Annual Target</p>
                                        <h3 className="text-2xl font-bold text-zinc-900 mt-1">{formatCurrency(latest.annualTarget || 0)}</h3>
                                    </div>
                                    <div className="p-2 bg-blue-50 rounded-xl">
                                        <Target className="w-5 h-5 text-blue-600" />
                                    </div>
                                </div>
                                <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-blue-600 h-full transition-all duration-500" style={{ width: `${progress}%` }} />
                                </div>
                                <div className="mt-2 text-xs text-zinc-400">
                                    <span className="text-blue-600 font-medium">{progress}%</span> completed
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
                                        <p className="text-sm font-medium text-zinc-500">Orders YTD</p>
                                        <h3 className="text-2xl font-bold text-zinc-900 mt-1">{formatCurrency(latest.ordersYtd || 0)}</h3>
                                    </div>
                                    <div className="p-2 bg-emerald-50 rounded-xl">
                                        <Briefcase className="w-5 h-5 text-emerald-600" />
                                    </div>
                                </div>
                                <div className="flex items-center text-xs text-emerald-600 font-medium bg-emerald-50 w-fit px-2 py-1 rounded-full">
                                    <ArrowUpRight className="w-3 h-3 mr-1" />
                                    {latest.ordersYtd > latest.annualTarget ? "Exceeded" : "On Track"}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
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
                                        <p className="text-sm font-medium text-zinc-500">Invoiced YTD</p>
                                        <h3 className="text-2xl font-bold text-zinc-900 mt-1">{formatCurrency(latest.invoiceYtd || 0)}</h3>
                                    </div>
                                    <div className="p-2 bg-purple-50 rounded-xl">
                                        <FileText className="w-5 h-5 text-purple-600" />
                                    </div>
                                </div>
                                <div className="text-xs text-zinc-500">
                                    <span className="font-bold text-zinc-900">{latest.ordersYtd ? Math.round((latest.invoiceYtd / latest.ordersYtd) * 100) : 0}%</span> of Orders
                                </div>
                            </div>
                        </div>
                    </div>



                    {/* Sales Efficiency Row (CAC, LTV) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                        <p className="text-sm font-medium text-zinc-500">CAC</p>
                                        <h3 className="text-2xl font-bold text-zinc-900 mt-1">{formatCurrency(latest.cac || 0)}</h3>
                                    </div>
                                    <div className="p-2 bg-orange-50 rounded-xl">
                                        <TrendingDown className="w-5 h-5 text-orange-600" />
                                    </div>
                                </div>
                                <div className="text-xs text-zinc-400">Cost per Acquisition</div>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
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
                                        <p className="text-sm font-medium text-zinc-500">LTV</p>
                                        <h3 className="text-2xl font-bold text-zinc-900 mt-1">{formatCurrency(latest.ltv || 0)}</h3>
                                    </div>
                                    <div className="p-2 bg-indigo-50 rounded-xl">
                                        <TrendingUp className="w-5 h-5 text-indigo-600" />
                                    </div>
                                </div>
                                <div className="text-xs text-zinc-400">Lifetime Value</div>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
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
                                        <p className="text-sm font-medium text-zinc-500">LTV:CAC Ratio</p>
                                        <div className="flex items-baseline gap-2">
                                            <h3 className="text-2xl font-bold text-zinc-900 mt-1">{latest.ltvCacRatio || 0}:1</h3>
                                        </div>
                                    </div>
                                    <div className="p-2 bg-teal-50 rounded-xl">
                                        <TrendingUp className="w-5 h-5 text-teal-600" />
                                    </div>
                                </div>
                                <div className="flex items-center text-xs text-teal-600 font-medium bg-teal-50 w-fit px-2 py-1 rounded-full">
                                    Target: &gt; 3:1
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chart Grid */}
                    <div className="grid grid-cols-12 gap-6 h-[400px]">
                        {/* Large Chart: Funnel */}
                        <div className="col-span-12 md:col-span-8 bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-zinc-400" />
                                    Conversion Funnel
                                </h3>

                                {/* Funnel View Toggle (Modern Segmented Control) */}
                                <div className="flex bg-zinc-100 p-1 rounded-lg">
                                    <button
                                        onClick={() => setFunnelView('count')}
                                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${funnelView === 'count'
                                            ? "bg-white text-zinc-900 shadow-sm"
                                            : "text-zinc-500 hover:text-zinc-900"}`}
                                    >
                                        Orders
                                    </button>
                                    <button
                                        onClick={() => setFunnelView('value')}
                                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${funnelView === 'value'
                                            ? "bg-white text-zinc-900 shadow-sm"
                                            : "text-zinc-500 hover:text-zinc-900"}`}
                                    >
                                        Value
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={(e) => { e.stopPropagation(); setIsEntryOpen(true); }}
                                title="View Chart Data"
                                className="absolute top-6 right-6 p-1.5 rounded-full bg-emerald-50 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 transition-all z-20 opacity-0 group-hover:opacity-100 animate-pulse"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            <div className="h-[300px] w-full mt-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={currentFunnelData}
                                        layout="vertical"
                                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f4f4f5" />
                                        <XAxis type="number" hide />
                                        <YAxis
                                            dataKey="stage"
                                            type="category"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#71717a', fontSize: 13, fontWeight: 500 }}
                                            width={100}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            formatter={(value: any) => [
                                                funnelView === 'value' ? formatCurrency(value || 0) : value,
                                                funnelView === 'value' ? 'Value' : 'Count'
                                            ]}
                                        />
                                        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={40}>
                                            {currentFunnelData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                            <LabelList
                                                dataKey="value"
                                                position="right"
                                                fill="#71717a"
                                                fontSize={12}
                                                formatter={(val: any) => funnelView === 'value' ? formatCurrency(val || 0) : val}
                                            />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Smaller Chart: Pipeline Value */}
                        <div className="col-span-12 md:col-span-4 bg-zinc-900 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col group">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
                            <h3 className="font-bold text-white mb-6 z-10">Pipeline Value</h3>
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsEntryOpen(true); }}
                                title="View Details"
                                className="absolute top-6 right-6 p-1.5 rounded-full bg-emerald-50 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 transition-all z-20 opacity-0 group-hover:opacity-100 animate-pulse"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            <div className="space-y-5 flex-1 z-10">
                                {pipelineWidgetData.map((item) => (
                                    <div key={item.stage} className="space-y-1">
                                        <div className="flex justify-between text-xs text-zinc-400">
                                            <span>{item.stage}</span>
                                            <span className="text-white font-medium">{formatCurrency(item.value)}</span>
                                        </div>
                                        <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-1000"
                                                style={{
                                                    width: `${(item.value / (pipelineWidgetData[0].value || 1)) * 100}%`,
                                                    backgroundColor: item.fill
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>

                {/* Right Column: Live Feed - Spans 3 cols */}
                <div className="col-span-12 lg:col-span-3 h-full min-h-[500px]">
                    <div className="h-full w-full bg-white rounded-3xl p-6 flex flex-col border border-zinc-200 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-zinc-900">Live Pulse</h3>
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        </div>

                        <div className="flex-1 space-y-4 overflow-hidden relative">
                            {/* Mock Feed Items */}
                            {feedItems.map((item, i) => (
                                <div key={i} className="flex gap-3 items-start p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                                    <div className={`w-1.5 h-1.5 mt-2 rounded-full shrink-0 ${item.type === 'success' ? 'bg-emerald-500' : item.type === 'info' ? 'bg-blue-500' : 'bg-zinc-400'}`} />
                                    <div>
                                        <h4 className="text-sm font-semibold text-zinc-900">{item.title}</h4>
                                        <p className="text-xs text-zinc-500">{item.desc}</p>
                                        <span className="text-[10px] text-zinc-400 mt-1 block">{item.time}</span>
                                    </div>
                                </div>
                            ))}

                            <div className="p-4 bg-blue-50 rounded-2xl mt-8">
                                <h4 className="text-sm font-bold text-blue-900 mb-1">Q3 Focus</h4>
                                <p className="text-xs text-blue-700">Close 5 Enterprise deals to hit annual target.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sales Cycle Velocity Timeline */}
                <div className="mt-6 mb-8 col-span-12">
                    <div className="bg-white rounded-3xl p-8 border border-zinc-200 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                        <button
                            onClick={(e) => { e.stopPropagation(); setIsEntryOpen(true); }}
                            title="View Cycle Details"
                            className="absolute top-6 right-6 p-1.5 rounded-full bg-emerald-50 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 transition-all z-20 opacity-0 group-hover:opacity-100 animate-pulse"
                        >
                            <Eye className="w-4 h-4" />
                        </button>

                        <div className="flex items-center justify-between mb-10 relative z-10">
                            <div>
                                <h3 className="font-bold text-lg text-zinc-900 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-zinc-400" />
                                    Deal Velocity
                                </h3>
                                <p className="text-sm text-zinc-500 mt-1">Average time to close deals across stages.</p>
                            </div>
                            <div className="bg-slate-100 flex items-center px-4 py-2 rounded-full border border-slate-200">
                                <span className="text-xs text-slate-500 font-medium mr-2">Total Cycle:</span>
                                <span className="text-sm font-bold text-slate-900">
                                    {((latest.cycleTime?.leadsToRfq || 0) +
                                        (latest.cycleTime?.rfqToQuote || 0) +
                                        (latest.cycleTime?.quoteToNegotiation || 0) +
                                        (latest.cycleTime?.negotiationToOrder || 0))} Days
                                </span>
                            </div>
                        </div>

                        <div className="relative flex items-center justify-between px-10 pb-8 z-10">
                            {/* Connecting Line Base */}
                            <div className="absolute left-10 right-10 top-6 h-1 bg-slate-100 rounded-full -z-10" />

                            {/* Stage 1: Lead */}
                            <div className="flex flex-col items-center gap-4 relative">
                                <div className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-200 flex items-center justify-center shadow-lg relative z-10">
                                    <Users className="w-5 h-5 text-slate-400" />
                                </div>
                                <div className="text-center">
                                    <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Lead</h4>
                                    <span className="text-[10px] text-zinc-400">Entry</span>
                                </div>
                            </div>

                            {/* Connection 1-2 */}
                            <div className="flex-1 flex flex-col items-center -mt-6">
                                <div className="px-3 py-1 bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold rounded-full mb-3 shadow-sm">
                                    {latest.cycleTime?.leadsToRfq || 0} Days
                                </div>
                                <div className="w-full h-1 bg-gradient-to-r from-slate-200 to-blue-500 rounded-full" />
                            </div>

                            {/* Stage 2: RFQ */}
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-200 z-10">
                                    <FileText className="w-5 h-5 text-white" />
                                </div>
                                <div className="text-center">
                                    <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">RFQ</h4>
                                    <span className="text-[10px] text-zinc-400">Spec Defined</span>
                                </div>
                            </div>

                            {/* Connection 2-3 */}
                            <div className="flex-1 flex flex-col items-center -mt-6">
                                <div className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold rounded-full mb-3 shadow-sm">
                                    {latest.cycleTime?.rfqToQuote || 0} Days
                                </div>
                                <div className="w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" />
                            </div>

                            {/* Stage 3: Quote */}
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-200 z-10">
                                    <DollarSign className="w-5 h-5 text-white" />
                                </div>
                                <div className="text-center">
                                    <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Quote</h4>
                                    <span className="text-[10px] text-zinc-400">Pricing Sent</span>
                                </div>
                            </div>

                            {/* Connection 3-4 */}
                            <div className="flex-1 flex flex-col items-center -mt-6">
                                <div className="px-3 py-1 bg-violet-50 border border-violet-100 text-violet-600 text-xs font-bold rounded-full mb-3 shadow-sm">
                                    {latest.cycleTime?.quoteToNegotiation || 0} Days
                                </div>
                                <div className="w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
                            </div>

                            {/* Stage 4: Negotiation */}
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-purple-500 flex items-center justify-center shadow-lg shadow-purple-200 z-10">
                                    <Handshake className="w-5 h-5 text-white" />
                                </div>
                                <div className="text-center">
                                    <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Nego</h4>
                                    <span className="text-[10px] text-zinc-400">Terms</span>
                                </div>
                            </div>

                            {/* Connection 4-5 */}
                            <div className="flex-1 flex flex-col items-center -mt-6">
                                <div className="px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold rounded-full mb-3 shadow-sm">
                                    {latest.cycleTime?.negotiationToOrder || 0} Days
                                </div>
                                <div className="w-full h-1 bg-gradient-to-r from-purple-500 to-emerald-500 rounded-full" />
                            </div>

                            {/* Stage 5: Order */}
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200 z-10">
                                    <CheckCircle2 className="w-5 h-5 text-white" />
                                </div>
                                <div className="text-center">
                                    <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Order</h4>
                                    <span className="text-[10px] text-emerald-600 font-bold">Won</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <SmartEntrySheet
                isOpen={isEntryOpen}
                onClose={() => { setIsEntryOpen(false); fetchData(); }}
                category="sales"
            />
        </div >
    )
}
