"use client"

import { useState, useEffect, useMemo } from "react"
import { PremiumCard } from "@/components/design/PremiumCard"
import { useHeader } from "@/components/providers/HeaderProvider"
import { useFilter } from "@/components/providers/FilterProvider"
import {
    Settings, AlertCircle, Clock, CheckCircle2,
    ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Plus, Eye,
    Activity, LayoutList
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn, formatCurrency } from "@/lib/utils"
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend, LabelList
} from 'recharts'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SmartEntrySheet } from "@/components/data-entry/SmartEntrySheet"

export default function ManufacturingPage() {
    const { setHeaderInfo } = useHeader()
    const { period: globalPeriod, currency, selectedCompanyIds } = useFilter()

    useEffect(() => {
        setHeaderInfo("Order Fulfilment", "Track RFQ volumes, production efficiency, and win order fulfillment.")
    }, [setHeaderInfo])

    const [isEntryOpen, setIsEntryOpen] = useState(false)
    const [isMetricsLogOpen, setIsMetricsLogOpen] = useState(false)
    const [logData, setLogData] = useState({
        efficiency: "", rfqNew: "", rfqStandard: "", rfqCustom: "",
        projectOnTrack: "", projectBehindSchedule: "", projectCritical: "",
        orderValue: "", productionVolume: ""
    })
    const handleLogSave = async () => {
        const processed = Object.fromEntries(Object.entries(logData).map(([k, v]) => [k, Number(v) || 0]));
        try {
            const res = await fetch('/api/metrics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category: "manufacturing", data: processed, date: new Date().toISOString().split("T")[0], period: "Weekly" })
            });
            if (res.ok) {
                // toast.success("Metrics saved");
                fetchData();
                setLogData({ efficiency: "", rfqNew: "", rfqStandard: "", rfqCustom: "", projectOnTrack: "", projectBehindSchedule: "", projectCritical: "", orderValue: "", productionVolume: "" })
                setIsMetricsLogOpen(false)
            }
        } catch (e) { }
    }

    const [metrics, setMetrics] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [localPeriod, setLocalPeriod] = useState("Weekly")

    const [projectModalOpen, setProjectModalOpen] = useState(false)
    const [rfqNewModalOpen, setRfqNewModalOpen] = useState(false)
    const [rfqStandardModalOpen, setRfqStandardModalOpen] = useState(false)
    const [rfqCustomModalOpen, setRfqCustomModalOpen] = useState(false)

    const [orders, setOrders] = useState<any[]>([])

    const fetchData = async () => {
        setLoading(true)
        try {
            const companyQuery = selectedCompanyIds?.length > 0 ? `companies=${selectedCompanyIds.join(',')}` : '';
            const metricsUrl = `/api/metrics?category=manufacturing&period=${localPeriod}${companyQuery ? `&${companyQuery}` : ''}`;
            const ordersUrl = `/api/manufacturing/orders${companyQuery ? `?${companyQuery}` : ''}`;

            const [metricsRes, ordersRes] = await Promise.all([
                fetch(metricsUrl),
                fetch(ordersUrl)
            ]);

            const [metricsData, ordersData] = await Promise.all([
                metricsRes.json(),
                ordersRes.json()
            ]);

            setMetrics(Array.isArray(metricsData) ? metricsData : [])
            setOrders(Array.isArray(ordersData) ? ordersData : [])
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

    const rfqNewDiff = getDiff(latest.rfqNew || 0, latest.prevRfqNew || 0)
    const rfqStandardDiff = getDiff(latest.rfqStandard || 0, latest.prevRfqStandard || 0)
    const rfqCustomDiff = getDiff(latest.rfqCustom || 0, latest.prevRfqCustom || 0)

    // Eff Trend
    const trendData = metrics.map((m: any) => ({
        name: new Date(m.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
        efficiency: m.efficiency || 0
    })).reverse()

    // Project Status Pie Data
    const projectStatusData = [
        { name: "On Track", value: latest.projectOnTrack || 0, color: "#10b981" },
        { name: "Behind Schedule", value: latest.projectBehindSchedule || 0, color: "#f59e0b" },
        { name: "Critical", value: latest.projectCritical || 0, color: "#f43f5e" }
    ]

    const totalProjects = (latest.projectOnTrack || 0) + (latest.projectBehindSchedule || 0) + (latest.projectCritical || 0)

    const activeWorkOrders: any[] = []

    const [customerChartMode, setCustomerChartMode] = useState<"values" | "orders">("values")

    const topCustomers: any[] = useMemo(() => {
        const aggs: Record<string, { name: string, value: number, orders: number }> = {};
        orders.forEach(o => {
            const cName = o.opportunity?.customer?.customerName || "Unknown Customer";
            if (!aggs[cName]) aggs[cName] = { name: cName, value: 0, orders: 0 };
            
            const val = o.orderValue !== null && o.orderValue !== undefined ? o.orderValue : (o.opportunity?.value || 0);
            aggs[cName].value += val;
            aggs[cName].orders += 1;
        });
        return Object.values(aggs).sort((a,b) => b.value - a.value).slice(0, 5); // top 5 customers
    }, [orders]);

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
                <Button onClick={() => setIsEntryOpen(true)} size="sm" className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg hover:shadow-xl transition-all h-9 rounded-full px-5">
                    <LayoutList className="w-4 h-4" />
                    Order Pipeline
                </Button>
            </div>

            <div className="grid grid-cols-12 gap-6 h-auto">
                <div className="col-span-12 lg:col-span-9 space-y-6">

                    {/* RFQ Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Total No of Orders */}
                        <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100/50 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300 relative">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-semibold text-emerald-800 text-sm mb-1">Total No of Orders</h3>
                                    <h2 className="text-3xl font-black text-zinc-900 tracking-tight">{latest.productionVolume || 0}</h2>
                                </div>
                                <div className="flex flex-col items-center gap-3">
                                    <button className="text-zinc-400 hover:text-emerald-600 transition-colors">
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <div className="bg-white p-2 rounded-full shadow-sm border border-emerald-100">
                                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center text-[10px] font-semibold w-fit px-2 py-0.5 rounded-full text-emerald-700 bg-white shadow-sm border border-emerald-100/50">
                                Manufacturing Quota
                            </div>
                        </div>

                        {/* Total Value */}
                        <div className="bg-rose-50/50 rounded-2xl p-5 border border-rose-100/50 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300 relative">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-semibold text-rose-800 text-sm mb-1">Total Value</h3>
                                    <h2 className="text-3xl font-black text-zinc-900 tracking-tight">{formatCurrency(latest.orderValue || 0, currency)}</h2>
                                </div>
                                <div className="flex flex-col items-center gap-3">
                                    <button onClick={() => setRfqStandardModalOpen(true)} className="text-zinc-400 hover:text-rose-600 transition-colors">
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <div className="bg-white p-2 rounded-full shadow-sm border border-rose-100">
                                        <CheckCircle2 className="w-5 h-5 text-rose-600" />
                                    </div>
                                </div>
                            </div>
                            <div className={`flex items-center text-[10px] font-semibold w-fit px-2 py-0.5 rounded-full bg-white shadow-sm border ${rfqStandardDiff > 0 ? 'text-emerald-700 border-emerald-200' : rfqStandardDiff < 0 ? 'text-rose-700 border-rose-200' : 'text-amber-700 border-amber-200'}`}>
                                {rfqStandardDiff > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : rfqStandardDiff < 0 ? <ArrowDownRight className="w-3 h-3 mr-1" /> : null}
                                {Math.abs(rfqStandardDiff).toFixed(1)}% vs prev {periodText}
                            </div>
                        </div>

                        {/* New Order (this week) */}
                        <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100/50 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300 relative">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-semibold text-blue-800 text-sm mb-1">New Order (this week)</h3>
                                    <div className="flex items-baseline gap-2">
                                        <h2 className="text-3xl font-black text-zinc-900 tracking-tight">{latest.rfqCustom || 0}</h2>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center gap-3">
                                    <button onClick={() => setRfqCustomModalOpen(true)} className="text-zinc-400 hover:text-blue-600 transition-colors">
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <div className="bg-white p-2 rounded-full shadow-sm border border-blue-100">
                                        <Settings className="w-5 h-5 text-blue-600" />
                                    </div>
                                </div>
                            </div>
                            <div className={`flex items-center text-[10px] font-semibold w-fit px-2 py-0.5 rounded-full bg-white shadow-sm border ${rfqCustomDiff > 0 ? 'text-blue-700 border-blue-200' : rfqCustomDiff < 0 ? 'text-rose-700 border-rose-200' : 'text-amber-700 border-amber-200'}`}>
                                {rfqCustomDiff > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : rfqCustomDiff < 0 ? <ArrowDownRight className="w-3 h-3 mr-1" /> : null}
                                {Math.abs(rfqCustomDiff).toFixed(1)}% vs prev {periodText}
                            </div>
                        </div>
                    </div>

                    {/* Deep Dive & Trend Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Project Status trigger */}
                        <div
                            className="bg-zinc-900 rounded-3xl p-6 shadow-xl relative overflow-hidden cursor-pointer group transition-all hover:scale-[1.01]"
                            onClick={() => setProjectModalOpen(true)}
                        >
                            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
                            <button
                                title="Deep Dive"
                                className="absolute top-6 right-6 p-1.5 rounded-full bg-white/10 text-zinc-400 group-hover:text-amber-400 group-hover:bg-amber-400/20 transition-all z-20"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-bold text-white text-lg">Project Status</h3>
                                </div>
                                <p className="text-zinc-400 text-sm mb-4">Total Active Projects: <span className="text-white font-bold">{totalProjects}</span></p>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg border border-white/5">
                                        <span className="text-xs text-zinc-400">On Track</span>
                                        <span className="text-sm font-bold text-emerald-400">{latest.projectOnTrack || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg border border-white/5">
                                        <span className="text-xs text-zinc-400">At Risk (Behind/Critical)</span>
                                        <span className="text-sm font-bold text-rose-400">{(latest.projectBehindSchedule || 0) + (latest.projectCritical || 0)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* OTIF Replacement for Efficiency */}
                        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-zinc-900 text-lg">On-Time Delivery</h3>
                                    <p className="text-zinc-500 text-sm">On-Time In-Full (OTIF)</p>
                                </div>
                                <div className="flex gap-2 relative z-20">
                                    <div className="p-2 bg-emerald-50 rounded-xl cursor-pointer" onClick={() => setIsMetricsLogOpen(true)}>
                                        <Activity className="w-5 h-5 text-emerald-600" />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className="flex items-baseline gap-2 mb-4">
                                    <span className="text-4xl font-black text-zinc-900 tracking-tight">70%</span>
                                </div>
                                <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `70%` }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chart Section */}
                    <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm relative overflow-hidden h-[300px]">
                        <h3 className="font-bold text-zinc-900 mb-6 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-zinc-400" />
                            Project Stages
                        </h3>
                        {(latest.stageData || projectStatusData).length > 0 ? (
                            <ResponsiveContainer width="100%" height="80%">
                                <BarChart data={latest.stageData || projectStatusData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                                    <RechartsTooltip
                                        cursor={{ fill: '#f4f4f5' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                        <LabelList dataKey="value" position="top" fill="#52525b" fontSize={12} fontWeight={600} />
                                        {(latest.stageData || projectStatusData).map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-zinc-400">No data available.</div>
                        )}
                    </div>

                    {/* Top Performing Customer Section */}
                    <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm relative overflow-hidden h-[340px]">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                                <LayoutList className="w-4 h-4 text-zinc-400" />
                                Top Performing Customer
                            </h3>
                            <div className="flex bg-zinc-50 border border-zinc-200 rounded-lg p-0.5 shadow-sm">
                                <button onClick={() => setCustomerChartMode("values")} className={cn("px-3 py-1.5 text-xs font-semibold rounded-md transition-all", customerChartMode === "values" ? "bg-white text-zinc-900 shadow-sm border border-zinc-200" : "text-zinc-500 hover:text-zinc-700")}>
                                    Values
                                </button>
                                <button onClick={() => setCustomerChartMode("orders")} className={cn("px-3 py-1.5 text-xs font-semibold rounded-md transition-all", customerChartMode === "orders" ? "bg-white text-zinc-900 shadow-sm border border-zinc-200" : "text-zinc-500 hover:text-zinc-700")}>
                                    No of Orders
                                </button>
                            </div>
                        </div>

                        {(() => {
                            const activeDataKey = customerChartMode === "values" ? "value" : "orders";
                            const sortedData = [...topCustomers].sort((a, b) => a[activeDataKey] - b[activeDataKey]);
                            
                            if (sortedData.length === 0) {
                                return <div className="flex h-[80%] items-center justify-center text-zinc-400">No data available.</div>
                            }

                            return (
                                <ResponsiveContainer width="100%" height="80%">
                                    <BarChart data={sortedData} layout="vertical" margin={{ top: 0, right: 60, left: 10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f4f4f5" />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 11, fontWeight: 500 }} width={100} />
                                        <RechartsTooltip
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                                            formatter={(val: any) => [customerChartMode === "values" ? formatCurrency(val, currency) : val, customerChartMode === "values" ? "Total Value" : "Orders"]}
                                        />
                                        <Bar dataKey={activeDataKey} fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24}>
                                            <LabelList dataKey={activeDataKey} position="right" formatter={(val: any) => customerChartMode === "values" ? formatCurrency(val, currency).replace(".00", "") : val} fill="#52525b" fontSize={11} fontWeight={600} />
                                            {sortedData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={['#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb'][index % 5]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            );
                        })()}
                    </div>
                </div>

                {/* Right Column */}
                <div className="col-span-12 lg:col-span-3 h-full min-h-[500px]">
                    <div className="h-full w-full bg-white rounded-3xl p-6 flex flex-col border border-zinc-200 shadow-sm align-start relative overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-zinc-900">Active Work Orders</h3>
                        </div>
                        <div className="flex-1 space-y-4 overflow-hidden relative">
                            {activeWorkOrders.map((order, i) => (
                                <div key={i} className="flex flex-col gap-2 p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-xs font-bold text-zinc-900">{order.id}</h4>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${order.status === 'On Track' ? 'bg-emerald-100 text-emerald-700' :
                                            order.status === 'Critical' ? 'bg-rose-100 text-rose-700' :
                                                'bg-amber-100 text-amber-700'
                                            }`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-500">{order.client}</p>
                                    <div className="h-1.5 w-full bg-zinc-200 rounded-full overflow-hidden mt-1">
                                        <div className={`h-full ${order.status === 'On Track' ? 'bg-emerald-500' :
                                            order.status === 'Critical' ? 'bg-rose-500' :
                                                'bg-amber-500'
                                            }`} style={{ width: `${order.progress}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Project Status Modal */}
            <Dialog open={projectModalOpen} onOpenChange={setProjectModalOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            Project Status <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full uppercase tracking-wider">Deep Dive</span>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-6 flex flex-col items-center">
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={projectStatusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {projectStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="w-full mt-6 space-y-3">
                            {projectStatusData.map((d, i) => (
                                <div key={i} className="flex justify-between items-center bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                                        <span className="font-semibold text-zinc-700">{d.name}</span>
                                    </div>
                                    <span className="font-bold text-zinc-900">{d.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* New RFQs Modal */}
            <Dialog open={rfqNewModalOpen} onOpenChange={setRfqNewModalOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">New RFQs Breakdown</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-xl">
                            <div>
                                <p className="text-sm text-blue-600 font-medium">Unhandled Requests</p>
                                <p className="text-2xl font-bold text-blue-700">{latest.rfqNew || 0}</p>
                            </div>
                            <LayoutList className="w-8 h-8 text-blue-500 opacity-50" />
                        </div>
                        <p className="text-sm text-zinc-500">This metric represents the number of incoming Requests for Quotation (RFQs) that have not yet been processed or categorized into Standard or Custom tiers.</p>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Standard RFQs Modal */}
            <Dialog open={rfqStandardModalOpen} onOpenChange={setRfqStandardModalOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Standard RFQs Breakdown</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                            <div>
                                <p className="text-sm text-emerald-600 font-medium">Standard Processing</p>
                                <p className="text-2xl font-bold text-emerald-700">{latest.rfqStandard || 0}</p>
                            </div>
                            <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-50" />
                        </div>
                        <p className="text-sm text-zinc-500">This metric shows the volume of RFQs categorized as 'Standard' (typically off-the-shelf components or recurring simple orders) during the selected period.</p>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Custom RFQs Modal */}
            <Dialog open={rfqCustomModalOpen} onOpenChange={setRfqCustomModalOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Custom RFQs Breakdown</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="flex items-center justify-between p-4 bg-purple-50 border border-purple-100 rounded-xl">
                            <div>
                                <p className="text-sm text-purple-600 font-medium">Custom Engineering</p>
                                <p className="text-2xl font-bold text-purple-700">{latest.rfqCustom || 0}</p>
                            </div>
                            <Settings className="w-8 h-8 text-purple-500 opacity-50" />
                        </div>
                        <p className="text-sm text-zinc-500">This metric represents RFQs that require specialized engineering, bespoke manufacturing routes, or non-standard parts, driving custom quoting cycles.</p>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isMetricsLogOpen} onOpenChange={setIsMetricsLogOpen}>
                <DialogContent className="sm:max-w-md bg-white border border-zinc-200">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center justify-between">
                            Quick Log Weekly KPIs
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Efficiency %</label>
                                <input type="number" className="w-full text-sm p-2 border rounded-lg focus:ring-1 focus:ring-emerald-500" value={logData.efficiency} onChange={e => setLogData({ ...logData, efficiency: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">New RFQs</label>
                                <input type="number" className="w-full text-sm p-2 border rounded-lg focus:ring-1 focus:ring-emerald-500" value={logData.rfqNew} onChange={e => setLogData({ ...logData, rfqNew: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">On Track Pj</label>
                                <input type="number" className="w-full text-sm p-2 border rounded-lg focus:ring-1 focus:ring-emerald-500" value={logData.projectOnTrack} onChange={e => setLogData({ ...logData, projectOnTrack: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Critical Pj</label>
                                <input type="number" className="w-full text-sm p-2 border rounded-lg focus:ring-1 focus:ring-emerald-500" value={logData.projectCritical} onChange={e => setLogData({ ...logData, projectCritical: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Order Value Ovrd</label>
                                <input type="number" placeholder="Optional" className="w-full text-sm p-2 border rounded-lg focus:ring-1 focus:ring-emerald-500" value={logData.orderValue} onChange={e => setLogData({ ...logData, orderValue: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Order Count Ovrd</label>
                                <input type="number" placeholder="Optional" className="w-full text-sm p-2 border rounded-lg focus:ring-1 focus:ring-emerald-500" value={logData.productionVolume} onChange={e => setLogData({ ...logData, productionVolume: e.target.value })} />
                            </div>
                        </div>
                        <Button onClick={handleLogSave} className="w-full bg-zinc-900 hover:bg-zinc-800 text-white mt-4 py-6 font-bold shadow-sm">Save Metrics</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <SmartEntrySheet
                isOpen={isEntryOpen}
                onClose={() => { setIsEntryOpen(false); fetchData(); }}
                category="manufacturing"
            />
        </div>
    )
}
