"use client"

import { useState, useEffect } from "react"
import { PremiumCard } from "@/components/design/PremiumCard"
import { useHeader } from "@/components/providers/HeaderProvider"
import { useFilter } from "@/components/providers/FilterProvider"
import { formatCurrency, cn } from "@/lib/utils"
import {
    Users, Target, FileText, Briefcase, ArrowUpRight, TrendingUp,
    TrendingDown, Plus, CheckCircle2, LineChart, Eye, ShoppingCart, Wallet
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, PieChart, Pie, LabelList
} from 'recharts'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SmartEntrySheet } from "@/components/data-entry/SmartEntrySheet"

export default function SalesPage() {
    const { setHeaderInfo } = useHeader()
    const { period, currency, selectedCompanyIds } = useFilter()

    useEffect(() => {
        setHeaderInfo("Business Acquisition", "Monitor funnel performance, customer acquisition, and revenue targets.")
    }, [setHeaderInfo])

    const [isEntryOpen, setIsEntryOpen] = useState(false)
    const [metrics, setMetrics] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [localPeriod, setLocalPeriod] = useState("Weekly") // Default local period
    const [funnelMode, setFunnelMode] = useState<"Nos" | "Values">("Nos")

    const [funnelDetailsModalOpen, setFunnelDetailsModalOpen] = useState(false)
    const [targetModalOpen, setTargetModalOpen] = useState(false)
    const [ordersYtdModalOpen, setOrdersYtdModalOpen] = useState(false)
    const [invoiceYtdModalOpen, setInvoiceYtdModalOpen] = useState(false)
    const [ordersNosModalOpen, setOrdersNosModalOpen] = useState(false)
    const [ordersValueModalOpen, setOrdersValueModalOpen] = useState(false)

    const fetchData = async () => {
        setLoading(true)
        try {
            const companyParam = selectedCompanyIds.length > 0 ? `&companies=${selectedCompanyIds.join(',')}` : ''
            const res = await fetch(`/api/metrics?category=sales&period=${localPeriod}${companyParam}`)
            const data = await res.json()
            
            if (Array.isArray(data)) {
                const grouped = data.reduce((acc: any, curr: any) => {
                    const dStr = new Date(curr.date).toDateString()
                    if (!acc[dStr]) {
                        acc[dStr] = { ...curr, _count: 1 }
                    } else {
                        acc[dStr]._count += 1
                        for (let k in curr) {
                            if (typeof curr[k] === 'number') {
                                if (k.toLowerCase().includes('pct') || k.toLowerCase().includes('rate') || k.toLowerCase().includes('ratio')) {
                                    // Rolling average for percentages
                                    acc[dStr][k] = ((acc[dStr][k] * (acc[dStr]._count - 1)) + curr[k]) / acc[dStr]._count;
                                } else {
                                    acc[dStr][k] += curr[k]
                                }
                            }
                        }
                    }
                    return acc
                }, {})
                
                const mergedMetrics = Object.values(grouped).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                setMetrics(mergedMetrics)
            } else {
                setMetrics([])
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [localPeriod, selectedCompanyIds]) // Refetch when local period or selected companies change

    const latest = metrics[0] || {}

    // Number Funnel Data
    const funnelNumberData = [
        { name: "Leads", value: latest.leadsCount || 0 },
        { name: "RFQs", value: latest.rfqCount || 0 },
        { name: "Quotes", value: latest.quotesCount || 0 },
        { name: "Negotiation", value: latest.negotiationCount || 0 },
        { name: "Orders", value: latest.orderCount || 0 }
    ]

    // Value Funnel Data
    const funnelValueData = [
        { name: "Quotes", value: latest.quotesValue || 0 },
        { name: "Negotiation", value: latest.negotiationValue || 0 },
        { name: "Wins", value: latest.winValue || 0 },
        { name: "Losses", value: latest.lossValue || 0 }
    ]

    const conversionRate = latest.leadsCount ? ((latest.orderCount || 0) / latest.leadsCount) * 100 : 0

    const achievedValue = (latest.annualTarget || 0) * ((latest.ordersYtdPct || 0) / 100)
    const getPeriodLabel = (p: string) => {
        switch (p) {
            case 'Weekly': return 'week'
            case 'Quarterly': return 'quarter'
            case 'Annual': return 'year'
            case 'Monthly':
            default: return 'month'
        }
    }

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

                    {/* Overall Summary Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Monthly Target */}
                        <div className="bg-emerald-50/40 rounded-3xl p-6 border border-emerald-100/50 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100/50 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-sm font-medium text-emerald-800/70">Monthly Target</p>
                                        <h3 className="text-2xl font-bold text-zinc-900 mt-1">{formatCurrency(latest.monthlyTarget || 0, currency)}</h3>
                                    </div>
                                    <div className="flex flex-col gap-2 items-end">
                                        <button onClick={() => setTargetModalOpen(true)} className="p-1.5 rounded-full hover:bg-emerald-100 text-zinc-400 hover:text-emerald-600 transition-all z-20">
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-emerald-100 shadow-sm mt-1">
                                            <Target className="w-4 h-4 text-emerald-600" />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-auto pt-2">
                                    <span className="inline-block px-2 py-0.5 rounded-full bg-white text-emerald-600 border border-emerald-100/50 shadow-sm text-[10px] font-semibold">
                                        Achieved so far: {latest.monthlyAchievedPct || 0}% ({formatCurrency(latest.monthlyAchieved || 0, currency)})
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Orders YTD */}
                        <div className="bg-emerald-50/40 rounded-3xl p-6 border border-emerald-100/50 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100/50 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-sm font-medium text-emerald-800/70">Orders YTD</p>
                                        <h3 className="text-2xl font-bold text-zinc-900 mt-1">{latest.ordersYtdPct || 0}%</h3>
                                    </div>
                                    <div className="flex flex-col gap-2 items-end">
                                        <button onClick={() => setOrdersYtdModalOpen(true)} className="p-1.5 rounded-full hover:bg-emerald-100 text-zinc-400 hover:text-emerald-600 transition-all z-20">
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-emerald-100 shadow-sm mt-1">
                                            <ShoppingCart className="w-4 h-4 text-emerald-600" />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-auto pt-2">
                                    <span className="inline-block px-2 py-0.5 rounded-full bg-white text-orange-600 border border-orange-100/50 shadow-sm text-[10px] font-semibold">
                                        0.0% vs prev {getPeriodLabel(localPeriod)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Invoice YTD */}
                        <div className="bg-blue-50/40 rounded-3xl p-6 border border-blue-100/50 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100/50 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-sm font-medium text-blue-800/70">Invoice YTD</p>
                                        <h3 className="text-2xl font-bold text-zinc-900 mt-1">{latest.invoiceYtdPct || 0}%</h3>
                                    </div>
                                    <div className="flex flex-col gap-2 items-end">
                                        <button onClick={() => setInvoiceYtdModalOpen(true)} className="p-1.5 rounded-full hover:bg-blue-100 text-zinc-400 hover:text-blue-600 transition-all z-20">
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-blue-100 shadow-sm mt-1">
                                            <FileText className="w-4 h-4 text-blue-600" />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-auto pt-2">
                                    <span className="inline-block px-2 py-0.5 rounded-full bg-white text-orange-600 border border-orange-100/50 shadow-sm text-[10px] font-semibold">
                                        0.0% vs prev {getPeriodLabel(localPeriod)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Funnel Deep Dives Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Funnel Numbers */}
                        {/* Funnel Numbers */}
                        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <ShoppingCart className="w-5 h-5 text-emerald-600" />
                                        <h3 className="font-bold text-zinc-900 text-lg">Orders (in Nos)</h3>
                                    </div>
                                    <p className="text-zinc-500 text-sm">Lead to Order conversion</p>
                                </div>
                                <button onClick={() => setOrdersNosModalOpen(true)} className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-emerald-600 transition-all z-20">
                                    <Eye className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex items-baseline gap-2 mb-4">
                                <span className="text-3xl font-bold text-zinc-900">
                                    {(latest.leadsCount || 0) + (latest.rfqCount || 0) + (latest.quotesCount || 0) + (latest.negotiationCount || 0) + (latest.orderCount || 0)} Leads
                                </span>
                                <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">~{conversionRate.toFixed(1)}% Conversion</span>
                            </div>
                            <div className="flex gap-2 text-xs text-zinc-500">
                                <span>{latest.rfqCount || 0} RFQ</span> &bull; <span>{latest.quotesCount || 0} Quotes</span> &bull; <span>{latest.orderCount || 0} Orders</span>
                            </div>
                        </div>

                        {/* Funnel Value */}
                        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Wallet className="w-5 h-5 text-purple-600" />
                                        <h3 className="font-bold text-zinc-900 text-lg">Orders (in Value)</h3>
                                    </div>
                                    <p className="text-zinc-500 text-sm">Total Pipeline Context</p>
                                </div>
                                <button onClick={() => setOrdersValueModalOpen(true)} className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-purple-600 transition-all z-20">
                                    <Eye className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex items-baseline gap-2 mb-4">
                                <span className="text-3xl font-bold text-zinc-900">{formatCurrency((latest.quotesValue || 0) + (latest.negotiationValue || 0) + (latest.winValue || 0), currency)}</span>
                            </div>
                            <div className="flex gap-2 text-xs text-zinc-500 w-full overflow-hidden">
                                <span className="text-emerald-600 font-bold truncate">Wins: {formatCurrency(latest.winValue || 0, currency)}</span> &bull;
                                <span className="text-rose-600 font-bold truncate">Losses: {formatCurrency(latest.lossValue || 0, currency)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Chart Section */}
                    <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm relative overflow-hidden min-h-[350px] flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex flex-col">
                                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-3">
                                    <Users className="w-6 h-6 text-blue-600" />
                                </div>
                                <h3 className="font-bold text-zinc-900 text-xl tracking-tight">Sales & Pipeline</h3>
                                <p className="text-zinc-500 text-sm mt-1">Track leads and conversion rates.</p>
                            </div>
                            <div className="flex items-center gap-3 z-20">
                                <div className="flex bg-zinc-100 p-1 rounded-full border border-zinc-200">
                                    <button
                                        onClick={() => setFunnelMode("Nos")}
                                        className={cn("px-3 py-1 text-xs rounded-full font-medium transition-colors", funnelMode === "Nos" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500")}
                                    >
                                        Nos
                                    </button>
                                    <button
                                        onClick={() => setFunnelMode("Values")}
                                        className={cn("px-3 py-1 text-xs rounded-full font-medium transition-colors", funnelMode === "Values" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500")}
                                    >
                                        Values
                                    </button>
                                </div>
                                <button onClick={() => setFunnelDetailsModalOpen(true)} className="p-2.5 rounded-full bg-zinc-50 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-all shadow-sm border border-zinc-100">
                                    <Eye className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="w-full flex justify-center mt-auto pb-2">
                            <div className="w-full max-w-[320px] h-[200px] relative">
                                {funnelMode === "Nos" ? (() => {
                                    const data = [
                                        { label: "Leads", value: latest.leadsCount || 0, color: "#dbeafe", text: "#1e3a8a" },
                                        { label: "RFQs", value: latest.rfqCount || 0, color: "#bfdbfe", text: "#1e40af" },
                                        { label: "Quotes", value: latest.quotesCount || 0, color: "#60a5fa", text: "#ffffff", shadow: true },
                                        { label: "Negotiation", value: latest.negotiationCount || 0, color: "#3b82f6", text: "#ffffff", shadow: true },
                                        { label: "Orders", value: latest.orderCount || 0, color: "#2563eb", text: "#ffffff", shadow: true }
                                    ];
                                    const maxVal = Math.max(...data.map(d => d.value), 1);
                                    const getW = (val: number) => Math.max((val / maxVal) * 260, 100);

                                    return (
                                        <svg viewBox="0 0 260 200" className="w-full h-full drop-shadow-sm" preserveAspectRatio="none">
                                            {data.map((d, i) => {
                                                const Wt = getW(d.value);
                                                const Wb = i < data.length - 1 ? getW(data[i + 1].value) : Wt * 0.7;
                                                const yTop = i * 40;
                                                const height = 38;
                                                const pts = `${130 - Wt / 2},${yTop} ${130 + Wt / 2},${yTop} ${130 + Wb / 2},${yTop + height} ${130 - Wb / 2},${yTop + height}`;
                                                return (
                                                    <g key={d.label}>
                                                        <polygon points={pts} fill={d.color} className="transition-all duration-500 ease-in-out" />
                                                        <text x="130" y={yTop + 24} fill={d.text} fontSize="14" fontWeight="bold" textAnchor="middle" style={d.shadow ? { textShadow: '0px 1px 2px rgba(0,0,0,0.15)' } : {}}>
                                                            {d.label} ({d.value})
                                                        </text>
                                                    </g>
                                                )
                                            })}
                                        </svg>
                                    );
                                })() : (() => {
                                    const avgQuoteValue = latest.quotesCount ? (latest.quotesValue || 0) / latest.quotesCount : 0;
                                    const estLeadsValue = (latest.leadsCount || 0) * avgQuoteValue;
                                    const estRfqValue = (latest.rfqCount || 0) * avgQuoteValue;

                                    const data = [
                                        { label: "Leads", value: estLeadsValue, color: "#faf5ff", text: "#4c1d95" },
                                        { label: "RFQs", value: estRfqValue, color: "#f3e8ff", text: "#581c87" },
                                        { label: "Quotes", value: latest.quotesValue || 0, color: "#e9d5ff", text: "#581c87" },
                                        { label: "Negotiation", value: latest.negotiationValue || 0, color: "#d8b4fe", text: "#4c1d95" },
                                        { label: "Wins", value: latest.winValue || 0, color: "#a855f7", text: "#ffffff", shadow: true },
                                        { label: "Losses", value: latest.lossValue || 0, color: "#7e22ce", text: "#ffffff", shadow: true }
                                    ];
                                    const maxVal = Math.max(...data.map(d => d.value), 1);
                                    const getW = (val: number) => Math.max((val / maxVal) * 260, 140);

                                    return (
                                        <svg viewBox="0 0 260 200" className="w-full h-full drop-shadow-sm" preserveAspectRatio="none">
                                            {data.map((d, i) => {
                                                const Wt = getW(d.value);
                                                const Wb = i < data.length - 1 ? getW(data[i + 1].value) : Wt * 0.7;
                                                const yTop = Math.floor(i * (200 / 6));
                                                const rectHeight = Math.floor(200 / 6) - 2;
                                                const pts = `${130 - Wt / 2},${yTop} ${130 + Wt / 2},${yTop} ${130 + Wb / 2},${yTop + rectHeight} ${130 - Wb / 2},${yTop + rectHeight}`;
                                                return (
                                                    <g key={d.label}>
                                                        <polygon points={pts} fill={d.color} className="transition-all duration-500 ease-in-out" />
                                                        <text x="130" y={yTop + (rectHeight / 2) + 4} fill={d.text} fontSize="12" fontWeight="bold" textAnchor="middle" style={d.shadow ? { textShadow: '0px 1px 2px rgba(0,0,0,0.15)' } : {}}>
                                                            {d.label} ({d.value === 0 ? "₹0" : formatCurrency(d.value, currency)})
                                                        </text>
                                                    </g>
                                                )
                                            })}
                                        </svg>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-3 relative min-h-[500px] lg:min-h-0">
                    <div className="w-full h-full lg:absolute lg:inset-0 bg-white rounded-3xl p-4 flex flex-col border border-zinc-200 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between mb-4 shrink-0 px-2 pt-2">
                            <h3 className="font-bold text-zinc-900">Recent Activities</h3>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <div className="flex-1 space-y-3 overflow-y-auto relative pr-2 pb-2 custom-scrollbar">
                            {(latest.recentActivities || []).slice(0, 10).map((activity: any, i: number) => {
                                const isWin = activity.statusName.toLowerCase().includes('win') || activity.statusName.toLowerCase().includes('order');
                                const isLoss = activity.statusName.toLowerCase().includes('loss') || activity.statusName.toLowerCase().includes('lost') || activity.statusName.toLowerCase().includes('cancel');
                                
                                let iconBg = "bg-blue-100 text-blue-600";
                                let Icon = FileText;
                                if (isWin) { iconBg = "bg-emerald-100 text-emerald-600"; Icon = CheckCircle2; }
                                else if (isLoss) { iconBg = "bg-rose-100 text-rose-600"; Icon = TrendingDown; }
                                else { iconBg = "bg-amber-100 text-amber-600"; Icon = TrendingUp; }

                                return (
                                <div key={i} className="flex gap-3 items-start p-3 rounded-2xl bg-zinc-50/80 hover:bg-zinc-100 transition-colors border border-zinc-100/80">
                                    <div className={`w-8 h-8 rounded-full ${iconBg} shrink-0 flex items-center justify-center mt-0.5`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center gap-2">
                                            <h4 className="text-sm font-semibold text-zinc-900 truncate">{activity.oppName}</h4>
                                            <span className="text-[10px] text-zinc-400 whitespace-nowrap shrink-0">
                                                {new Date(activity.date || new Date()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-zinc-500 font-medium truncate mt-0.5">{activity.customerName}</p>
                                        <div className="flex flex-wrap gap-1.5 items-center mt-2 text-[10px]">
                                            <span className="font-bold text-zinc-700 bg-white px-1.5 py-0.5 rounded-md border border-zinc-200 shadow-sm">
                                                {formatCurrency(activity.value, currency)}
                                            </span>
                                            <span className="text-zinc-400">&bull;</span>
                                            <span className={`px-1.5 py-0.5 rounded-md bg-white border shadow-sm font-bold truncate max-w-[100px] ${isWin ? 'text-emerald-700 border-emerald-200' : isLoss ? 'text-rose-700 border-rose-200' : 'text-amber-700 border-amber-200'}`}>
                                                {activity.statusName}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                )
                            })}
                            {(latest.recentActivities || []).length === 0 && (
                                <div className="text-center py-10 text-zinc-400 text-sm">
                                    No recent pipeline activity.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Funnel Details Modal */}
            <Dialog open={funnelDetailsModalOpen} onOpenChange={setFunnelDetailsModalOpen}>
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            Sales Funnel Details
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-6 overflow-auto max-h-[60vh] bg-zinc-50/50 rounded-xl p-4">
                        <div className="overflow-hidden rounded-xl border border-zinc-200 shadow-sm bg-white">
                            <table className="w-full text-sm text-left whitespace-nowrap">
                                <thead className="text-xs text-zinc-500 uppercase bg-zinc-50/80 border-b border-zinc-200">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold border-r border-zinc-200 w-32">Date</th>
                                        <th className="px-6 py-4 font-semibold text-right border-r border-zinc-200">Leads</th>
                                        <th className="px-6 py-4 font-semibold text-right border-r border-zinc-200">RFQs</th>
                                        <th className="px-6 py-4 font-semibold text-right border-r border-zinc-200">Quotes</th>
                                        <th className="px-6 py-4 font-semibold text-right border-r border-zinc-200">Negotiations</th>
                                        <th className="px-6 py-4 font-semibold text-right">Orders</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {metrics.map((m: any, i: number) => (
                                        <tr key={i} className="hover:bg-zinc-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-zinc-900 border-r border-zinc-100">
                                                {new Date(m.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right border-r border-dashed border-zinc-200 font-medium">{m.leadsCount || 0}</td>
                                            <td className="px-6 py-4 text-right border-r border-dashed border-zinc-200 font-medium">{m.rfqCount || 0}</td>
                                            <td className="px-6 py-4 text-right border-r border-dashed border-zinc-200 font-medium">{m.quotesCount || 0}</td>
                                            <td className="px-6 py-4 text-right border-r border-dashed border-zinc-200 font-medium">{m.negotiationCount || 0}</td>
                                            <td className="px-6 py-4 text-right font-medium">{m.orderCount || 0}</td>
                                        </tr>
                                    ))}
                                    {metrics.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-zinc-500 bg-white">
                                                No historical data available for {localPeriod.toLowerCase()}.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Target Details Modal */}
            <Dialog open={targetModalOpen} onOpenChange={setTargetModalOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Annual Target Breakdown</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="overflow-hidden rounded-2xl border border-zinc-200 shadow-sm">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 border-b border-zinc-200">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">Metric</th>
                                        <th className="px-6 py-4 font-semibold text-right">Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="bg-white border-b border-zinc-100">
                                        <td className="px-6 py-4 font-medium text-zinc-900">Total Annual Target</td>
                                        <td className="px-6 py-4 text-right font-bold">{formatCurrency(latest.annualTarget || 0, currency)}</td>
                                    </tr>
                                    <tr className="bg-white border-b border-zinc-100">
                                        <td className="px-6 py-4 font-medium text-emerald-600">Achieved YTD Amount</td>
                                        <td className="px-6 py-4 text-right text-emerald-600 font-bold">{formatCurrency(achievedValue, currency)}</td>
                                    </tr>
                                    <tr className="bg-zinc-50">
                                        <td className="px-6 py-4 font-medium text-zinc-900">Remaining to Target</td>
                                        <td className="px-6 py-4 text-right text-rose-600 font-bold">{formatCurrency(Math.max(0, (latest.annualTarget || 0) - achievedValue), currency)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Orders YTD Modal */}
            <Dialog open={ordersYtdModalOpen} onOpenChange={setOrdersYtdModalOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Orders YTD Progress</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                            <div>
                                <p className="text-sm text-emerald-600 font-medium">Orders YTD Percentage</p>
                                <p className="text-2xl font-bold text-emerald-700">{latest.ordersYtdPct || 0}%</p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-emerald-500 opacity-50" />
                        </div>
                        <p className="text-sm text-zinc-500">This metric represents the percentage of total sales target booked through confirmed orders in the current period.</p>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Invoice YTD Modal */}
            <Dialog open={invoiceYtdModalOpen} onOpenChange={setInvoiceYtdModalOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Invoice YTD Progress</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-xl">
                            <div>
                                <p className="text-sm text-blue-600 font-medium">Invoice YTD Percentage</p>
                                <p className="text-2xl font-bold text-blue-700">{latest.invoiceYtdPct || 0}%</p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-blue-500 opacity-50" />
                        </div>
                        <p className="text-sm text-zinc-500">This metric represents the percentage of booked orders that have been successfully invoiced to the customer.</p>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Orders Nos Modal */}
            <Dialog open={ordersNosModalOpen} onOpenChange={setOrdersNosModalOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Volume Breakdown</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="overflow-hidden rounded-2xl border border-zinc-200 shadow-sm">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 border-b border-zinc-200">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">Funnel Stage</th>
                                        <th className="px-6 py-4 font-semibold text-right">Count</th>
                                        <th className="px-6 py-4 font-semibold text-right">Drop-off</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="bg-white border-b border-zinc-100">
                                        <td className="px-6 py-4 font-medium text-zinc-900">1. Leads</td>
                                        <td className="px-6 py-4 text-right">{latest.leadsCount || 0}</td>
                                        <td className="px-6 py-4 text-right text-zinc-400">-</td>
                                    </tr>
                                    <tr className="bg-white border-b border-zinc-100">
                                        <td className="px-6 py-4 font-medium text-zinc-900">2. RFQs</td>
                                        <td className="px-6 py-4 text-right">{latest.rfqCount || 0}</td>
                                        <td className="px-6 py-4 text-right text-rose-500">{((latest.leadsCount || 0) - (latest.rfqCount || 0))}</td>
                                    </tr>
                                    <tr className="bg-white border-b border-zinc-100">
                                        <td className="px-6 py-4 font-medium text-zinc-900">3. Quotes</td>
                                        <td className="px-6 py-4 text-right">{latest.quotesCount || 0}</td>
                                        <td className="px-6 py-4 text-right text-rose-500">{((latest.rfqCount || 0) - (latest.quotesCount || 0))}</td>
                                    </tr>
                                    <tr className="bg-zinc-50 border-t border-zinc-200">
                                        <td className="px-6 py-4 font-bold text-emerald-600">Final Orders</td>
                                        <td className="px-6 py-4 text-right font-bold text-emerald-600">{latest.orderCount || 0}</td>
                                        <td className="px-6 py-4 text-right text-emerald-600">Yield: {conversionRate.toFixed(1)}%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Orders Value Modal */}
            <Dialog open={ordersValueModalOpen} onOpenChange={setOrdersValueModalOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Pipeline Value Details</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="overflow-hidden rounded-2xl border border-zinc-200 shadow-sm">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 border-b border-zinc-200">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">Value Category</th>
                                        <th className="px-6 py-4 font-semibold text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="bg-white border-b border-zinc-100">
                                        <td className="px-6 py-4 font-medium text-zinc-900">Quoted Value</td>
                                        <td className="px-6 py-4 text-right font-semibold text-blue-600">{formatCurrency(latest.quotesValue || 0, currency)}</td>
                                    </tr>
                                    <tr className="bg-white border-b border-zinc-100">
                                        <td className="px-6 py-4 font-medium text-zinc-900">Value in Negotiation</td>
                                        <td className="px-6 py-4 text-right font-semibold text-amber-600">{formatCurrency(latest.negotiationValue || 0, currency)}</td>
                                    </tr>
                                    <tr className="bg-white border-b border-zinc-100">
                                        <td className="px-6 py-4 font-medium text-zinc-900">Closed Won</td>
                                        <td className="px-6 py-4 text-right font-bold text-emerald-600">{formatCurrency(latest.winValue || 0, currency)}</td>
                                    </tr>
                                    <tr className="bg-zinc-50">
                                        <td className="px-6 py-4 font-medium text-zinc-900">Closed Lost</td>
                                        <td className="px-6 py-4 text-right font-bold text-rose-600">{formatCurrency(latest.lossValue || 0, currency)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <SmartEntrySheet
                isOpen={isEntryOpen}
                onClose={() => { setIsEntryOpen(false); fetchData(); }}
                category="sales"
            />
        </div>
    )
}
