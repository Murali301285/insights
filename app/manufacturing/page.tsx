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
import { KpiInsightModal } from "@/components/modals/KpiInsightModal"

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
    const [projectStagesModalOpen, setProjectStagesModalOpen] = useState(false)
    const [topCustomerModalOpen, setTopCustomerModalOpen] = useState(false)
    const [insightModalOpen, setInsightModalOpen] = useState(false)
    const [insightData, setInsightData] = useState<{ title: string, metricKey: string, formulaDesc: string, formatType: "number" | "currency" | "percent" } | null>(null)

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

    const activeProjects = useMemo(() => {
        const today = new Date();
        today.setHours(0,0,0,0);

        return orders.filter(o => !o.isClosed).map(o => {
            let status = "On Track";
            if (o.targetDate) {
                const target = new Date(o.targetDate);
                target.setHours(0,0,0,0);
                const diffTime = today.getTime() - target.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays <= 0) {
                    status = "On Track";
                } else if (diffDays <= 5) {
                    status = "Behind Schedule";
                } else {
                    status = "Critical";
                }
            }
            return { ...o, calculatedStatus: status };
        });
    }, [orders]);

    const projectStats = useMemo(() => {
        let projectOnTrack = 0, projectBehindSchedule = 0, projectCritical = 0;
        activeProjects.forEach(p => {
            if (p.calculatedStatus === "On Track") projectOnTrack++;
            else if (p.calculatedStatus === "Behind Schedule") projectBehindSchedule++;
            else projectCritical++;
        });
        return { projectOnTrack, projectBehindSchedule, projectCritical, total: activeProjects.length };
    }, [activeProjects]);

    const otifPct = projectStats.total > 0 ? Math.round((projectStats.projectOnTrack / projectStats.total) * 100) : 100;

    // Project Status Pie Data
    const projectStatusData = [
        { name: "On Track", value: projectStats.projectOnTrack, color: "#10b981" },
        { name: "Behind Schedule", value: projectStats.projectBehindSchedule, color: "#f59e0b" },
        { name: "Critical", value: projectStats.projectCritical, color: "#f43f5e" }
    ]

    const totalProjects = projectStats.total;

    const activeWorkOrders = activeProjects;

    const [customerChartMode, setCustomerChartMode] = useState<"values" | "orders">("values")

    const allCustomerStats: any[] = useMemo(() => {
        const aggs: Record<string, any> = {};
        orders.forEach(o => {
            const cName = o.opportunity?.customer?.customerName || "Unknown Customer";
            const compName = o.opportunity?.customer?.company?.name || "Unknown Company";
            const uniqueKey = `${compName}_${cName}`;
            
            if (!aggs[uniqueKey]) {
                aggs[uniqueKey] = { 
                    name: cName, 
                    companyName: compName,
                    value: 0, 
                    orders: 0, 
                    lastOrderDate: null, 
                    lastOrderStatus: "",
                    completionDaysSum: 0,
                    completedOrders: 0
                };
            }
            
            const val = o.orderValue !== null && o.orderValue !== undefined ? o.orderValue : (o.opportunity?.value || 0);
            aggs[uniqueKey].value += val;
            aggs[uniqueKey].orders += 1;
            
            const oDate = o.date ? new Date(o.date) : null;
            if (oDate && (!aggs[uniqueKey].lastOrderDate || oDate > aggs[uniqueKey].lastOrderDate)) {
                aggs[uniqueKey].lastOrderDate = oDate;
                aggs[uniqueKey].lastOrderStatus = o.isClosed ? "Closed" : (o.currentStage?.name || o.currentStage?.stageName || "In Progress");
            }

            if (o.isClosed) {
                const closedDate = new Date(o.updatedAt);
                if (oDate && closedDate) {
                    const days = Math.ceil((closedDate.getTime() - oDate.getTime()) / (1000 * 3600 * 24));
                    aggs[uniqueKey].completionDaysSum += Math.max(0, days);
                    aggs[uniqueKey].completedOrders += 1;
                }
            }
        });
        
        return Object.values(aggs).map(c => ({
            ...c,
            avgCompletionDays: c.completedOrders > 0 ? Math.round(c.completionDaysSum / c.completedOrders) : '-'
        }));
    }, [orders]);

    const topCustomers: any[] = useMemo(() => {
        return [...allCustomerStats].sort((a,b) => b.value - a.value).slice(0, 5); 
    }, [allCustomerStats]);

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
                                    <button onClick={() => { setInsightData({ title: "Total No of Orders", metricKey: "productionVolume", formulaDesc: "Aggregated count of all manufacturing orders registered in the system during the selected period.", formatType: "number" }); setInsightModalOpen(true); }} className="text-zinc-400 hover:text-emerald-600 transition-colors">
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
                                    <button onClick={() => { setInsightData({ title: "Total Value", metricKey: "orderValue", formulaDesc: "Total financial gross value of all manufacturing orders mapped and recorded in the system.", formatType: "currency" }); setInsightModalOpen(true); }} className="text-zinc-400 hover:text-rose-600 transition-colors">
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

                        {/* New Orders */}
                        <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100/50 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300 relative">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-semibold text-blue-800 text-sm mb-1">New Orders</h3>
                                    <div className="flex items-baseline gap-2">
                                        <h2 className="text-3xl font-black text-zinc-900 tracking-tight">{latest.rfqCustom || 0}</h2>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center gap-3">
                                    <button onClick={() => { setInsightData({ title: "New Orders", metricKey: "rfqCustom", formulaDesc: "Count of new custom or incoming orders arriving for manufacturing evaluation during this period.", formatType: "number" }); setInsightModalOpen(true); }} className="text-zinc-400 hover:text-blue-600 transition-colors">
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
                                        <span className="text-sm font-bold text-emerald-400">{projectStats.projectOnTrack}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg border border-white/5">
                                        <span className="text-xs text-zinc-400">At Risk (Behind/Critical)</span>
                                        <span className="text-sm font-bold text-rose-400">{projectStats.projectBehindSchedule + projectStats.projectCritical}</span>
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
                                    <span className="text-4xl font-black text-zinc-900 tracking-tight">{otifPct}%</span>
                                </div>
                                <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${otifPct}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chart Section */}
                    <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm relative overflow-hidden h-[300px]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-zinc-400" />
                                Project Stages
                            </h3>
                            <button
                                title="Deep Dive"
                                onClick={() => setProjectStagesModalOpen(true)}
                                className="p-1.5 rounded-full bg-zinc-100 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 transition-all z-20"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                        </div>
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
                            <button
                                title="Deep Dive"
                                onClick={() => setTopCustomerModalOpen(true)}
                                className="p-1.5 ml-2 rounded-full bg-zinc-100 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 transition-all z-20"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            <div className="flex-1"></div>

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
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${order.calculatedStatus === 'On Track' ? 'bg-emerald-100 text-emerald-700' :
                                            order.calculatedStatus === 'Critical' ? 'bg-rose-100 text-rose-700' :
                                                'bg-amber-100 text-amber-700'
                                            }`}>
                                            {order.calculatedStatus}
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-500">{order.opportunity?.customer?.customerName || "Project"}</p>
                                    <div className="h-1.5 w-full bg-zinc-200 rounded-full overflow-hidden mt-1">
                                        <div className={`h-full ${order.calculatedStatus === 'On Track' ? 'bg-emerald-500' :
                                            order.calculatedStatus === 'Critical' ? 'bg-rose-500' :
                                                'bg-amber-500'
                                            }`} style={{ width: `${order.currentStage?.progress || 0}%` }} />
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
                            <div className="flex justify-between gap-4 mb-4">
                                {projectStatusData.map((d, i) => (
                                    <div key={i} className="flex-1 flex justify-between items-center bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                                            <span className="font-semibold text-xs text-zinc-700">{d.name}</span>
                                        </div>
                                        <span className="font-bold text-zinc-900">{d.value}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="w-full overflow-auto max-h-[300px] rounded-xl border border-zinc-200 custom-scrollbar">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase text-xs sticky top-0 z-10">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold">Order ID</th>
                                            <th className="px-4 py-3 font-semibold">Customer</th>
                                            <th className="px-4 py-3 font-semibold">Stage</th>
                                            <th className="px-4 py-3 font-semibold">Expected</th>
                                            <th className="px-4 py-3 font-semibold text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                        {activeProjects.map((p, i) => (
                                            <tr key={i} className="bg-white hover:bg-zinc-50 transition-colors">
                                                <td className="px-4 py-3 font-bold text-[11px] text-zinc-900">{p.id}</td>
                                                <td className="px-4 py-3 text-zinc-700 font-medium">{p.opportunity?.customer?.customerName || "Unknown"}</td>
                                                <td className="px-4 py-3 text-zinc-600 text-[11px]">{p.currentStage?.name || "Not Started"}</td>
                                                <td className="px-4 py-3 text-zinc-700">{p.targetDate ? new Date(p.targetDate).toLocaleDateString('en-GB') : "Not Set"}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${
                                                        p.calculatedStatus === 'On Track' ? 'bg-emerald-100 text-emerald-700' :
                                                        p.calculatedStatus === 'Critical' ? 'bg-rose-100 text-rose-700' :
                                                        'bg-amber-100 text-amber-700'
                                                    }`}>
                                                        {p.calculatedStatus}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {activeProjects.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">No active projects found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Project Stages Deep Dive Modal */}
            <Dialog open={projectStagesModalOpen} onOpenChange={setProjectStagesModalOpen}>
                <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            Project Stages
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 flex-1 overflow-y-auto custom-scrollbar">
                        <div className="w-full rounded-xl border border-zinc-200 shadow-sm bg-white overflow-x-auto custom-scrollbar">
                            <table className="w-full text-sm text-left whitespace-nowrap">
                                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase text-[10px] sticky top-0 z-10">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">Sl No</th>
                                        <th className="px-4 py-3 font-semibold">Order No</th>
                                        <th className="px-4 py-3 font-semibold">Order Description</th>
                                        <th className="px-4 py-3 font-semibold">Value</th>
                                        <th className="px-4 py-3 font-semibold">Customer</th>
                                        <th className="px-4 py-3 font-semibold">Company</th>
                                        <th className="px-4 py-3 font-semibold">Expected</th>
                                        <th className="px-4 py-3 font-semibold text-right">Complete Within</th>
                                        <th className="px-4 py-3 font-semibold text-right">Running Days</th>
                                        <th className="px-4 py-3 font-semibold">Current Stage</th>
                                        <th className="px-4 py-3 font-semibold text-right">Days Left/Elapsed</th>
                                        <th className="px-4 py-3 font-semibold">Incharge</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {activeProjects.map((p, i) => {
                                        const now = new Date();
                                        now.setHours(0,0,0,0);
                                        const orderDate = p.date ? new Date(p.date) : now;
                                        orderDate.setHours(0,0,0,0);
                                        const targetDate = p.targetDate ? new Date(p.targetDate) : null;
                                        if (targetDate) targetDate.setHours(0,0,0,0);

                                        const completeWithin = targetDate ? Math.ceil((targetDate.getTime() - orderDate.getTime()) / (1000 * 3600 * 24)) : 0;
                                        const targetDiffDays = targetDate ? Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 3600 * 24)) : 0;

                                        return (
                                            <tr key={i} className="hover:bg-zinc-50 transition-colors">
                                                <td className="px-4 py-3 font-medium text-zinc-900">{i + 1}</td>
                                                <td className="px-4 py-3 font-bold text-zinc-900">{p.orderNo || p.id}</td>
                                                <td className="px-4 py-3 text-zinc-700 truncate max-w-[200px]" title={p.opportunity?.opportunityName}>{p.opportunity?.opportunityName || "N/A"}</td>
                                                <td className="px-4 py-3 text-right font-medium text-emerald-600">{formatCurrency(p.orderValue !== null && p.orderValue !== undefined ? p.orderValue : (p.opportunity?.value || 0), currency)}</td>
                                                <td className="px-4 py-3 text-zinc-700 truncate max-w-[150px]">{p.opportunity?.customer?.customerName || "N/A"}</td>
                                                <td className="px-4 py-3 text-zinc-700 truncate max-w-[150px]">{p.opportunity?.customer?.company?.name || "N/A"}</td>
                                                <td className="px-4 py-3 text-zinc-700">{p.targetDate ? new Date(p.targetDate).toLocaleDateString('en-GB') : "Not Set"}</td>
                                                <td className="px-4 py-3 text-right font-medium">{completeWithin > 0 ? completeWithin : '-'}</td>
                                                <td className="px-4 py-3 text-right font-medium text-blue-600">{p.elapsedDays || 0}</td>
                                                <td className="px-4 py-3 text-zinc-600 text-[11px] font-semibold">
                                                    <span className="bg-zinc-100 text-zinc-700 px-2 py-1 rounded-md">{p.currentStage?.stageName || p.currentStage?.name || "Not Started"}</span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold">
                                                    {!targetDate ? '-' : targetDiffDays < 0 ? (
                                                        <span className="text-rose-500">{Math.abs(targetDiffDays)} overdue</span>
                                                    ) : (
                                                        <span className={targetDiffDays === 0 ? "text-amber-500" : "text-emerald-500"}>{targetDiffDays} left</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-zinc-600 truncate max-w-[120px]">{p.orderIncharge || "Unassigned"}</td>
                                            </tr>
                                        )
                                    })}
                                    {activeProjects.length === 0 && (
                                        <tr>
                                            <td colSpan={11} className="px-4 py-8 text-center text-zinc-500">No active orders found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Top Performing Customer Deep Dive Modal */}
            <Dialog open={topCustomerModalOpen} onOpenChange={setTopCustomerModalOpen}>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            Top Performing Customers <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full uppercase tracking-wider">{customerChartMode === 'values' ? 'Values View' : 'Orders View'}</span>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 flex-1 overflow-auto custom-scrollbar">
                        <div className="w-full rounded-xl border border-zinc-200 shadow-sm bg-white overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase text-xs sticky top-0 z-10">
                                    {customerChartMode === "values" ? (
                                        <tr>
                                            <th className="px-4 py-3 font-semibold">Sl no</th>
                                            <th className="px-4 py-3 font-semibold">Customer Name</th>
                                            <th className="px-4 py-3 font-semibold">Company</th>
                                            <th className="px-4 py-3 font-semibold text-right">Total Values</th>
                                            <th className="px-4 py-3 font-semibold">Last Order Date</th>
                                            <th className="px-4 py-3 font-semibold">Last Order Status</th>
                                            <th className="px-4 py-3 font-semibold text-right">Avg Completion Days</th>
                                        </tr>
                                    ) : (
                                        <tr>
                                            <th className="px-4 py-3 font-semibold">Sl no</th>
                                            <th className="px-4 py-3 font-semibold">Customer Name</th>
                                            <th className="px-4 py-3 font-semibold">Company</th>
                                            <th className="px-4 py-3 font-semibold text-right">No of Orders</th>
                                            <th className="px-4 py-3 font-semibold">Last Order Status</th>
                                            <th className="px-4 py-3 font-semibold text-right">Avg Completion Days</th>
                                        </tr>
                                    )}
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {[...allCustomerStats].sort((a, b) => b[customerChartMode === "values" ? "value" : "orders"] - a[customerChartMode === "values" ? "value" : "orders"]).map((c, i) => (
                                        <tr key={i} className="hover:bg-zinc-50 transition-colors">
                                            {customerChartMode === "values" ? (
                                                <>
                                                    <td className="px-4 py-3 font-medium text-zinc-900">{i + 1}</td>
                                                    <td className="px-4 py-3 text-zinc-700 font-semibold">{c.name}</td>
                                                    <td className="px-4 py-3 text-zinc-700">{c.companyName}</td>
                                                    <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatCurrency(c.value, currency)}</td>
                                                    <td className="px-4 py-3 text-zinc-500">{c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString('en-GB') : '-'}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${c.lastOrderStatus === 'Closed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                                            {c.lastOrderStatus || 'Unknown'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium text-zinc-600">{c.avgCompletionDays}</td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-4 py-3 font-medium text-zinc-900">{i + 1}</td>
                                                    <td className="px-4 py-3 text-zinc-700 font-semibold">{c.name}</td>
                                                    <td className="px-4 py-3 text-zinc-700">{c.companyName}</td>
                                                    <td className="px-4 py-3 text-right font-bold text-blue-600">{c.orders}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${c.lastOrderStatus === 'Closed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                                            {c.lastOrderStatus || 'Unknown'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium text-zinc-600">{c.avgCompletionDays}</td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                    {allCustomerStats.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">No customer records found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
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
            
            <KpiInsightModal
                open={insightModalOpen}
                onOpenChange={setInsightModalOpen}
                title={insightData?.title || null}
                metricKey={insightData?.metricKey || null}
                category="manufacturing"
                formulaDesc={insightData?.formulaDesc || null}
                formatType={insightData?.formatType}
            />
        </div>
    )
}
