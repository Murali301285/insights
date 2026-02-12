"use client"

import { useState } from "react"
import { PremiumCard } from "@/components/design/PremiumCard"
import {
    Package,
    Truck,
    Globe,
    CreditCard,
    ArrowUpRight,
    ArrowDownRight,
    Plus,
    Eye,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle2,
    Clock
} from "lucide-react"
import { useEffect } from "react"
import { useHeader } from "@/components/providers/HeaderProvider"
import { SmartEntrySheet } from "@/components/data-entry/SmartEntrySheet"
import { Button } from "@/components/ui/button"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts'



export default function SupplyChainPage() {
    const { setHeaderInfo } = useHeader()

    useEffect(() => {
        setHeaderInfo("Supply Chain Management", "Inventory optimization and supplier relationships.")
    }, [setHeaderInfo])
    const [period, setPeriod] = useState("Monthly")
    const [isEntryOpen, setIsEntryOpen] = useState(false)
    const [metrics, setMetrics] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/metrics?category=supplyChain&period=${period}`)
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

    const termsData = [
        { name: 'Cash', count: latest.cashTerms || 0, fill: '#10b981' },
        { name: 'Net 15', count: latest.net15Terms || 0, fill: '#3b82f6' },
        { name: 'Net 30', count: latest.net30Terms || 0, fill: '#64748b' },
        { name: 'Net 60', count: latest.net60Terms || 0, fill: '#f59e0b' },
    ]

    const sourcingData = [
        { name: 'Domestic', value: latest.domesticSource || 0, fill: '#8b5cf6' },
        { name: 'International', value: latest.intlSource || 0, fill: '#f43f5e' },
    ]

    // Live Logistics Feed
    const logisticsFeed = [
        { id: 1, title: "Shipment Arrived", desc: "Batch #4492 at Dock A.", time: "5m ago", type: "success" },
        { id: 2, title: "Customs Hold", desc: "Container #992 held for inspection.", time: "2h ago", type: "warning" },
        { id: 3, title: "New Supplier", desc: "TechComponents Ltd added.", time: "1d ago", type: "info" },
        { id: 4, title: "Route Update", desc: "Faster route found for EU lane.", time: "2d ago", type: "neutral" },
    ]

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Actions Bar */}
            <div className="flex justify-end items-center gap-4 mb-2">

                <div className="flex items-center gap-3">
                    <div className="flex items-center px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse mr-2" />
                        <span className="text-sm font-medium text-indigo-800">Logistics Live</span>
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
                                        <p className="text-sm font-medium text-zinc-500">Inventory Value</p>
                                        <h3 className="text-2xl font-bold text-zinc-900 mt-1">${(latest.inventoryValue || 0).toLocaleString()}</h3>
                                    </div>
                                    <div className="p-2 bg-indigo-50 rounded-xl">
                                        <Package className="w-5 h-5 text-indigo-600" />
                                    </div>
                                </div>
                                <div className="flex items-center text-xs text-indigo-600 font-medium bg-indigo-50 w-fit px-2 py-1 rounded-full">
                                    <ArrowUpRight className="w-3 h-3 mr-1" />
                                    +8.2% vs last month
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
                                        <p className="text-sm font-medium text-zinc-500">On-Time Delivery</p>
                                        <h3 className="text-2xl font-bold text-zinc-900 mt-1">{latest.onTimeDelivery || 0}%</h3>
                                    </div>
                                    <div className="p-2 bg-rose-50 rounded-xl">
                                        <Truck className="w-5 h-5 text-rose-600" />
                                    </div>
                                </div>
                                <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-rose-500 h-full transition-all duration-500" style={{ width: `${Math.min(latest.onTimeDelivery || 0, 100)}%` }} />
                                </div>
                                <div className="mt-2 text-[10px] text-zinc-400">Target: 95%</div>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-50 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
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
                                        <p className="text-sm font-medium text-zinc-500">Active Suppliers</p>
                                        <h3 className="text-2xl font-bold text-zinc-900 mt-1">{latest.activeSuppliers || 0}</h3>
                                    </div>
                                    <div className="p-2 bg-violet-50 rounded-xl">
                                        <Globe className="w-5 h-5 text-violet-600" />
                                    </div>
                                </div>
                                <div className="flex -space-x-2">
                                    <div className="w-6 h-6 rounded-full bg-zinc-200 border-2 border-white flex items-center justify-center text-[10px] font-bold">D</div>
                                    <div className="w-6 h-6 rounded-full bg-zinc-300 border-2 border-white flex items-center justify-center text-[10px] font-bold">I</div>
                                    <div className="w-6 h-6 rounded-full bg-zinc-100 border-2 border-white flex items-center justify-center text-[10px] text-zinc-500 font-bold">+</div>
                                </div>
                            </div>
                        </div>
                    </div>



                    {/* Supply Optimization Row (Inventory Turnover, Perfect Order, DSI) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-50 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
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
                                        <p className="text-sm font-medium text-zinc-500">Inventory Turnover</p>
                                        <h3 className="text-2xl font-bold text-zinc-900 mt-1">{latest.inventoryTurnover || 0}x</h3>
                                    </div>
                                    <div className="p-2 bg-violet-50 rounded-xl">
                                        <Package className="w-5 h-5 text-violet-600" />
                                    </div>
                                </div>
                                <div className="text-xs text-zinc-400">Turns per Year</div>
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
                                        <p className="text-sm font-medium text-zinc-500">Perfect Order Rate</p>
                                        <h3 className="text-2xl font-bold text-zinc-900 mt-1">{latest.perfectOrderRate || 0}%</h3>
                                    </div>
                                    <div className="p-2 bg-emerald-50 rounded-xl">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                    </div>
                                </div>
                                <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-emerald-500 h-full" style={{ width: `${Math.min(latest.perfectOrderRate || 0, 100)}%` }} />
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
                                        <p className="text-sm font-medium text-zinc-500">DSI</p>
                                        <h3 className="text-2xl font-bold text-zinc-900 mt-1">{latest.dsi || 0} Days</h3>
                                    </div>
                                    <div className="p-2 bg-amber-50 rounded-xl">
                                        <Clock className="w-5 h-5 text-amber-600" />
                                    </div>
                                </div>
                                <div className="text-xs text-zinc-400">Days Sales of Inventory</div>
                            </div>
                        </div>
                    </div>

                    {/* Chart Grid */}
                    <div className="grid grid-cols-12 gap-6 h-[400px]">
                        {/* Large Chart: Payment Terms */}
                        <div className="col-span-12 md:col-span-8 bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm relative overflow-hidden group">
                            <h3 className="font-bold text-zinc-900 mb-6 flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-zinc-400" />
                                Payment Terms Analysis
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
                                    <BarChart data={termsData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#52525b', fontSize: 12 }}
                                            dy={10}
                                        />
                                        <YAxis hide />
                                        <Tooltip
                                            cursor={{ fill: '#f4f4f5' }}
                                            contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7' }}
                                        />
                                        <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={50}>
                                            {termsData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Smaller Box: Sourcing Mix */}
                        <div className="col-span-12 md:col-span-4 bg-zinc-900 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between group">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
                            <div>
                                <h3 className="font-bold text-white mb-2 z-10 relative">Sourcing Mix</h3>
                                <p className="text-zinc-400 text-xs relative z-10">Geo-distribution by Volume</p>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsEntryOpen(true); }}
                                title="View Details"
                                className="absolute top-6 right-6 p-1.5 rounded-full bg-white/10 text-zinc-400 hover:text-white hover:bg-white/20 transition-all z-20 opacity-0 group-hover:opacity-100"
                            >
                                <Eye className="w-4 h-4" />
                            </button>

                            <div className="h-[200px] w-full relative z-10">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={sourcingData}
                                            cx="50%"
                                            cy="50%"
                                            strokeWidth={0}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {sourcingData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', color: '#000' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', color: '#fff' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Center Text */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                                    <span className="text-2xl font-bold text-white">{latest.domesticSource || 0}%</span>
                                    <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Domestic</span>
                                </div>
                            </div>

                            <Button variant="outline" size="sm" className="w-full bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10">
                                Supplier List
                            </Button>
                        </div>
                    </div>

                </div>

                {/* Right Column: Live Feed - Spans 3 cols */}
                <div className="col-span-12 lg:col-span-3 h-full min-h-[500px]">
                    <div className="h-full w-full bg-white rounded-3xl p-6 flex flex-col border border-zinc-200 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-zinc-900">Logistics Feed</h3>
                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        </div>

                        <div className="flex-1 space-y-4 overflow-hidden relative">
                            {/* Mock Feed Items */}
                            {logisticsFeed.map((item, i) => (
                                <div key={i} className="flex gap-3 items-start p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                                    <div className={`w-1.5 h-1.5 mt-2 rounded-full shrink-0 ${item.type === 'success' ? 'bg-emerald-500' : item.type === 'warning' ? 'bg-amber-500' : 'bg-indigo-500'}`} />
                                    <div>
                                        <h4 className="text-sm font-semibold text-zinc-900">{item.title}</h4>
                                        <p className="text-xs text-zinc-500">{item.desc}</p>
                                        <span className="text-[10px] text-zinc-400 mt-1 block">{item.time}</span>
                                    </div>
                                </div>
                            ))}

                            <div className="p-4 bg-indigo-50 rounded-2xl mt-8 border border-indigo-100">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-sm font-bold text-indigo-900">Next Shipment</h4>
                                    <span className="text-xs font-medium text-indigo-700 bg-indigo-200 px-2 py-0.5 rounded-full">In Transit</span>
                                </div>
                                <div className="text-xl font-bold text-indigo-800">4 Hours</div>
                                <p className="text-xs text-indigo-600 mt-1">Arrival at Dock B.</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <SmartEntrySheet
                isOpen={isEntryOpen}
                onClose={() => { setIsEntryOpen(false); fetchData(); }}
                category="supplyChain"
            />
        </div >
    )
}
