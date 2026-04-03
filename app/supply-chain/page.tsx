"use client"

import { useState, useEffect } from "react"
import { PremiumCard } from "@/components/design/PremiumCard"
import { useHeader } from "@/components/providers/HeaderProvider"
import { useFilter } from "@/components/providers/FilterProvider"
import { formatCurrency } from "@/lib/utils"
import {
    Truck, CheckCircle2, Package, Globe, Plus, AlertCircle,
    Building2, FileText, ScrollText, Eye, AreaChart as AreaChartIcon,
    ArrowUpRight, ArrowDownRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, AreaChart, Area, LabelList
} from 'recharts'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { InventoryManager } from "@/components/data-entry/InventoryManager"
import { cn } from "@/lib/utils"

export default function SupplyChainPage() {
    const { setHeaderInfo } = useHeader()
    const { period: globalPeriod, currency } = useFilter()

    useEffect(() => {
        setHeaderInfo("Supply Chain Management", "Monitor supplier payments, terms, and inventory health.")
    }, [setHeaderInfo])

    const [isEntryOpen, setIsEntryOpen] = useState(false)
    const [metrics, setMetrics] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [localPeriod, setLocalPeriod] = useState("Weekly")

    const [termsModalOpen, setTermsModalOpen] = useState(false)
    const [suppliersModalOpen, setSuppliersModalOpen] = useState(false)
    const [paymentModalOpen, setPaymentModalOpen] = useState(false)
    const [deliveryModalOpen, setDeliveryModalOpen] = useState(false)
    const [supplierMetricMode, setSupplierMetricMode] = useState<"Values" | "Shipments">("Values")

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/metrics?category=supplyChain&period=${localPeriod}`)
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
    }, [localPeriod])

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

    const suppliersDiff = getDiff(latest.totalSuppliers || 0, latest.prevTotalSuppliers || 0)
    const paymentDiff = getDiff(latest.outstandingPayments || 0, latest.prevOutstandingPayments || 0)
    const deliveryDiff = getDiff(latest.onTimeDelivery || 0, latest.prevOnTimeDelivery || 0)

    // Supplier Terms Data
    const termsData = [
        { name: "Advance", value: latest.cashAdvanceTerms || 0, color: "#f59e0b" },
        { name: "Net 15", value: latest.net15Terms || 0, color: "#10b981" },
        { name: "Net 30", value: latest.net30Terms || 0, color: "#3b82f6" },
        { name: "Net 60", value: latest.net60Terms || 0, color: "#8b5cf6" },
        { name: "Net 90+", value: latest.net90Terms || 0, color: "#f43f5e" }
    ]

    // Trend
    const trendData = metrics.map((m: any) => ({
        name: new Date(m.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
        delivery: m.onTimeDelivery || 0
    })).reverse()

    const activeShipments = [
        { id: "SHP-782", origin: "Shenzhen", dest: "NY Hub", status: "In Transit", eta: "2 Days" },
        { id: "SHP-783", origin: "Berlin", dest: "London", status: "Customs", eta: "Delayed" },
        { id: "SHP-784", origin: "Texas", dest: "NY Hub", status: "Delivered", eta: "Today" },
    ]

    const topSuppliersData = [
        { name: "TechNova Corp", value: 450000, shipments: 124 },
        { name: "Global Logistics", value: 380000, shipments: 98 },
        { name: "Apex Supply Co", value: 320000, shipments: 112 },
        { name: "Nexus Industries", value: 290000, shipments: 76 },
        { name: "Prime Resources", value: 210000, shipments: 54 }
    ]

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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Total Suppliers */}
                        <div className="bg-white rounded-2xl p-5 border border-zinc-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-semibold text-zinc-500 text-sm mb-1">Total Suppliers</h3>
                                    <h2 className="text-3xl font-black text-zinc-900 tracking-tight">{latest.totalSuppliers || 0}</h2>
                                    <p className="text-sm font-bold text-zinc-400 mt-1">Active suppliers: {latest.totalSuppliers || 0}</p>
                                </div>
                                <div className="flex flex-col items-center gap-3 relative z-20">
                                    <button onClick={() => setSuppliersModalOpen(true)} className="text-zinc-400 hover:text-emerald-600 transition-colors">
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <div className="bg-emerald-50 p-2 rounded-full shadow-sm border border-emerald-100/50">
                                        <Building2 className="w-5 h-5 text-emerald-600" />
                                    </div>
                                </div>
                            </div>
                            <div className={`flex items-center text-[10px] font-semibold w-fit px-2 py-0.5 rounded-full border bg-white ${suppliersDiff > 0 ? 'text-emerald-700 border-emerald-200' : suppliersDiff < 0 ? 'text-rose-700 border-rose-200' : 'text-amber-700 border-amber-200'}`}>
                                {suppliersDiff > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : suppliersDiff < 0 ? <ArrowDownRight className="w-3 h-3 mr-1" /> : null}
                                {Math.abs(suppliersDiff).toFixed(1)}% vs prev {periodText}
                            </div>
                        </div>

                        {/* Total No of Shipments */}
                        <div className="bg-white rounded-2xl p-5 border border-zinc-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-semibold text-zinc-500 text-sm mb-1">Total No of Shipments</h3>
                                    <h2 className="text-3xl font-black text-zinc-900 tracking-tight">{latest.totalSuppliers ? latest.totalSuppliers * 14 : 0}</h2>
                                    <div className="flex gap-4 mt-1">
                                        <p className="text-sm font-bold text-amber-500 tracking-tight">InTransit: 45</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center gap-3 relative z-20">
                                    <button onClick={() => setPaymentModalOpen(true)} className="text-zinc-400 hover:text-rose-600 transition-colors">
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <div className="bg-rose-50 p-2 rounded-full shadow-sm border border-rose-100/50">
                                        <Truck className="w-5 h-5 text-rose-600" />
                                    </div>
                                </div>
                            </div>
                            <div className={`flex items-center text-[10px] font-semibold w-fit px-2 py-0.5 rounded-full border bg-white ${paymentDiff < 0 ? 'text-emerald-700 border-emerald-200' : paymentDiff > 0 ? 'text-rose-700 border-rose-200' : 'text-amber-700 border-amber-200'}`}>
                                {paymentDiff < 0 ? <ArrowDownRight className="w-3 h-3 mr-1" /> : paymentDiff > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : null}
                                {Math.abs(paymentDiff).toFixed(1)}% vs prev {periodText}
                            </div>
                        </div>

                        {/* Payment Status */}
                        <div className="bg-white rounded-2xl p-5 border border-zinc-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-semibold text-zinc-500 text-sm mb-1">Payment Status</h3>
                                    <h2 className="text-3xl font-black text-zinc-900 tracking-tight">{formatCurrency(latest.outstandingPayments || 0, currency)}</h2>
                                    <div className="flex gap-3 mt-1 text-[11px] font-bold text-zinc-400 mt-2">
                                        <span>Credit: <span className="text-zinc-600">{formatCurrency((latest.outstandingPayments || 0) * 0.4, currency)}</span></span>
                                        <span className="text-emerald-600 border-l border-zinc-200 pl-3">Pay this week: {formatCurrency((latest.outstandingPayments || 0) * 0.2, currency)}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center gap-3 relative z-20">
                                    <button onClick={() => setDeliveryModalOpen(true)} className="text-zinc-400 hover:text-blue-600 transition-colors">
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <div className="bg-blue-50 p-2 rounded-full shadow-sm border border-blue-100/50">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                    </div>
                                </div>
                            </div>
                            <div className={`flex items-center text-[10px] font-semibold w-fit px-2 py-0.5 rounded-full border bg-white ${deliveryDiff > 0 ? 'text-emerald-700 border-emerald-200' : deliveryDiff < 0 ? 'text-rose-700 border-rose-200' : 'text-amber-700 border-amber-200'}`}>
                                {deliveryDiff > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : deliveryDiff < 0 ? <ArrowDownRight className="w-3 h-3 mr-1" /> : null}
                                {Math.abs(deliveryDiff).toFixed(1)}% vs prev {periodText}
                            </div>
                        </div>
                    </div>

                    {/* Deep Dives */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Supplier Terms */}
                        <div
                            className="bg-zinc-900 rounded-3xl p-6 shadow-xl relative overflow-hidden cursor-pointer group transition-all hover:scale-[1.01]"
                            onClick={() => setTermsModalOpen(true)}
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
                                    <h3 className="font-bold text-white text-lg">Supplier Terms</h3>
                                    <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-semibold uppercase">Deep Dive</span>
                                </div>
                                <p className="text-zinc-400 text-sm mb-4">Payment term distribution</p>
                                <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-500/20 rounded-lg">
                                            <ScrollText className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <div>
                                            <div className="text-xs text-zinc-400">Most Common</div>
                                            <div className="text-sm font-bold text-white">Net 30 ({latest.net30Terms || 0})</div>
                                        </div>
                                    </div>
                                    <div className="text-xs text-zinc-500 text-right">
                                        Total Terms<br />
                                        <span className="text-white font-semibold">{(latest.cashAdvanceTerms || 0) + (latest.net15Terms || 0) + (latest.net30Terms || 0) + (latest.net60Terms || 0) + (latest.net90Terms || 0)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Inventory Value */}
                        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-zinc-900 text-lg">Inventory Value</h3>
                                    <p className="text-zinc-500 text-sm">Capital locked in stock</p>
                                </div>
                                <div className="p-2 bg-purple-50 rounded-xl">
                                    <Package className="w-5 h-5 text-purple-600" />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2 mb-4">
                                <span className="text-3xl font-bold text-zinc-900">{formatCurrency(latest.inventoryValue || 0, currency)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Chart Section */}
                        <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm relative overflow-hidden flex flex-col gap-6">
                        {/* Top Performers Chart */}
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-zinc-400" />
                                    Top Performing Supplier
                                </h3>
                                <div className="flex bg-zinc-50 p-1 rounded-md border border-zinc-200/60">
                                    <button
                                        onClick={() => setSupplierMetricMode("Values")}
                                        className={cn("px-4 py-1.5 text-xs rounded font-semibold transition-all", supplierMetricMode === "Values" ? "bg-white text-zinc-900 shadow-sm border border-zinc-200/40" : "text-zinc-500 hover:text-zinc-800")}
                                    >
                                        Values
                                    </button>
                                    <button
                                        onClick={() => setSupplierMetricMode("Shipments")}
                                        className={cn("px-4 py-1.5 text-xs rounded font-semibold transition-all", supplierMetricMode === "Shipments" ? "bg-white text-zinc-900 shadow-sm border border-zinc-200/40" : "text-zinc-500 hover:text-zinc-800")}
                                    >
                                        No of Shipments
                                    </button>
                                </div>
                            </div>
                            <div className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    {(() => {
                                        const sortedData = [...topSuppliersData].sort((a, b) => supplierMetricMode === "Values" ? b.value - a.value : b.shipments - a.shipments);
                                        const getBarColor = (index: number, mode: string) => {
                                            const blueGradient = ["#1d4ed8", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd"];
                                            const emeraldGradient = ["#047857", "#059669", "#10b981", "#34d399", "#6ee7b7"];
                                            const colors = mode === "Values" ? blueGradient : emeraldGradient;
                                            return colors[Math.min(index, colors.length - 1)];
                                        };
                                        return (
                                    <BarChart data={sortedData} layout="vertical" margin={{ top: 0, right: 80, left: 40, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f4f4f5" />
                                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#3f3f46', fontSize: 13, fontWeight: 600 }} />
                                        <Tooltip
                                            cursor={{ fill: '#f4f4f5' }}
                                            contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            formatter={(value: any) => supplierMetricMode === "Values" ? formatCurrency(value, currency) : [value, "Shipments"]}
                                        />
                                        <Bar dataKey={supplierMetricMode === "Values" ? "value" : "shipments"} radius={[0, 4, 4, 0]} maxBarSize={28}>
                                            {sortedData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={getBarColor(index, supplierMetricMode)} />
                                            ))}
                                            <LabelList 
                                                dataKey={supplierMetricMode === "Values" ? "value" : "shipments"} 
                                                position="right" 
                                                fontSize={12} 
                                                fontWeight={700} 
                                                fill="#52525b" 
                                                formatter={(value: any) => supplierMetricMode === "Values" ? formatCurrency(value, currency) : value} 
                                            />
                                        </Bar>
                                    </BarChart>
                                    );
                                    })()}
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Inactive Suppliers */}
                        <div className="border-t border-zinc-100 pt-6">
                            <h3 className="font-bold text-zinc-900 flex items-center gap-2 mb-4">
                                <AlertCircle className="w-4 h-4 text-rose-400" />
                                Inactive Suppliers
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[
                                    { name: "Zenith Materials", days: 65, lastDelivery: "Jan 12" },
                                    { name: "Oasis Fabrics", days: 82, lastDelivery: "Dec 25" },
                                    { name: "Vanguard Parts", days: 120, lastDelivery: "Nov 15" }
                                ].map((inc, i) => (
                                    <div key={i} className="bg-rose-50/40 border border-rose-100/50 p-4 rounded-xl flex flex-col justify-between hover:bg-rose-50/80 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="font-bold text-zinc-900 text-sm truncate">{inc.name}</p>
                                            <div className="text-right flex-shrink-0">
                                                <p className="font-black text-rose-600 leading-none">{inc.days}</p>
                                                <p className="text-[9px] uppercase font-bold text-rose-400/80 tracking-wider">Days</p>
                                            </div>
                                        </div>
                                        <p className="text-xs font-semibold text-zinc-500 mt-auto">Last delivery: {inc.lastDelivery}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="col-span-12 lg:col-span-3 h-full min-h-[500px]">
                    <div className="h-full w-full bg-white rounded-3xl p-6 flex flex-col border border-zinc-200 shadow-sm align-start relative overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-zinc-900">Active Shipments</h3>
                        </div>
                        <div className="flex-1 space-y-4 overflow-hidden relative">
                            {activeShipments.map((ship, i) => (
                                <div key={i} className="flex flex-col gap-2 p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-xs font-bold text-zinc-900">{ship.id}</h4>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${ship.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' :
                                            ship.status === 'Delayed' || ship.status === 'Customs' ? 'bg-rose-100 text-rose-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                            {ship.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-zinc-500 mt-2">
                                        <span className="font-medium">{ship.origin}</span>
                                        <div className="flex-1 border-t border-dashed border-zinc-300 mx-2 relative">
                                            <Truck className="w-3 h-3 text-zinc-400 absolute -top-1.5 left-1/2 -translate-x-1/2 bg-zinc-50 px-0.5" />
                                        </div>
                                        <span className="font-medium">{ship.dest}</span>
                                    </div>
                                    <div className="text-[10px] text-zinc-400 text-center mt-2 font-medium tracking-wide">
                                        ETA: {ship.eta}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Supplier Terms Modal */}
            <Dialog open={termsModalOpen} onOpenChange={setTermsModalOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            Supplier Terms <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full uppercase tracking-wider">Deep Dive</span>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-6 flex flex-col items-center">
                        <div className="h-[250px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={termsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip
                                        cursor={{ fill: '#f4f4f5' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                        {termsData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="grid grid-cols-5 gap-3 mt-8 w-full">
                            {termsData.map((d, i) => (
                                <div key={i} className="flex flex-col items-center text-center bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                                    <p className="text-xs font-semibold text-zinc-500 mb-1 leading-tight">{d.name}</p>
                                    <p className="text-lg font-bold text-zinc-900">{d.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Total Suppliers Modal */}
            <Dialog open={suppliersModalOpen} onOpenChange={setSuppliersModalOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Supplier Network Details</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                            <div>
                                <p className="text-sm text-emerald-600 font-medium">Active Vendors</p>
                                <p className="text-2xl font-bold text-emerald-700">{latest.totalSuppliers || 0}</p>
                            </div>
                            <Building2 className="w-8 h-8 text-emerald-500 opacity-50" />
                        </div>
                        <p className="text-sm text-zinc-500">This metric represents the total number of active vendors and suppliers integrated into your supply chain network for the selected period.</p>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Payment Status Modal */}
            <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Outstanding Payments Details</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-100 rounded-xl">
                            <div>
                                <p className="text-sm text-rose-600 font-medium">Pending Approvals</p>
                                <p className="text-2xl font-bold text-rose-700">{formatCurrency(latest.outstandingPayments || 0, currency)}</p>
                            </div>
                            <FileText className="w-8 h-8 text-rose-500 opacity-50" />
                        </div>
                        <p className="text-sm text-zinc-500">This metric indicates the total value of outstanding supplier invoices that have been received but are awaiting payment or final authorization.</p>
                    </div>
                </DialogContent>
            </Dialog>

            {/* On-Time Delivery Modal */}
            <Dialog open={deliveryModalOpen} onOpenChange={setDeliveryModalOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">On-Time Delivery Performance</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-xl">
                            <div>
                                <p className="text-sm text-blue-600 font-medium">SLA Completion</p>
                                <p className="text-2xl font-bold text-blue-700">{latest.onTimeDelivery || 0}%</p>
                            </div>
                            <Truck className="w-8 h-8 text-blue-500 opacity-50" />
                        </div>
                        <p className="text-sm text-zinc-500">This percentage indicates how many supply shipments arrived within the designated contractual delivery window, measuring vendor reliability.</p>
                    </div>
                </DialogContent>
            </Dialog>

            <InventoryManager
                isOpen={isEntryOpen}
                onClose={() => { setIsEntryOpen(false); fetchData(); }}
            />
        </div>
    )
}
