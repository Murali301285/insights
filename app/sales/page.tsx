"use client"

import { useState, useEffect } from "react"
import { PremiumCard } from "@/components/design/PremiumCard"
import { useHeader } from "@/components/providers/HeaderProvider"
import { useFilter } from "@/components/providers/FilterProvider"
import { formatCurrency } from "@/lib/utils"
import {
    Users, Target, FileText, Briefcase, ArrowUpRight, TrendingUp,
    TrendingDown, Plus, CheckCircle2, LineChart, Eye
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
    const { period, currency } = useFilter()

    useEffect(() => {
        setHeaderInfo("Sales & Marketing", "Monitor funnel performance, customer acquisition, and revenue targets.")
    }, [setHeaderInfo])

    const [isEntryOpen, setIsEntryOpen] = useState(false)
    const [metrics, setMetrics] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const [funnelNumbersModalOpen, setFunnelNumbersModalOpen] = useState(false)
    const [funnelValueModalOpen, setFunnelValueModalOpen] = useState(false)

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

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">

            {/* Actions Bar */}
            <div className="flex justify-end items-center gap-4 mb-2">
                <Button onClick={() => setIsEntryOpen(true)} size="sm" className="gap-2 bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg hover:shadow-xl transition-all">
                    <Plus className="w-4 h-4" />
                    New Entry
                </Button>
            </div>

            <div className="grid grid-cols-12 gap-6 h-auto">
                <div className="col-span-12 lg:col-span-9 space-y-6">

                    {/* Overall Summary Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <PremiumCard title="Annual Target" value={formatCurrency(latest.annualTarget || 0, currency)} icon={<Target className="w-4 h-4 text-emerald-600" />} trend={{ value: 0, label: "Set for current year", positive: true }} />
                        <PremiumCard title="Orders YTD" value={`${latest.ordersYtdPct || 0}%`} icon={<Briefcase className="w-4 h-4 text-blue-600" />} trend={{ value: 0, label: "Of annual target", positive: true }} />
                        <PremiumCard title="Invoice YTD" value={`${latest.invoiceYtdPct || 0}%`} icon={<FileText className="w-4 h-4 text-purple-600" />} trend={{ value: 0, label: "Invoice conversion", positive: true }} />
                    </div>

                    {/* Funnel Deep Dives Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Funnel Numbers */}
                        <div
                            className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden cursor-pointer group hover:scale-[1.01]"
                            onClick={() => setFunnelNumbersModalOpen(true)}
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-zinc-900 text-lg">Funnel (Numbers)</h3>
                                        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold uppercase">Deep Dive</span>
                                    </div>
                                    <p className="text-zinc-500 text-sm">Lead to Order conversion</p>
                                </div>
                                <button className="p-1.5 rounded-full bg-zinc-50 text-zinc-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all z-20">
                                    <Eye className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex items-baseline gap-2 mb-4">
                                <span className="text-3xl font-bold text-zinc-900">{latest.leadsCount || 0} Leads</span>
                                <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">~{conversionRate.toFixed(1)}% Conversion</span>
                            </div>
                            <div className="flex gap-2 text-xs text-zinc-500">
                                <span>{latest.rfqCount || 0} RFQ</span> &bull; <span>{latest.quotesCount || 0} Quotes</span> &bull; <span>{latest.orderCount || 0} Orders</span>
                            </div>
                        </div>

                        {/* Funnel Value */}
                        <div
                            className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden cursor-pointer group hover:scale-[1.01]"
                            onClick={() => setFunnelValueModalOpen(true)}
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-zinc-900 text-lg">Funnel (Value)</h3>
                                        <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold uppercase">Deep Dive</span>
                                    </div>
                                    <p className="text-zinc-500 text-sm">Financial pipeline health</p>
                                </div>
                                <button className="p-1.5 rounded-full bg-zinc-50 text-zinc-400 group-hover:text-purple-600 group-hover:bg-purple-50 transition-all z-20">
                                    <Eye className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex items-baseline gap-2 mb-4">
                                <span className="text-3xl font-bold text-zinc-900">{formatCurrency(latest.quotesValue || 0, currency)}</span>
                            </div>
                            <div className="flex gap-2 text-xs text-zinc-500">
                                <span className="text-emerald-600 font-medium">Wins: {formatCurrency(latest.winValue || 0, currency)}</span> &bull;
                                <span className="text-rose-600 font-medium">Losses: {formatCurrency(latest.lossValue || 0, currency)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Chart Section */}
                    <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm relative overflow-hidden h-[300px]">
                        <h3 className="font-bold text-zinc-900 mb-6 flex items-center gap-2">
                            <LineChart className="w-4 h-4 text-zinc-400" />
                            Conversion Funnel Snapshot
                        </h3>
                        <ResponsiveContainer width="100%" height="80%">
                            <BarChart data={funnelNumberData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f4f4f5" />
                                <XAxis type="number" axisLine={false} tickLine={false} />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} width={80} />
                                <Tooltip
                                    cursor={{ fill: '#f4f4f5' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                                    {funnelNumberData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fillOpacity={1 - index * 0.15} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-3 h-full min-h-[500px]">
                    <div className="h-full w-full bg-white rounded-3xl p-6 flex flex-col border border-zinc-200 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-zinc-900">Recent Wins</h3>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <div className="flex-1 space-y-4 overflow-hidden relative">
                            {[1, 2, 3].map((item, i) => (
                                <div key={i} className="flex gap-3 items-start p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 shrink-0 flex items-center justify-center">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-zinc-900">Enterprise Contract</h4>
                                        <p className="text-xs text-zinc-500">TechCorp Inc.</p>
                                        <span className="text-[10px] text-zinc-400 mt-1 block">Closed just now</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Funnel Numbers Modal */}
            <Dialog open={funnelNumbersModalOpen} onOpenChange={setFunnelNumbersModalOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            Sales Funnel (Numbers) <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full uppercase tracking-wider">Deep Dive</span>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-6">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={funnelNumberData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip
                                        cursor={{ fill: '#f4f4f5' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                        <LabelList dataKey="value" position="top" style={{ fill: '#71717a', fontSize: 12, fontWeight: 600 }} />
                                        {funnelNumberData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill="#3b82f6" fillOpacity={1 - index * 0.15} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Funnel Values Modal */}
            <Dialog open={funnelValueModalOpen} onOpenChange={setFunnelValueModalOpen}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            Sales Funnel (Value) <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full uppercase tracking-wider">Deep Dive</span>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-6">
                        <div className="grid grid-cols-4 gap-4 mb-8 text-center">
                            {funnelValueData.map((d, i) => (
                                <div key={i} className="bg-zinc-50 p-4 rounded-[2rem] border border-zinc-100">
                                    <p className="text-xs font-semibold text-zinc-500 mb-1">{d.name}</p>
                                    <p className={`text-xl font-bold ${d.name === 'Wins' ? 'text-emerald-600' : d.name === 'Losses' ? 'text-rose-600' : 'text-zinc-900'}`}>{formatCurrency(d.value, currency)}</p>
                                </div>
                            ))}
                        </div>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={funnelValueData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f4f4f5" />
                                    <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(val) => formatCurrency(val, currency)} />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} width={80} />
                                    <Tooltip
                                        formatter={(val: number) => formatCurrency(val, currency)}
                                        cursor={{ fill: '#f4f4f5' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                        {funnelValueData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.name === 'Wins' ? '#10b981' : entry.name === 'Losses' ? '#f43f5e' : '#8b5cf6'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
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
