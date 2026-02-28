"use client"

import { useState, useEffect } from "react"
import { PremiumCard } from "@/components/design/PremiumCard"
import { useHeader } from "@/components/providers/HeaderProvider"
import { useFilter } from "@/components/providers/FilterProvider"
import { formatCurrency } from "@/lib/utils"
import {
    Truck, CheckCircle2, Package, Globe, Plus, AlertCircle,
    Building2, FileText, ScrollText, Eye, AreaChart as AreaChartIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, AreaChart, Area
} from 'recharts'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SmartEntrySheet } from "@/components/data-entry/SmartEntrySheet"

export default function SupplyChainPage() {
    const { setHeaderInfo } = useHeader()
    const { period, currency } = useFilter()

    useEffect(() => {
        setHeaderInfo("Supply Chain Management", "Monitor supplier payments, terms, and inventory health.")
    }, [setHeaderInfo])

    const [isEntryOpen, setIsEntryOpen] = useState(false)
    const [metrics, setMetrics] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const [termsModalOpen, setTermsModalOpen] = useState(false)

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

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">

            {/* Actions Bar */}
            <div className="flex justify-end items-center gap-4 mb-2">
                <Button onClick={() => setIsEntryOpen(true)} size="sm" className="gap-2 bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg hover:shadow-xl transition-all">
                    <Plus className="w-4 h-4" />
                    New Log
                </Button>
            </div>

            <div className="grid grid-cols-12 gap-6 h-auto">
                <div className="col-span-12 lg:col-span-9 space-y-6">

                    {/* KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <PremiumCard
                            title="Total Suppliers"
                            value={latest.totalSuppliers || 0}
                            icon={<Building2 className="w-4 h-4 text-emerald-600" />}
                            trend={{ value: 0, label: "Active vendors", positive: true }}
                        />
                        <PremiumCard
                            title="Payment Status"
                            value={formatCurrency(latest.outstandingPayments || 0, currency)}
                            icon={<FileText className="w-4 h-4 text-rose-600" />}
                            trend={{ value: 0, label: "Total outstanding payments", positive: false }}
                        />
                        <PremiumCard
                            title="On-Time Delivery"
                            value={`${latest.onTimeDelivery || 0}%`}
                            icon={<Truck className="w-4 h-4 text-blue-600" />}
                            trend={{ value: 0, label: "Network reliability", positive: true }}
                        />
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
                    <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm relative overflow-hidden h-[300px]">
                        <h3 className="font-bold text-zinc-900 mb-6 flex items-center gap-2">
                            <AreaChartIcon className="w-4 h-4 text-zinc-400" />
                            On-Time Delivery Trend
                        </h3>
                        {trendData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="80%">
                                <AreaChart data={trendData}>
                                    <defs>
                                        <linearGradient id="colorDelivery" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} domain={[0, 100]} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ fontSize: '12px' }}
                                    />
                                    <Area type="monotone" dataKey="delivery" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorDelivery)" name="On-Time %" />
                                </AreaChart>
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

            <SmartEntrySheet
                isOpen={isEntryOpen}
                onClose={() => { setIsEntryOpen(false); fetchData(); }}
                category="supplyChain"
            />
        </div>
    )
}
