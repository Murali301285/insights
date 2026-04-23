"use client"

import { useState, useEffect } from "react"
import { PremiumCard } from "@/components/design/PremiumCard"
import {
    PieChart,
    Users,
    Factory,
    Package,
    Search,
    Megaphone,
    TrendingUp,
    AlertCircle,
    ArrowRight,
    Activity,
    Zap,
    Globe,
    Eye,
    Sparkles,
    Brain,
    Info
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useHeader } from "@/components/providers/HeaderProvider"
import { useDetailView } from "@/components/providers/DetailViewProvider"
import { FunnelChart, Funnel, Tooltip, ResponsiveContainer, LabelList } from "recharts"

export interface DashboardData {
  finance: { orders: string, target: string, revenue: string, revenueTrend: string };
  salesFunnel: { quotation: number, negotiation: number, orderWin: number, orderLoss: number };
  manufacturing: { onTrack: number, critical: number };
  supplyChain: { suppliers: number, credit: number };
  support: { internal: number, external: number };
  hr: { open: number, hires: number };
  alerts: { id: number, title: string, desc: string, type: string }[];
}

interface DashboardContentProps {
    user?: {
        name: string;
        email: string;
        role: string;
    } | null;
    data?: DashboardData;
}

export function DashboardContent({ user, data }: DashboardContentProps) {
    // Global Header Integration
    const { setHeaderInfo } = useHeader()
    const { openDetailView } = useDetailView()
    const [greeting, setGreeting] = useState("Good Morning")
    const [salesToggle, setSalesToggle] = useState<"value" | "nos">("nos")

    // AI Insights State
    const [currentInsightIndex, setCurrentInsightIndex] = useState(0)
    const [isInsightPaused, setIsInsightPaused] = useState(false)
    const [isInsightVisible, setIsInsightVisible] = useState(true)

    useEffect(() => {
        const hour = new Date().getHours()
        let timeGreeting = "Good Morning"
        if (hour >= 12 && hour < 18) timeGreeting = "Good Afternoon"
        else if (hour >= 18) timeGreeting = "Good Evening"

        setGreeting(timeGreeting)

        // Set global header
        setHeaderInfo(
            `${timeGreeting}, ${user?.name || "Executive"}.`,
            "Your command center is active and monitoring."
        )
    }, [setHeaderInfo, user?.name])

    // AI Insights Data
    const insights = [
        {
            title: "Production Optimization Opportunity",
            detail: "Shift B efficiency is 12% lower than average. Re-allocating senior operators could boost output by ~150 units/day."
        },
        {
            title: "Supply Chain Risk Detected",
            detail: "Lead time for 'Steel Alloy X' has increased by 4 days. Suggest increasing safety stock by 20% for Q3."
        },
        {
            title: "Cash Flow Forecast",
            detail: "Projected inflow for next week is strong ($1.2M). Good time to clear pending AP to improve vendor relations."
        },
        {
            title: "Maintenance Alert",
            detail: "Conveyor Belt 4 motor vibration is abnormal. Predicted failure in 48-72 hours. Schedule maintenance during downtime."
        }
    ]

    useEffect(() => {
        if (!isInsightPaused) {
            const interval = setInterval(() => {
                setIsInsightVisible(false) // Start fade out
                setTimeout(() => {
                    setCurrentInsightIndex((prev) => (prev + 1) % insights.length)
                    setIsInsightVisible(true) // Start fade in
                }, 500) // Wait for fade out
            }, 5000) // Change every 5 seconds

            return () => clearInterval(interval)
        }
    }, [isInsightPaused, insights.length])

    const alerts = data?.alerts || [
        { id: 1, title: "Cash Flow Warning", desc: "Outflow exceeds inflow (3rd week).", type: "critical" },
        { id: 2, title: "Hiring Target Missed", desc: "Sales Engineer open 45+ days.", type: "warning" },
        { id: 3, title: "Inventory Low", desc: "Steel raw material < 20% stock.", type: "warning" },
        { id: 4, title: "Server Load High", desc: "Main gateway at 92% capacity.", type: "critical" },
        { id: 5, title: "New Compliance Policy", desc: "Q3 Safety Standards updated.", type: "info" },
    ]



    // Vertical Funnel Data
    const funnelData = [
        { "value": data?.salesFunnel.quotation || 100, "label": "Quotation", "fill": "#60a5fa" },
        { "value": data?.salesFunnel.negotiation || 75, "label": "Negotiation", "fill": "#2563eb" },
        { "value": data?.salesFunnel.orderWin || 50, "label": "Order Win", "fill": "#10b981" },
        { "value": data?.salesFunnel.orderLoss || 25, "label": "Order Loss", "fill": "#ef4444" }
    ]

    return (
        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-8 pt-0">
            {/* Actions Bar */}
            <div className="flex justify-end items-center gap-2 mb-2">
            </div>

            {/* Main Layout: Grid + Side Panel */}
            <div className="grid grid-cols-12 gap-3 h-auto">

                {/* Left Column: Bento Grid (Nav) - Spans 9 cols */}
                <div className="col-span-12 lg:col-span-9 grid grid-cols-12 gap-3 auto-rows-[145px]">

                    {/* Finance (Large - 6x2) */}
                    <div className="col-span-12 md:col-span-6 row-span-2 group relative">
                        <Link href="/finance" className="block h-full w-full">
                            <div className="relative h-full w-full bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-3xl p-8 overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl ring-1 ring-zinc-900/5">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

                                <div className="relative z-10 flex flex-col h-full justify-between">
                                    <div className="flex justify-between items-start">
                                        <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl w-fit">
                                            <PieChart className="w-8 h-8 text-white" />
                                        </div>
                                        <ArrowRight className="w-6 h-6 text-zinc-500 group-hover:text-white transition-colors" />
                                    </div>

                                    <div className="w-full">
                                        <h2 className="text-3xl font-bold text-white mb-2">Finance Hub</h2>
                                        <p className="text-zinc-400 max-w-md">Real-time cash flow, P&L analysis, and expense tracking at a granular level.</p>

                                        <div className="mt-6 grid grid-cols-3 gap-4">
                                            <div>
                                                <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider mb-1">Annual Target</p>
                                                <div className="text-2xl font-bold text-white">{data?.finance.target || "₹24.0Cr"}</div>
                                            </div>
                                            <div>
                                                <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider mb-1">Orders</p>
                                                <div className="text-2xl font-bold text-white">{data?.finance.orders || "₹16.5Cr"}</div>
                                            </div>
                                            <div>
                                                <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider mb-1">Revenue</p>
                                                <div className="text-2xl font-bold text-white flex items-center gap-2">
                                                    {data?.finance.revenue || "₹12.2Cr"}
                                                    <span className="text-[10px] font-medium text-emerald-400 flex items-center bg-emerald-500/20 px-1.5 py-0.5 rounded-full">
                                                        <TrendingUp className="w-3 h-3 mr-0.5" />
                                                        {data?.finance.revenueTrend || "+12%"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                        {/* Eye Icon Button */}
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); openDetailView("Finance Hub Details", "Finance"); }}
                            title="View Data Details"
                            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-zinc-400 hover:text-white hover:bg-white/20 transition-all z-20 opacity-0 group-hover:opacity-100"
                        >
                            <Eye className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Sales (Medium - 6x2) */}
                    <div className="col-span-12 md:col-span-6 row-span-2 group relative">
                        <Link href="/sales" className="block h-full w-full">
                            <div className="h-full w-full bg-white rounded-3xl p-6 border border-zinc-200 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-blue-200 relative overflow-hidden flex flex-col justify-between">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />

                                <div className="flex items-center justify-between relative z-10 mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-blue-50 rounded-2xl w-fit">
                                            <Users className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-zinc-900 leading-tight">Business Acquisition</h3>
                                            <p className="text-sm text-zinc-500 mt-0.5">Track leads and conversion rates.</p>
                                        </div>
                                    </div>
                                    <div className="flex bg-zinc-100 p-1 rounded-lg">
                                        <button 
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSalesToggle("value"); }}
                                            className={cn("px-3 py-1 text-xs font-bold rounded-md transition-all", salesToggle === 'value' ? 'bg-white shadow-sm text-blue-700' : 'text-zinc-500')}
                                        >Value</button>
                                        <button 
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSalesToggle("nos"); }}
                                            className={cn("px-3 py-1 text-xs font-bold rounded-md transition-all", salesToggle === 'nos' ? 'bg-white shadow-sm text-blue-700' : 'text-zinc-500')}
                                        >Nos</button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 relative z-10 h-full">
                                    <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100 flex flex-col justify-center text-center">
                                        <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1">Leads</div>
                                        <div className="text-xl lg:text-2xl font-black text-zinc-800">
                                            {salesToggle === 'nos' ? ((data?.salesFunnel.quotation || 0) + (data?.salesFunnel.negotiation || 0) + (data?.salesFunnel.orderWin || 0)) : '₹0.0Cr'}
                                        </div>
                                    </div>
                                    <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 flex flex-col justify-center text-center">
                                        <div className="text-[10px] uppercase font-bold text-blue-600/80 tracking-wider mb-1">Quotations</div>
                                        <div className="text-xl lg:text-2xl font-black text-blue-700">
                                            {salesToggle === 'nos' ? (data?.salesFunnel.quotation || 0) : '₹0.0Cr'}
                                        </div>
                                    </div>
                                    <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 flex flex-col justify-center text-center">
                                        <div className="text-[10px] uppercase font-bold text-amber-600/80 tracking-wider mb-1">Negotiation</div>
                                        <div className="text-xl lg:text-2xl font-black text-amber-700">
                                            {salesToggle === 'nos' ? (data?.salesFunnel.negotiation || 0) : '₹0.0Cr'}
                                        </div>
                                    </div>
                                    <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 flex flex-col justify-center text-center">
                                        <div className="text-[10px] uppercase font-bold text-emerald-600/80 tracking-wider mb-1">Orders</div>
                                        <div className="text-xl lg:text-2xl font-black text-emerald-700">
                                            {salesToggle === 'nos' ? (data?.salesFunnel.orderWin || 0) : '₹0.0Cr'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                        {/* Eye Icon Button */}
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); openDetailView("Sales Pipeline Details", "Sales"); }}
                            title="View Data Details"
                            className="absolute top-4 right-4 p-2 rounded-full bg-zinc-100 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 transition-all z-20 opacity-0 group-hover:opacity-100"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Manufacturing (Small - 3) */}
                    <div className="col-span-6 md:col-span-3 row-span-1 group relative">
                        <Link href="/manufacturing" className="block h-full w-full">
                            <div className="h-full w-full bg-amber-50 rounded-3xl p-4 sm:p-5 border border-amber-100 transition-all duration-300 hover:scale-[1.03] hover:shadow-md flex flex-col justify-center items-center text-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-amber-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="w-full flex flex-col items-center z-10">
                                    <div className="flex items-center gap-2 mb-3 justify-center">
                                        <Factory className="w-4 h-4 text-amber-600" />
                                        <span className="font-bold text-zinc-700 text-sm">Order Fulfillment</span>
                                    </div>
                                    <div className="flex gap-5 md:gap-8 justify-center text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="text-2xl font-black text-emerald-600">{data?.manufacturing.onTrack || 0}</div>
                                            <div className="text-[9px] uppercase font-bold text-emerald-600/90 tracking-widest mt-0.5">On Track</div>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <div className="text-2xl font-black text-rose-600">{data?.manufacturing.critical || 0}</div>
                                            <div className="text-[9px] uppercase font-bold text-rose-600/90 tracking-widest mt-0.5">Critical</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); openDetailView("Manufacturing Efficiency", "Manufacturing"); }}
                            title="View Data Details"
                            className="absolute top-4 right-4 p-1.5 rounded-full bg-zinc-50 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all z-20 opacity-0 group-hover:opacity-100"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Supply Chain (Small - 3) */}
                    <div className="col-span-6 md:col-span-3 row-span-1 group relative">
                        <Link href="/supply-chain" className="block h-full w-full">
                            <div className="h-full w-full bg-indigo-50 rounded-3xl p-4 sm:p-5 border border-indigo-100 transition-all duration-300 hover:scale-[1.03] hover:shadow-md flex flex-col justify-center items-center text-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-indigo-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="w-full flex flex-col items-center z-10">
                                    <div className="flex items-center gap-2 mb-3 justify-center">
                                        <Package className="w-4 h-4 text-indigo-600" />
                                        <span className="font-bold text-zinc-700 text-sm">Supply Chain</span>
                                    </div>
                                    <div className="flex gap-5 md:gap-8 justify-center text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="text-2xl font-black text-zinc-900">{data?.supplyChain.suppliers || 0}</div>
                                            <div className="text-[9px] uppercase font-bold text-zinc-500 tracking-widest mt-0.5">Suppliers</div>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <div className="text-2xl font-black text-indigo-600">{data?.supplyChain.credit || 0}</div>
                                            <div className="text-[9px] uppercase font-bold text-indigo-600/90 tracking-widest mt-0.5">New</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); openDetailView("Supply Chain Metrics", "Logistics"); }}
                            title="View Data Details"
                            className="absolute top-4 right-4 p-1.5 rounded-full bg-zinc-50 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all z-20 opacity-0 group-hover:opacity-100"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Support (Small - 3) */}
                    <div className="col-span-6 md:col-span-3 row-span-1 group relative">
                        <Link href="/support" className="block h-full w-full">
                            <div className="h-full w-full bg-rose-50 rounded-3xl p-4 sm:p-5 border border-rose-100 transition-all duration-300 hover:scale-[1.03] hover:shadow-md flex flex-col justify-center items-center text-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-rose-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="w-full flex flex-col items-center z-10">
                                    <div className="flex items-center gap-2 mb-3 justify-center">
                                        <Search className="w-4 h-4 text-rose-600" />
                                        <span className="font-bold text-zinc-700 text-sm">Support</span>
                                    </div>
                                    <div className="flex gap-5 md:gap-8 justify-center text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="text-2xl font-black text-rose-700">{data?.support.internal || 0}</div>
                                            <div className="text-[9px] uppercase font-bold text-rose-600/90 tracking-widest mt-0.5">Internal</div>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <div className="text-2xl font-black text-rose-700">{data?.support.external || 0}</div>
                                            <div className="text-[9px] uppercase font-bold text-rose-600/90 tracking-widest mt-0.5">External</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); openDetailView("Support Tickets", "Support"); }}
                            title="View Data Details"
                            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/50 text-rose-400 hover:text-rose-900 hover:bg-white transition-all z-20 opacity-0 group-hover:opacity-100"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                    </div>

                    {/* HR (Small - 3) */}
                    <div className="col-span-6 md:col-span-3 row-span-1 group relative">
                        <Link href="/hr" className="block h-full w-full">
                            <div className="h-full w-full bg-purple-50 rounded-3xl p-4 sm:p-5 border border-purple-100 transition-all duration-300 hover:scale-[1.03] hover:shadow-md flex flex-col justify-center items-center text-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-purple-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="w-full flex flex-col items-center z-10">
                                    <div className="flex items-center gap-2 mb-3 justify-center">
                                        <Megaphone className="w-4 h-4 text-purple-600" />
                                        <span className="font-bold text-zinc-700 text-sm">HR Portal</span>
                                    </div>
                                    <div className="flex gap-5 md:gap-8 justify-center text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="text-2xl font-black text-purple-700">{data?.hr.open || 0}</div>
                                            <div className="text-[9px] uppercase font-bold text-purple-600/90 tracking-widest mt-0.5">Open</div>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <div className="text-2xl font-black text-purple-700">{data?.hr.hires || 0}</div>
                                            <div className="text-[9px] uppercase font-bold text-purple-600/90 tracking-widest mt-0.5">Total</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); openDetailView("HR Recruitment", "HR"); }}
                            title="View Data Details"
                            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/50 text-purple-400 hover:text-purple-900 hover:bg-white transition-all z-20 opacity-0 group-hover:opacity-100"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                    </div>

                    {/* AI Insights Section */}
                    <div className="col-span-12 group relative overflow-hidden"
                        onMouseEnter={() => setIsInsightPaused(true)}
                        onMouseLeave={() => setIsInsightPaused(false)}>
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 via-fuchsia-600/10 to-indigo-600/10 rounded-3xl" />
                        <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-6 shadow-sm relative z-10 flex items-center gap-6 min-h-[120px]">

                            {/* Animated Icon */}
                            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shrink-0">
                                <Brain className="w-8 h-8 text-white animate-pulse" />
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 overflow-hidden">
                                <div className="flex items-center gap-2 mb-1">
                                    <Sparkles className="w-4 h-4 text-fuchsia-600" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-fuchsia-700">AI Intelligence</span>
                                </div>

                                <div className={cn("transition-all duration-500 ease-in-out transform", isInsightVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2")}>
                                    <h3 className="text-lg font-bold text-zinc-900 mb-1">{insights[currentInsightIndex].title}</h3>
                                    <p className="text-sm text-zinc-600 leading-relaxed max-w-3xl">
                                        {insights[currentInsightIndex].detail}
                                    </p>
                                </div>
                            </div>

                            {/* Progress Indicators */}
                            <div className="flex flex-col gap-2 shrink-0 mr-8">
                                {insights.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={cn(
                                            "w-1.5 h-1.5 rounded-full transition-all duration-300",
                                            idx === currentInsightIndex ? "bg-fuchsia-600 scale-125" : "bg-zinc-300"
                                        )}
                                    />
                                ))}
                            </div>

                            {/* Eye Button */}
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); openDetailView("AI Insights", "Intelligence"); }}
                                title="View Full Analysis"
                                className="absolute top-4 right-4 p-2 rounded-full bg-white text-zinc-400 hover:text-fuchsia-600 hover:bg-white shadow-sm border border-zinc-100 transition-all z-20 opacity-0 group-hover:opacity-100"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Closing Left Column (Bento Grid) */}
                </div>

                {/* Right Column: Smart Alerts Ticker - Spans 3 cols */}
                <div className="col-span-12 lg:col-span-3 h-[400px] lg:h-full min-h-[500px]">
                    <div className="h-full w-full bg-zinc-900 rounded-3xl p-6 flex flex-col relative overflow-hidden shadow-2xl">
                        <div className="flex items-center justify-between z-20 relative bg-zinc-900 pb-4 pt-2 border-b border-zinc-800">
                            <div className="flex items-center gap-2">
                                <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
                                <h3 className="font-bold text-white tracking-wide">Smart Alerts</h3>
                            </div>
                            <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-1 rounded">Last 7 Days</span>
                        </div>

                        {/* Alerts Container */}
                        <div className="flex-1 overflow-visible relative pr-2 hover-scroll group mt-4">
                            <div className="flex flex-col gap-4 w-full pb-4">
                                {alerts.map((alert, index) => (
                                    <div
                                        key={`${alert.id}-${index}`}
                                        className={`p-4 rounded-xl border backdrop-blur-sm transition-transform hover:scale-[1.02] ${alert.type === 'critical' ? 'bg-red-500/10 border-red-500/30' :
                                            alert.type === 'warning' ? 'bg-amber-500/10 border-amber-500/30' :
                                                'bg-zinc-800/50 border-zinc-700'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-1">
                                            <span className={`text-xs font-bold uppercase ${alert.type === 'critical' ? 'text-red-400' :
                                                alert.type === 'warning' ? 'text-amber-400' :
                                                    'text-blue-400'
                                                }`}>{alert.type}</span>
                                            <span className="text-[10px] text-zinc-500" suppressHydrationWarning>{new Date().toLocaleTimeString()}</span>
                                        </div>
                                        <h4 className="text-sm font-semibold text-zinc-100 mb-1">{alert.title}</h4>
                                        <p className="text-xs text-zinc-400 leading-relaxed">{alert.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-zinc-800 z-10">
                            <button className="w-full py-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
                                View System Logs
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
